/**
 * Dense embedding generation for semantic grant↔project matching.
 *
 * Replaces the keyword-based heuristic (Stage 2 of the funnel) with cosine
 * similarity over a multilingual embedding space. That handles typos,
 * synonyms, and cross-lingual queries (FR / EN / UK) the keyword table
 * cannot cover.
 *
 * ## Provider strategy
 *
 *   1. Voyage AI (`VOYAGE_API_KEY`) — preferred. `voyage-3-large` is the
 *      Anthropic-recommended embedding model and has the best multilingual
 *      cross-language transfer in independent benchmarks. We pin
 *      output_dimension=1536 so it's bit-compatible with the OpenAI
 *      fallback and we never have to migrate the pgvector column.
 *
 *   2. OpenAI (`OPENAI_API_KEY`) — fallback. `text-embedding-3-small` is
 *      native 1536, ~$0.02/M tokens, decent multilingual.
 *
 * Anthropic doesn't publish a first-party embedding model — they recommend
 * Voyage. We never call Anthropic for embeddings.
 *
 * ## Cost
 *
 *   • OpenAI 3-small: ~$0.00002 per grant (well under the $0.0001 target).
 *   • Voyage 3-large: ~$0.00018 per grant — we accept that for ingest-time
 *     work where quality compounds. For backfill we batch (32/req) so the
 *     overhead is amortised.
 */

const EMBEDDING_DIM = 1536;

const VOYAGE_MODEL = "voyage-3-large";
const OPENAI_MODEL = "text-embedding-3-small";

type Provider = "voyage" | "openai" | "none";

function getProvider(): Provider {
  if (process.env.VOYAGE_API_KEY) return "voyage";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "none";
}

export function isEmbeddingsAvailable(): boolean {
  return getProvider() !== "none";
}

export function embeddingProviderName(): string {
  const p = getProvider();
  if (p === "voyage") return `voyage:${VOYAGE_MODEL}`;
  if (p === "openai") return `openai:${OPENAI_MODEL}`;
  return "none";
}

// ─── Text builders ──────────────────────────────────────────────
//
// One concatenated text per entity. We bias the input by repeating the
// most signal-rich fields (title, themes) — the embedding is a centroid
// over the input, so duplication = weighting.
//
// Cap at ~3000 chars: voyage-3-large supports 32k tokens but most grants
// fit in <500 tokens; capping protects us from a 50KB raw_content dump
// dragging an unrelated word-soup into the vector.

const MAX_INPUT_CHARS = 3000;

interface GrantEmbedInput {
  title?: string | null;
  summary?: string | null;
  funder?: string | null;
  thematic_areas?: string[] | null;
  thematicAreas?: string[] | null;
  eligible_entities?: string[] | null;
  eligibleEntities?: string[] | null;
  eligible_countries?: string[] | null;
  eligibleCountries?: string[] | null;
  grant_type?: string | null;
  grantType?: string | null;
}

interface OrgEmbedInput {
  name?: string | null;
  mission?: string | null;
  thematic_areas?: string[] | null;
  thematicAreas?: string[] | null;
  beneficiaries?: string[] | null;
  geographic_focus?: string[] | null;
  geographicFocus?: string[] | null;
}

interface ProjectEmbedInput {
  name?: string | null;
  summary?: string | null;
  objectives?: string[] | null;
  target_beneficiaries?: string[] | null;
  targetBeneficiaries?: string[] | null;
  target_geography?: string[] | null;
  targetGeography?: string[] | null;
  // Wizard-specific fields kept on logframe_data
  themes?: string[] | null;
  problem?: string | null;
  general_objective?: string | null;
  generalObjective?: string | null;
  beneficiaries_direct?: string | null;
  beneficiaries_indirect?: string | null;
  methodology?: string | null;
  activities?: Array<{ title?: string; description?: string } | string> | null;
}

function joinList(arr: unknown): string {
  if (!Array.isArray(arr) || arr.length === 0) return "";
  return arr
    .map((v) => (typeof v === "string" ? v : v == null ? "" : String(v)))
    .filter(Boolean)
    .join(", ");
}

