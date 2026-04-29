/**
 * Grant enrichment — fetch each grant's source page, ask Haiku to extract the
 * structured fields the detail page needs (open date, difficulty, eligibility,
 * required documents, application URL, contact info, co-financing %), and
 * write them back to the row.
 *
 * Why a separate module rather than running this inside the ingest transform?
 *  - Source pages are slow (1-5s + retries) and the LLM call adds another 3-8s.
 *    Running inline would 10x ingestion time and bust the 300s Vercel budget.
 *  - Failures here are recoverable (the row still exists, we just retry later)
 *    so they shouldn't bubble up and abort an ingestion run.
 *  - Some sources already provide structured data (Aides-Territoires,
 *    EU SEDIA) — those mappings live in the ingestion transforms and the
 *    enricher's job is to fill the *gaps* once enriched_at is null.
 */

import { logAiUsage } from "./usage-tracker";

// Public Haiku model ID — same family as scoring.ts. Pinned to the
// 2025-10-01 release because it's the latest stable Haiku 4.5.
const ENRICHER_MODEL = "claude-haiku-4-5-20251001";

// Cap on the page content we feed Haiku. ~30k chars ≈ 7-8k tokens — plenty
// for a typical grant page once HTML is stripped, and well under Haiku's
// context budget. Going bigger costs money for very small marginal accuracy
// gains on long ToS-laden funder pages.
const MAX_PAGE_CHARS = 30_000;

// Per-page fetch timeout. Source servers occasionally hang forever on
// slow CDN edges; we don't want one bad URL to wedge the batch.
const FETCH_TIMEOUT_MS = 15_000;

export type DifficultyLevel = "easy" | "medium" | "hard" | "expert";

export interface EnrichmentResult {
  open_date: string | null;
  difficulty_level: DifficultyLevel | null;
  eligibility_conditions: string | null;
  required_documents: string[] | null;
  application_url: string | null;
  contact_info: string | null;
  co_financing_pct: number | null;
}

export interface GrantToEnrich {
  id: string;
  source_url: string;
  title: string | null;
  summary?: string | null;
  funder?: string | null;
}

interface EnrichmentDebug {
  fetched_at: string;
  page_chars: number | null;
  model: string;
  // When the path completes cleanly we still write the raw extraction so
  // future bugs (e.g. dropped field) can be traced back without re-fetching.
  extracted?: EnrichmentResult;
  error?: { stage: "fetch" | "llm" | "parse"; message: string };
}

function getSupabaseCreds() {
  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  };
}

/**
 * Fetch a public webpage with browser-like headers. Many funder portals
 * block default node UA strings (1and1, Akamai, Cloudflare WAFs) so
 * pretending to be a recent Chrome dramatically improves hit rate.
 */
async function fetchPage(url: string): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        "Accept":
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
        "Cache-Control": "no-cache",
      },
      signal: ctrl.signal,
      redirect: "follow",
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Reduce raw HTML to text Haiku can reason about. We don't run a real DOM
 * parser — too heavy for an Edge / serverless worker — so this is a pragmatic
 * sequence of regex passes that drops scripts/styles/nav chrome and collapses
 * whitespace. Good enough for funder pages, which are content-heavy.
 */
