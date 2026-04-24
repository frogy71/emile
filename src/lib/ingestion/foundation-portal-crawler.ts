/**
 * Foundation portal crawler — a generic scraper that visits each private
 * foundation's website, finds their "appels à projets" (calls for projects)
 * page, and extracts active calls into our Grant schema.
 *
 * Rationale: more and more private foundations run their own open calls with
 * their own portals (instead of going through Fondation de France). Emile's
 * value prop depends on aggregating those too so NGO teams don't have to
 * manually watch 150 individual sites.
 *
 * Strategy per foundation:
 *
 *   1. Visit the foundation's root URL (the one we already have in
 *      fondations-curated.ts) — these are already "appels à projets"
 *      landing pages for many of them.
 *   2. If the root URL is the homepage, find a candidate "appels à
 *      projets"/"candidater"/"financez"/"nos programmes" link.
 *   3. Fetch that page, extract visible text, and run a targeted LLM
 *      extraction that returns 0..N structured call objects
 *      {title, summary, deadline, amountEur, themes, url}.
 *   4. Each extracted call becomes a Grant with source_url = the deep link
 *      if we found one, or the foundation's page otherwise.
 *
 * The crawler is defensive:
 *   - Caps total runtime (stops early when over budget — we run inside a
 *     Vercel cron with maxDuration)
 *   - Rate limits between foundations (500 ms) so we're a well-behaved bot
 *   - Fails open per foundation (one bad scrape doesn't kill the run)
 *   - Reuses the ingestion_logs table via the orchestrator so results show
 *     up in the admin dashboard
 *
 * This is deliberately NOT an AI-scored call — we run the generic matching
 * pipeline on the result, same as every other grant source.
 */

import { fetchCuratedFoundations } from "./fondations-curated";
import type { CrawlSnapshot } from "./foundation-portal-reconciler";

// ───────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────

interface CrawledCall {
  title: string;
  summary: string;
  deadline: string | null;
  amountEur: number | null;
  themes: string[];
  url: string; // deep link back to the call (or fallback to the portal)
  funder: string;
  sourcePortal: string; // root URL of the foundation portal
}

// ───────────────────────────────────────────────────────────────
// HTML helpers
// ───────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&eacute;/g, "é")
    .replace(/&egrave;/g, "è")
    .replace(/&agrave;/g, "à")
    .replace(/&ecirc;/g, "ê")
    .replace(/&ocirc;/g, "ô")
    .replace(/&ccedil;/g, "ç")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchWithTimeout(
  url: string,
  ms = 15000
): Promise<Response | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; EmileBot/1.0; +https://grant-finder-kappa.vercel.app)",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "fr,en;q=0.9",
      },
      signal: ctrl.signal,
      redirect: "follow",
    });
    return res.ok ? res : null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

// Match typical CTA/anchor text indicating a call-for-projects page.
const CALLS_ANCHOR_REGEX =
  /(appels?[\s-]+(?:à[\s-]+)?projets?|candidater|nos[\s-]+(?:programmes|appels)|postuler|financez[\s-]+votre[\s-]+projet|soutenir[\s-]+(?:un[\s-]+)?projet|demande[\s-]+de[\s-]+financement)/i;

/**
 * From a landing page HTML, pick the best candidate "calls-for-projects"
 * link. Falls back to the landing page itself if nothing obvious is found.
 */
function findCallsPageUrl(html: string, portalUrl: string): string {
  try {
    const portal = new URL(portalUrl);
    const anchorRe = /<a[^>]*href="([^"#]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let best: { score: number; href: string } | null = null;
    let m: RegExpExecArray | null;
    while ((m = anchorRe.exec(html)) !== null) {
      const rawHref = m[1];
      const text = stripHtml(m[2]);
      if (!text) continue;
      if (!CALLS_ANCHOR_REGEX.test(text) && !CALLS_ANCHOR_REGEX.test(rawHref)) {
        continue;
      }
      // Resolve relative URLs
      let abs: string;
      try {
        abs = new URL(rawHref, portalUrl).toString();
      } catch {
        continue;
      }
      // Only keep same-origin links (don't follow to external sites)
      if (new URL(abs).origin !== portal.origin) continue;
      // Heuristic scoring: prefer explicit "appels à projets" phrasing
      let score = 0;
      if (/appels?[\s-]+(?:à[\s-]+)?projets?/i.test(text)) score += 5;
      if (/candidater|postuler/i.test(text)) score += 3;
      if (/nos[\s-]+(?:programmes|appels)/i.test(text)) score += 2;
      if (/financez/i.test(text)) score += 2;
      if (!best || score > best.score) best = { score, href: abs };
    }
    return best ? best.href : portalUrl;
  } catch {
    return portalUrl;
  }
}