function trimChars(s: string, max = MAX_INPUT_CHARS): string {
  s = s.replace(/\s+/g, " ").trim();
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

/** Build the canonical text representation of a grant. */
export function buildGrantEmbeddingText(g: GrantEmbedInput): string {
  const themes = joinList(g.thematic_areas ?? g.thematicAreas);
  const entities = joinList(g.eligible_entities ?? g.eligibleEntities);
  const countries = joinList(g.eligible_countries ?? g.eligibleCountries);
  const grantType = g.grant_type ?? g.grantType ?? "";
  const title = g.title ?? "";

  // Title twice = stronger signal. Themes also doubled because they're the
  // densest semantic feature and short enough not to dominate.
  const parts = [
    `Titre: ${title}`,
    title, // weight boost
    g.funder ? `Bailleur: ${g.funder}` : "",
    grantType ? `Type: ${grantType}` : "",
    themes ? `Thématiques: ${themes}` : "",
    themes, // weight boost
    entities ? `Entités éligibles: ${entities}` : "",
    countries ? `Pays éligibles: ${countries}` : "",
    g.summary ? `Description: ${g.summary}` : "",
  ].filter(Boolean);

  return trimChars(parts.join("\n"));
}

/** Build the canonical text representation of a project (+ its org). */
export function buildProjectEmbeddingText(
  project: ProjectEmbedInput,
  org?: OrgEmbedInput
): string {
  const orgThemes = joinList(org?.thematic_areas ?? org?.thematicAreas);
  const orgBenef = joinList(org?.beneficiaries);
  const orgGeo = joinList(org?.geographic_focus ?? org?.geographicFocus);

  const projThemes = joinList(project.themes);
  const projObjectives = joinList(project.objectives);
  const projBenef = joinList(
    project.target_beneficiaries ?? project.targetBeneficiaries
  );
  const projGeo = joinList(project.target_geography ?? project.targetGeography);
  const generalObj = project.general_objective ?? project.generalObjective ?? "";

  // Activities can be objects or strings depending on logframe_data shape.
  const activities = Array.isArray(project.activities)
    ? project.activities
        .map((a) =>
          typeof a === "string"
            ? a
            : [a?.title, a?.description].filter(Boolean).join(" — ")
        )
        .filter(Boolean)
        .slice(0, 6)
        .join("; ")
    : "";

  const parts = [
    project.name ? `Projet: ${project.name}` : "",
    project.name ?? "", // weight boost on title
    org?.name ? `Organisation: ${org.name}` : "",
    org?.mission ? `Mission: ${org.mission}` : "",
    project.summary ? `Résumé: ${project.summary}` : "",
    project.problem ? `Problématique: ${project.problem}` : "",
    generalObj ? `Objectif général: ${generalObj}` : "",
    projObjectives ? `Objectifs spécifiques: ${projObjectives}` : "",
    projThemes || orgThemes
      ? `Thématiques: ${[projThemes, orgThemes].filter(Boolean).join(", ")}`
      : "",
    [projThemes, orgThemes].filter(Boolean).join(", "), // weight boost
    projBenef || orgBenef
      ? `Bénéficiaires: ${[projBenef, orgBenef].filter(Boolean).join(", ")}`
      : "",
    project.beneficiaries_direct
      ? `Bénéficiaires directs: ${project.beneficiaries_direct}`
      : "",
    project.beneficiaries_indirect
      ? `Bénéficiaires indirects: ${project.beneficiaries_indirect}`
      : "",
    projGeo || orgGeo
      ? `Géographie: ${[projGeo, orgGeo].filter(Boolean).join(", ")}`
      : "",
    project.methodology ? `Méthodologie: ${project.methodology}` : "",
    activities ? `Activités: ${activities}` : "",
  ].filter(Boolean);

  return trimChars(parts.join("\n"));
}

// ─── Provider clients ───────────────────────────────────────────

interface VoyageResponse {
  data?: Array<{ embedding: number[]; index: number }>;
  error?: { message?: string };
}

async function voyageEmbed(
  texts: string[],
  inputType: "document" | "query"
): Promise<number[][]> {
  const apiKey = process.env.VOYAGE_API_KEY!;
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: VOYAGE_MODEL,
      input: texts,
      input_type: inputType,
      output_dimension: EMBEDDING_DIM,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Voyage embed failed (${res.status}): ${body.slice(0, 300)}`);
  }

  const data: VoyageResponse = await res.json();
  if (!data.data || !Array.isArray(data.data)) {
    throw new Error(`Voyage returned no data: ${data.error?.message ?? "unknown"}`);
  }
  // Voyage may return out of order — sort by index to be safe.
  return data.data
    .slice()
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

interface OpenAiResponse {
  data?: Array<{ embedding: number[]; index: number }>;
  error?: { message?: string };
}

async function openaiEmbed(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.OPENAI_API_KEY!;
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: texts,
      dimensions: EMBEDDING_DIM,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`OpenAI embed failed (${res.status}): ${body.slice(0, 300)}`);
  }

  const data: OpenAiResponse = await res.json();
  if (!data.data || !Array.isArray(data.data)) {
    throw new Error(`OpenAI returned no data: ${data.error?.message ?? "unknown"}`);
  }
  return data.data
    .slice()
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Embed one text. Returns null when no provider is configured (caller
 * should fall back to the heuristic). Throws on transient API errors so
 * callers can decide to retry vs proceed without an embedding.
 */
export async function generateEmbedding(
  text: string,
  options: { kind?: "grant" | "project" } = {}
): Promise<number[] | null> {
  const provider = getProvider();
  if (provider === "none") return null;

  const trimmed = trimChars(text);
  if (!trimmed) return null;

  if (provider === "voyage") {
    const inputType = options.kind === "project" ? "query" : "document";
    const [vec] = await voyageEmbed([trimmed], inputType);
    return vec ?? null;
  }

  const [vec] = await openaiEmbed([trimmed]);
  return vec ?? null;
}

/**
 * Batch embed. Voyage caps at 128 inputs per call, OpenAI at 2048 — we use
 * 64 for both since the per-input character budget puts us at ~6k tokens
 * per request even with a small batch, which keeps latency predictable.
 */
export async function generateEmbeddingsBatch(
  texts: string[],
  options: { kind?: "grant" | "project" } = {}
): Promise<(number[] | null)[]> {
  const provider = getProvider();
  if (provider === "none") return texts.map(() => null);
  if (texts.length === 0) return [];

  const BATCH = 64;
  const results: (number[] | null)[] = new Array(texts.length).fill(null);

  for (let i = 0; i < texts.length; i += BATCH) {
    const slice = texts.slice(i, i + BATCH).map((t) => trimChars(t || ""));
    // Skip empty batches — provider rejects empty strings.
    const idxs: number[] = [];
    const inputs: string[] = [];
    slice.forEach((t, j) => {
      if (t) {
        idxs.push(i + j);
        inputs.push(t);
      }
    });
    if (inputs.length === 0) continue;

    const vecs =
      provider === "voyage"
        ? await voyageEmbed(
            inputs,
            options.kind === "project" ? "query" : "document"
          )
        : await openaiEmbed(inputs);

    vecs.forEach((v, k) => {
      results[idxs[k]] = v;
    });
  }

  return results;
}

/** Convenience: build text + embed in one call. */
export async function generateGrantEmbedding(
  grant: GrantEmbedInput
): Promise<number[] | null> {
  const text = buildGrantEmbeddingText(grant);
  if (!text) return null;
  return generateEmbedding(text, { kind: "grant" });
}

export async function generateProjectEmbedding(
  project: ProjectEmbedInput,
  org?: OrgEmbedInput
): Promise<number[] | null> {
  const text = buildProjectEmbeddingText(project, org);
  if (!text) return null;
  return generateEmbedding(text, { kind: "project" });
}

/**
 * Format a number[] for pgvector's text input: '[0.1,0.2,...]'.
 * The supabase-js client serialises arrays as Postgres arrays by default,
 * which doesn't work for the `vector` type — we have to send the
 * pgvector literal string instead.
 */
export function toPgVector(vec: number[]): string {
  return `[${vec.join(",")}]`;
}

export const EMBEDDING_DIMENSIONS = EMBEDDING_DIM;