export function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function buildPrompt(grant: GrantToEnrich, pageText: string): string {
  return `Tu es un assistant qui extrait des informations structurées d'une page web décrivant une subvention ou un appel à projets.

Voici ce que je sais déjà sur la subvention :
- Titre : ${grant.title ?? "(inconnu)"}
- Bailleur : ${grant.funder ?? "(inconnu)"}
- URL source : ${grant.source_url}

Voici le contenu de la page (HTML déjà nettoyé, tronqué si nécessaire) :
"""
${pageText.slice(0, MAX_PAGE_CHARS)}
"""

Extrais les champs suivants. Si une information est absente ou ambiguë, mets null — n'INVENTE jamais.

Réponds UNIQUEMENT avec un objet JSON valide ayant exactement ces clés :
{
  "open_date": "YYYY-MM-DD" ou null,             // date d'ouverture du dépôt
  "difficulty_level": "easy" | "medium" | "hard" | "expert" | null,
  "eligibility_conditions": string ou null,       // 1-3 phrases résumant qui peut candidater (statut, taille, secteur, territoire)
  "required_documents": [string, ...] ou null,    // liste courte des pièces à fournir (ex: "RIB", "Lettre de motivation", "Statuts")
  "application_url": string ou null,              // URL directe vers le formulaire de candidature (différent de la page d'info)
  "contact_info": string ou null,                 // email ou téléphone de contact
  "co_financing_pct": number ou null              // entier 0-100, pourcentage de cofinancement requis (part à la charge du porteur)
}

Règles pour difficulty_level (juge selon la longueur du dossier, le nombre de pièces, la sélectivité) :
- easy : formulaire en ligne court, < 5 pièces, sélection légère
- medium : dossier classique avec budget + lettre, jury simple
- hard : appel à projets avec rapport détaillé, jury thématique, audition possible
- expert : programme européen ou recherche multi-partenaires, due diligence longue

Réponds en JSON strict, sans préambule ni commentaire, sans bloc markdown.`;
}

/**
 * Loose JSON extraction — Haiku usually replies with a clean object, but
 * occasionally wraps it in ```json fences or adds a leading "Voici…". The
 * regex grabs the first {...} block; JSON.parse does the rest.
 */
function extractJson(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object in LLM response");
  return JSON.parse(match[0]);
}

function clampPct(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  const n = Math.round(v);
  if (n < 0 || n > 100) return null;
  return n;
}

function asString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s.length === 0 ? null : s;
}

function asStringArray(v: unknown): string[] | null {
  if (!Array.isArray(v)) return null;
  const out = v
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return out.length === 0 ? null : out;
}

function asDifficulty(v: unknown): DifficultyLevel | null {
  if (typeof v !== "string") return null;
  const lower = v.trim().toLowerCase();
  if (lower === "easy" || lower === "medium" || lower === "hard" || lower === "expert") {
    return lower;
  }
  return null;
}

function asIsoDate(v: unknown): string | null {
  const s = asString(v);
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/**
 * Coerce the LLM's JSON into the strict EnrichmentResult shape. Defensive on
 * purpose: we get bad types ("oui" instead of a percentage, dates like
 * "à confirmer", arrays of nulls) more often than not on the long tail of
 * portals.
 */
function normalize(raw: unknown): EnrichmentResult {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    open_date: asIsoDate(obj.open_date),
    difficulty_level: asDifficulty(obj.difficulty_level),
    eligibility_conditions: asString(obj.eligibility_conditions),
    required_documents: asStringArray(obj.required_documents),
    application_url: asString(obj.application_url),
    contact_info: asString(obj.contact_info),
    co_financing_pct: clampPct(obj.co_financing_pct),
  };
}

async function callHaiku(prompt: string): Promise<{ text: string; usage: { input_tokens: number; output_tokens: number } | null }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: ENRICHER_MODEL,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Claude API ${res.status}: ${detail.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text ?? "";
  return { text, usage: data.usage ?? null };
}

async function patchGrant(
  id: string,
  patch: Record<string, unknown>
): Promise<void> {
  const { supabaseUrl, serviceKey } = getSupabaseCreds();
  const res = await fetch(`${supabaseUrl}/rest/v1/grants?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Supabase PATCH ${res.status}: ${errText.slice(0, 200)}`);
  }
}

/**
 * Enrich one grant. Always sets `enriched_at` on the way out — even on
 * failure — so the queue moves forward instead of looping on the same broken
 * URL forever. The error trail lives in `enrichment_data` for audit.
 */