// ───────────────────────────────────────────────────────────────
// LLM extraction
// ───────────────────────────────────────────────────────────────

const EXTRACTION_SCHEMA = `[
  {
    "title": "string — titre exact de l'appel à projets",
    "summary": "string — résumé en 2-3 phrases (qui, quoi, pour qui)",
    "deadline": "string (YYYY-MM-DD) ou null si pas de date explicite",
    "amountEur": "number ou null — montant max en euros",
    "themes": "string[] — 2-5 thématiques (Santé, Éducation, Environnement, etc.)",
    "url": "string — URL complète de la page de l'appel si elle apparaît explicitement, sinon null"
  }
]`;

/**
 * Ask Claude to extract active calls-for-projects from a page of raw text.
 * Returns an empty array if the page has no identifiable open call.
 */
async function extractCallsWithLLM(
  portalUrl: string,
  funder: string,
  pageText: string
): Promise<Omit<CrawledCall, "funder" | "sourcePortal">[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return [];

  // Truncate aggressively — most foundation pages are <30k chars.
  const truncated = pageText.slice(0, 15000);

  const prompt = `Tu es un expert des financements ONG. Voici le contenu d'une page d'appels à projets de la ${funder}.

URL DE LA PAGE:
${portalUrl}

CONTENU BRUT:
"""
${truncated}
"""

TÂCHE:
Extrait UNIQUEMENT les appels à projets encore OUVERTS (deadline non passée ou récurrent). Ignore les pages "About", "Actualités", ou les projets déjà financés.

Pour chaque appel trouvé, renvoie un objet JSON selon ce schéma:
${EXTRACTION_SCHEMA}

RÈGLES:
- Si aucun appel ouvert n'est identifiable, renvoie [] (tableau vide).
- Jamais d'invention — si un montant ou une date n'apparaît pas, mets null.
- Le deadline doit être au format YYYY-MM-DD. Si "permanent" ou "au fil de l'eau", mets null.
- Les thématiques doivent coller au domaine de la fondation.
- Réponds UNIQUEMENT avec un tableau JSON valide, sans markdown, sans prose avant/après.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        // Haiku is plenty for structured extraction and keeps cost low even
        // across 150 foundation pages (~$0.10-0.30 per full crawl).
        model: "claude-haiku-4-5",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const text: string =
      (data?.content?.[0]?.text as string | undefined) || "";
    const cleaned = text
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "");
    // Be forgiving — some responses wrap the array in an object, or add prose.
    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const m = cleaned.match(/\[[\s\S]*\]/);
      if (!m) return [];
      try {
        parsed = JSON.parse(m[0]);
      } catch {
        return [];
      }
    }
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x): x is Record<string, unknown> => x !== null && typeof x === "object")
      .map((x) => ({
        title: String(x.title || "").trim(),
        summary: String(x.summary || "").trim(),
        deadline:
          typeof x.deadline === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x.deadline)
            ? x.deadline
            : null,
        amountEur:
          typeof x.amountEur === "number" && Number.isFinite(x.amountEur)
            ? x.amountEur
            : null,
        themes: Array.isArray(x.themes)
          ? x.themes
              .filter((t): t is string => typeof t === "string")
              .slice(0, 6)
          : [],
        url:
          typeof x.url === "string" && /^https?:\/\//.test(x.url)
            ? x.url
            : portalUrl,
      }))
      .filter((c) => c.title.length > 4 && c.summary.length > 10);
  } catch (e) {
    console.warn(`[portal-crawler] LLM extract failed for ${funder}:`, e);
    return [];
  }
}

// ───────────────────────────────────────────────────────────────
// Public API
// ───────────────────────────────────────────────────────────────

export interface PortalCrawlerOptions {
  /** Max wall time in seconds. Default 240 to stay under Vercel 300s cap. */
  budgetSeconds?: number;
  /** Max foundations to crawl in one run. */
  limit?: number;
  /** Skip the LLM step and only do link discovery (useful for tests). */
  extractWithLLM?: boolean;
}

/**
 * Crawl every curated foundation portal and return snapshots per
 * foundation (including whether the portal was reachable).
 *
 * Snapshots are the rich form: the reconciler uses `portalReachable`
 * to avoid marking calls as "closed" when a foundation's site just
 * happened to be down. Legacy callers that want the flat list can
 * call {@link crawlFoundationPortals}.
 */
export async function crawlFoundationPortalsSnapshots(
  options: PortalCrawlerOptions = {}
): Promise<CrawlSnapshot[]> {
  const budgetMs = (options.budgetSeconds ?? 240) * 1000;
  const start = Date.now();
  const limit = options.limit ?? 200;
  const extract = options.extractWithLLM !== false;

  const foundations = fetchCuratedFoundations().slice(0, limit);
  const snapshots: CrawlSnapshot[] = [];

  console.log(
    `[portal-crawler] Starting crawl of ${foundations.length} foundations (budget=${options.budgetSeconds ?? 240}s, extract=${extract})`
  );

  for (const f of foundations) {
    if (Date.now() - start > budgetMs) {
      console.warn(
        `[portal-crawler] Budget exhausted — stopping after ${snapshots.length} foundations.`
      );
      break;
    }

    const snap: CrawlSnapshot = {
      funder: f.name,
      portalUrl: f.url,
      portalReachable: false,
      errorMessage: null,
      calls: [],
    };

    try {
      const root = await fetchWithTimeout(f.url);
      if (!root) {
        snap.errorMessage = "root unreachable";
        snapshots.push(snap);
        console.log(`[portal-crawler] ${f.name}: root unreachable`);
        continue;
      }
      snap.portalReachable = true;
      const html = await root.text();

      // Step 1: find the most likely calls-for-projects page.
      const callsUrl = findCallsPageUrl(html, f.url);
      let pageHtml = html;
      if (callsUrl !== f.url) {
        const deep = await fetchWithTimeout(callsUrl);
        if (deep) pageHtml = await deep.text();
      }
      const pageText = stripHtml(pageHtml);

      // Step 2: extract calls with the LLM (if enabled).
      if (!extract) {
        snapshots.push(snap);
        continue;
      }

      const extracted = await extractCallsWithLLM(callsUrl, f.name, pageText);
      const seen = new Set<string>();
      for (const c of extracted) {
        const key = c.title.toLowerCase().trim();
        if (seen.has(key)) continue;
        seen.add(key);
        snap.calls.push({
          title: c.title,
          summary: c.summary,
          deadline: c.deadline ? new Date(c.deadline) : null,
          amountEur: c.amountEur,
          themes: c.themes,
          url: c.url,
        });
      }

      console.log(
        `[portal-crawler] ${f.name}: ${snap.calls.length} calls extracted`
      );

      // Polite rate limit
      await new Promise((r) => setTimeout(r, 500));
    } catch (e) {
      snap.errorMessage = e instanceof Error ? e.message : String(e);
      console.warn(`[portal-crawler] ${f.name} failed:`, snap.errorMessage);
    }

    snapshots.push(snap);
  }

  const totalCalls = snapshots.reduce((n, s) => n + s.calls.length, 0);
  console.log(
    `[portal-crawler] Done — ${totalCalls} calls from ${snapshots.length} foundations in ${Math.round((Date.now() - start) / 1000)}s`
  );
  return snapshots;
}

/**
 * Back-compat flat-list wrapper for legacy callers. Prefer the
 * snapshots variant, which the reconciler needs.
 */
export async function crawlFoundationPortals(
  options: PortalCrawlerOptions = {}
): Promise<CrawledCall[]> {
  const snapshots = await crawlFoundationPortalsSnapshots(options);
  const out: CrawledCall[] = [];
  for (const s of snapshots) {
    for (const c of s.calls) {
      out.push({
        title: c.title,
        summary: c.summary,
        deadline: c.deadline ? c.deadline.toISOString().slice(0, 10) : null,
        amountEur: c.amountEur,
        themes: c.themes,
        url: c.url,
        funder: s.funder,
        sourcePortal: s.portalUrl,
      });
    }
  }
  return out;
}

/**
 * Transform a crawled call into our grant schema (same shape as the
 * other ingestion modules).
 */
export function transformCrawledCallToGrant(call: CrawledCall) {
  // If the LLM didn't find a deep link, point to the call page we actually
  // scraped so the "Contacter la fondation" CTA still works.
  const url = call.url || call.sourcePortal;
  return {
    sourceUrl: url,
    sourceName: "Fondations privées — appels actifs",
    title: call.title,
    summary: call.summary,
    rawContent: call.summary,
    funder: call.funder,
    country: "FR",
    thematicAreas: call.themes,
    eligibleEntities: ["association", "ong"],
    eligibleCountries: ["FR"],
    minAmountEur: null,
    maxAmountEur: call.amountEur,
    coFinancingRequired: false,
    deadline: call.deadline ? new Date(call.deadline) : null,
    grantType: "fondation",
    language: "fr",
    status: "active",
    aiSummary: call.summary,
  };
}