export async function enrichGrant(
  grant: GrantToEnrich
): Promise<{ ok: boolean; result?: EnrichmentResult; error?: string }> {
  const debug: EnrichmentDebug = {
    fetched_at: new Date().toISOString(),
    page_chars: null,
    model: ENRICHER_MODEL,
  };

  let pageText: string;
  try {
    const html = await fetchPage(grant.source_url);
    pageText = htmlToText(html);
    debug.page_chars = pageText.length;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    debug.error = { stage: "fetch", message };
    await patchGrant(grant.id, {
      enriched_at: new Date().toISOString(),
      enrichment_data: debug,
    }).catch(() => {});
    return { ok: false, error: `fetch: ${message}` };
  }

  let llmText: string;
  try {
    const prompt = buildPrompt(grant, pageText);
    const { text, usage } = await callHaiku(prompt);
    llmText = text;
    if (usage) {
      // Best-effort cost telemetry — never blocks the enrichment write.
      logAiUsage({
        action: "enrich",
        model: ENRICHER_MODEL,
        inputTokens: usage.input_tokens,
        outputTokens: usage.output_tokens,
        metadata: { grant_id: grant.id },
      }).catch(() => {});
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    debug.error = { stage: "llm", message };
    await patchGrant(grant.id, {
      enriched_at: new Date().toISOString(),
      enrichment_data: debug,
    }).catch(() => {});
    return { ok: false, error: `llm: ${message}` };
  }

  let parsed: unknown;
  try {
    parsed = extractJson(llmText);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    debug.error = { stage: "parse", message };
    await patchGrant(grant.id, {
      enriched_at: new Date().toISOString(),
      enrichment_data: { ...debug, llm_response_preview: llmText.slice(0, 500) },
    }).catch(() => {});
    return { ok: false, error: `parse: ${message}` };
  }

  const result = normalize(parsed);
  debug.extracted = result;

  await patchGrant(grant.id, {
    open_date: result.open_date,
    difficulty_level: result.difficulty_level,
    eligibility_conditions: result.eligibility_conditions,
    required_documents: result.required_documents,
    application_url: result.application_url,
    contact_info: result.contact_info,
    co_financing_pct: result.co_financing_pct,
    enriched_at: new Date().toISOString(),
    enrichment_data: debug,
  });

  return { ok: true, result };
}

/**
 * Pull the next N rows where enriched_at IS NULL, oldest first, and enrich
 * them one by one. Sequential on purpose — Anthropic rate-limits per-org and
 * the source fetches need to behave like a polite crawler.
 */
export async function enrichGrantsBatch(
  limit = 100
): Promise<{ processed: number; ok: number; failed: number }> {
  const { supabaseUrl, serviceKey } = getSupabaseCreds();
  const url =
    `${supabaseUrl}/rest/v1/grants` +
    `?enriched_at=is.null` +
    `&select=id,source_url,title,summary,funder` +
    `&order=created_at.asc` +
    `&limit=${limit}`;

  const res = await fetch(url, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to load enrichment queue: ${res.status}`);
  }
  const rows: GrantToEnrich[] = await res.json();
  if (rows.length === 0) {
    console.log("[enrichGrantsBatch] queue empty");
    return { processed: 0, ok: 0, failed: 0 };
  }

  console.log(`[enrichGrantsBatch] processing ${rows.length} grants`);
  let ok = 0;
  let failed = 0;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row.source_url) {
      // No URL means the enricher has nothing to fetch — mark it done with
      // an explicit reason so it doesn't sit in the queue forever.
      await patchGrant(row.id, {
        enriched_at: new Date().toISOString(),
        enrichment_data: {
          fetched_at: new Date().toISOString(),
          page_chars: null,
          model: ENRICHER_MODEL,
          error: { stage: "fetch", message: "missing source_url" },
        },
      }).catch(() => {});
      failed += 1;
      continue;
    }
    const r = await enrichGrant(row);
    if (r.ok) ok += 1;
    else failed += 1;
    if (i % 10 === 9) {
      console.log(`[enrichGrantsBatch] progress ${i + 1}/${rows.length} (ok=${ok} failed=${failed})`);
    }
  }
  console.log(`[enrichGrantsBatch] done: ${ok} ok, ${failed} failed`);
  return { processed: rows.length, ok, failed };
}
