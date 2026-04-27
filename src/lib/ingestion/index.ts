/**
 * Master ingestion orchestrator
 *
 * Sources ranked by priority:
 *
 * 🔴 CRITICAL (API — automated):
 * 1. Aides-Territoires — ~3,000 aids (État + Régions + Départements + EPCI)
 * 2. EU Funding & Tenders — ~800 EU calls (splits into EuropeAid/INTPA too)
 *
 * 🟠 FR national programs:
 * 3. data.gouv.fr — FRUP + Fondations d'entreprises
 * 4. BPI France — innovation
 * 5. Fondations curated + Fondation de France live
 * 6. ADEME — transition écologique
 * 7. FDVA — vie associative
 * 8. ANS — sport
 *
 * Run strategy:
 * - Full sync: weekly (Sunday 2am)
 * - Incremental daily (6am): Aides-Territoires + EU + Fondation de France
 * - Cleanup (4am daily): mark expired grants
 * - On-demand: triggered by admin
 *
 * Every source run is persisted to `ingestion_logs` so the admin dashboard
 * can surface health, trends and error rates.
 */

import { randomUUID } from "crypto";

import {
  fetchAllAidesAssociations,
  transformToGrant,
} from "./aides-territoires";
import { fetchEUOpenCalls, transformEUToGrant } from "./eu-funding";
// EuropeAid is now handled by the EU Funding SEDIA ingestion (split by source_name)
import { fetchFRUP, transformFRUPToGrant, fetchFondationsEntreprises, transformFEToGrant } from "./data-gouv";
import { fetchBpiGrants, transformBpiToGrant } from "./bpifrance";
import { fetchCuratedFoundations, transformCuratedToGrant } from "./fondations-curated";
import { fetchFondationDeFrance, transformFDFToGrant } from "./fondation-de-france";
import {
  crawlFoundationPortalsSnapshots,
  selectNextPortalBatch,
} from "./foundation-portal-crawler";
import { reconcileFoundationPortals } from "./foundation-portal-reconciler";
import { fetchADEME, transformADEMEToGrant } from "./ademe";
import { fetchFDVA, transformFDVAToGrant } from "./fdva";
import { fetchANS, transformANSToGrant } from "./ans";
import { fetchRegionPrograms, transformRegionToGrant } from "./regions";
import {
  fetchMinisterialPrograms,
  transformMinisterialToGrant,
} from "./ministeres";
import { fetchEUExtraPrograms, transformEUExtraToGrant } from "./eu-extra";
import { fetchAFDPrograms, transformAFDToGrant } from "./afd";
import { fetchCDCPrograms, transformCDCToGrant } from "./cdc-action-logement";
import {
  fetchExtraFoundations,
  transformExtraFoundationToGrant,
} from "./fondations-extra";

export type IngestionTrigger =
  | "manual"
  | "cron-daily"
  | "cron-weekly"
  | "admin";

export type IngestionStatus = "running" | "success" | "partial" | "failed";

export interface IngestionResult {
  source: string;
  fetched: number;
  transformed: number;
  inserted: number;
  skipped: number;
  errors: number;
  duration_ms: number;
  status: IngestionStatus;
  error_message?: string | null;
}

export interface IngestionReport {
  runId: string;
  trigger: IngestionTrigger;
  startedAt: string;
  completedAt: string;
  totalFetched: number;
  totalInserted: number;
  totalSkipped: number;
  totalErrors: number;
  sources: IngestionResult[];
}

export interface IngestionOptions {
  /** Which label to record on ingestion_logs.trigger */
  trigger?: IngestionTrigger;
  /** Only run these sources (incremental). Omit to run everything. */
  only?: string[];
  /** Shared run id across all sources (optional — generated if absent). */
  runId?: string;
}

// ───────────────────────────────────────────────────────────────
// Supabase helpers
// ───────────────────────────────────────────────────────────────

function getSupabaseCreds() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return { supabaseUrl, serviceKey };
}

/**
 * Insert a log row for a running source. Returns its id so the caller can
 * patch it with completion data. Fire-and-forget safe — logging failures
 * never break ingestion.
 */
async function openIngestionLog(
  runId: string,
  sourceName: string,
  trigger: IngestionTrigger
): Promise<string | null> {
  try {
    const { supabaseUrl, serviceKey } = getSupabaseCreds();
    const res = await fetch(`${supabaseUrl}/rest/v1/ingestion_logs`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        run_id: runId,
        source_name: sourceName,
        status: "running",
        trigger,
        started_at: new Date().toISOString(),
      }),
    });
    if (!res.ok) return null;
    const [row] = await res.json();
    return row?.id ?? null;
  } catch {
    return null;
  }
}

async function closeIngestionLog(
  id: string | null,
  patch: {
    status: IngestionStatus;
    fetched: number;
    transformed: number;
    inserted: number;
    skipped: number;
    errors: number;
    duration_ms: number;
    error_message?: string | null;
    error_details?: unknown;
  }
): Promise<void> {
  if (!id) return;
  try {
    const { supabaseUrl, serviceKey } = getSupabaseCreds();
    await fetch(`${supabaseUrl}/rest/v1/ingestion_logs?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        completed_at: new Date().toISOString(),
        status: patch.status,
        fetched: patch.fetched,
        transformed: patch.transformed,
        inserted: patch.inserted,
        skipped: patch.skipped,
        errors: patch.errors,
        duration_ms: patch.duration_ms,
        error_message: patch.error_message ?? null,
        error_details: patch.error_details
          ? JSON.parse(JSON.stringify(patch.error_details))
          : null,
      }),
    });
  } catch {
    // logging is best-effort
  }
}

/**
 * Upsert grants in chunks of 50 via the Supabase REST API.
 *
 * Uses Prefer: resolution=merge-duplicates so existing grants are updated in
 * place (idempotent nightly runs).
 */
async function upsertGrants(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  grants: Record<string, any>[]
): Promise<{ inserted: number; skipped: number; errors: number }> {
  const { supabaseUrl, serviceKey } = getSupabaseCreds();

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  // Dedupe by source_url before chunking — Postgres' ON CONFLICT DO UPDATE
  // rejects an INSERT that targets the same conflict key twice in one
  // statement, and several sources (Aides-Territoires especially) emit
  // multiple grants pointing at the same external origin_url. Keeping the
  // last occurrence matches "last write wins" semantics.
  const dedupedByUrl = new Map<string, (typeof grants)[number]>();
  for (const g of grants) {
    if (!g.sourceUrl) continue;
    dedupedByUrl.set(g.sourceUrl, g);
  }
  grants = Array.from(dedupedByUrl.values());

  const chunkSize = 50;
  for (let i = 0; i < grants.length; i += chunkSize) {
    const chunk = grants.slice(i, i + chunkSize).map((g) => ({
      source_url: g.sourceUrl,
      source_name: g.sourceName,
      title: g.title,
      summary: g.summary,
      raw_content: g.rawContent,
      funder: g.funder,
      country: g.country,
      thematic_areas: g.thematicAreas,
      eligible_entities: g.eligibleEntities,
      eligible_countries: g.eligibleCountries,
      min_amount_eur: g.minAmountEur,
      max_amount_eur: g.maxAmountEur,
      co_financing_required: g.coFinancingRequired,
      deadline: g.deadline?.toISOString?.() ?? g.deadline ?? null,
      grant_type: g.grantType,
      language: g.language,
      status: g.status,
      ai_summary: g.aiSummary,
      updated_at: new Date().toISOString(),
    }));

    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/grants?on_conflict=source_url`,
        {
          method: "POST",
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates,return=minimal",
          },
          body: JSON.stringify(chunk),
        }
      );

      if (res.ok) {
        inserted += chunk.length;
      } else {
        const errText = await res.text();
        if (errText.includes("duplicate") || errText.includes("unique")) {
          skipped += chunk.length;
        } else {
          console.error(
            `[Upsert] Batch error (${i}-${i + chunkSize}):`,
            errText.slice(0, 200)
          );
          errors += chunk.length;
        }
      }
    } catch (e) {
      console.error(`[Upsert] Network error:`, e);
      errors += chunk.length;
    }

    if ((i + chunkSize) % 200 === 0 || i + chunkSize >= grants.length) {
      console.log(
        `[Upsert] Progress: ${Math.min(i + chunkSize, grants.length)}/${grants.length}`
      );
    }
  }

  return { inserted, skipped, errors };
}

// ───────────────────────────────────────────────────────────────
// Source registry
// ───────────────────────────────────────────────────────────────

type SourceSpec = {
  name: string;
  /** Fast, free sources we run daily. Slower / static sources run weekly. */
  cadence: "daily" | "weekly";
  /**
   * Default path: return grants, orchestrator handles upserts.
   * Used by ~all sources.
   */
  run?: () => Promise<Record<string, unknown>[]>;
  /**
   * Escape hatch: source handles its own persistence (lifecycle
   * tracking, upserts, events). The orchestrator just logs + timestamps.
   * Used by the foundation portal crawler (via the reconciler).
   */
  customIngest?: (runId: string) => Promise<{
    fetched: number;
    inserted: number;
    skipped: number;
    errors: number;
  }>;
};

const SOURCES: SourceSpec[] = [
  {
    name: "Aides-Territoires",
    cadence: "daily",
    run: async () => {
      const raw = await fetchAllAidesAssociations();
      return raw.map(transformToGrant);
    },
  },
  {
    name: "EU Funding & Tenders",
    cadence: "daily",
    run: async () => {
      const raw = await fetchEUOpenCalls();
      return raw.map(transformEUToGrant);
    },
  },
  {
    name: "Fondation de France (appels actifs)",
    cadence: "daily",
    run: async () => {
      const raw = await fetchFondationDeFrance();
      return raw.map(transformFDFToGrant);
    },
  },
  {
    name: "BPI France",
    cadence: "weekly",
    run: async () => {
      const raw = await fetchBpiGrants();
      return raw.map(transformBpiToGrant);
    },
  },
  {
    name: "data.gouv.fr — FRUP",
    cadence: "weekly",
    run: async () => {
      const raw = await fetchFRUP();
      return raw.map((row, i) => transformFRUPToGrant(row, i));
    },
  },
  {
    name: "data.gouv.fr — Fondations entreprises",
    cadence: "weekly",
    run: async () => {
      const raw = await fetchFondationsEntreprises();
      return raw.map((row, i) => transformFEToGrant(row, i));
    },
  },
  {
    name: "Fondations françaises (curated)",
    cadence: "weekly",
    run: async () => {
      const raw = fetchCuratedFoundations();
      return raw.map(transformCuratedToGrant);
    },
  },
  {
    // Crawls each curated foundation's portal and extracts their active
    // "appels à projets" (calls for projects) as individual grants.
    //
    // Batched: a single Vercel function invocation is capped at 300s on the
    // Hobby plan, which isn't enough to walk all ~200 portals × one LLM
    // extraction each. So this runs DAILY but only crawls the next ~35
    // least-recently-crawled portals per invocation; over 5-7 days the full
    // catalog is covered, then the rotation restarts naturally. The
    // `last_crawled_at` column on `foundation_portal_health` is the cursor.
    //
    // Cadence stays "weekly" so the daily-cadence cron at 06:00 UTC
    // (`runDailyIngestion`) doesn't double up — only the dedicated
    // /api/cron/foundation-portals route runs this source.
    //
    // Uses customIngest because the reconciler handles lifecycle events
    // (opened/closed/disappeared/reopened) and writes its own upserts —
    // the generic upsertGrants path would lose that metadata.
    name: "Fondations privées — appels actifs",
    cadence: "weekly",
    customIngest: async (runId) => {
      const batchSize = parseInt(
        process.env.FOUNDATION_PORTAL_BATCH_SIZE ?? "35",
        10
      );
      const batch = await selectNextPortalBatch(batchSize);
      console.log(
        `[Fondations privées — appels actifs] Batch ${batch.funders.length}/${batch.total} (never-crawled remaining: ${batch.neverCrawled})`
      );
      if (batch.funders.length === 0) {
        return { fetched: 0, inserted: 0, skipped: 0, errors: 0 };
      }
      const snapshots = await crawlFoundationPortalsSnapshots({
        budgetSeconds: 240,
        onlyFunders: batch.funders,
      });
      const res = await reconcileFoundationPortals(snapshots, runId);
      const fetched = snapshots.reduce((n, s) => n + s.calls.length, 0);
      // "inserted" in the ingestion_logs view = grants actually added OR
      // updated with a lifecycle transition, so opened + reopened +
      // still_open + closed + disappeared all count.
      const inserted =
        res.opened +
        res.reopened +
        res.stillOpen +
        res.closed +
        res.disappeared;
      return {
        fetched,
        inserted,
        skipped: 0,
        errors: res.foundationsSkippedUnreachable,
      };
    },
  },
  {
    name: "ADEME — Agir pour la transition",
    cadence: "daily",
    run: async () => {
      const raw = await fetchADEME();
      return raw.map(transformADEMEToGrant);
    },
  },
  {
    name: "FDVA — Vie associative",
    cadence: "weekly",
    run: async () => {
      const raw = await fetchFDVA();
      return raw.map(transformFDVAToGrant);
    },
  },
  {
    name: "ANS — Agence nationale du sport",
    cadence: "weekly",
    run: async () => {
      const raw = await fetchANS();
      return raw.map(transformANSToGrant);
    },
  },
  {
    name: "Conseils Régionaux",
    cadence: "weekly",
    run: async () => {
      const raw = await fetchRegionPrograms();
      return raw.map(transformRegionToGrant);
    },
  },
  {
    name: "AAP Ministériels",
    cadence: "weekly",
    run: async () => {
      const raw = await fetchMinisterialPrograms();
      return raw.map(transformMinisterialToGrant);
    },
  },
  {
    name: "Programmes européens (hors SEDIA)",
    cadence: "weekly",
    run: async () => {
      const raw = await fetchEUExtraPrograms();
      return raw.map(transformEUExtraToGrant);
    },
  },
  {
    name: "AFD — Agence Française de Développement",
    cadence: "weekly",
    run: async () => {
      const raw = await fetchAFDPrograms();
      return raw.map(transformAFDToGrant);
    },
  },
  {
    name: "Caisse des Dépôts / Action Logement / ANRU",
    cadence: "weekly",
    run: async () => {
      const raw = await fetchCDCPrograms();
      return raw.map(transformCDCToGrant);
    },
  },
  {
    name: "Fondations & opérateurs (curated extra)",
    cadence: "weekly",
    run: async () => {
      const raw = await fetchExtraFoundations();
      return raw.map(transformExtraFoundationToGrant);
    },
  },
];

// ───────────────────────────────────────────────────────────────
// Ingestion runner
// ───────────────────────────────────────────────────────────────

/**
 * Mark every active grant whose deadline is in the past as expired.
 * Safe to call frequently — idempotent.
 */
export async function markExpiredGrants(): Promise<number> {
  const { supabaseUrl, serviceKey } = getSupabaseCreds();
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/grants?status=eq.active&deadline=lt.${new Date().toISOString()}`,
      {
        method: "PATCH",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({ status: "expired" }),
      }
    );
    if (!res.ok) return 0;
    const rows = await res.json();
    return Array.isArray(rows) ? rows.length : 0;
  } catch (e) {
    console.error("[markExpiredGrants] failed:", e);
    return 0;
  }
}

async function ingestSource(
  runId: string,
  name: string,
  trigger: IngestionTrigger,
  spec: SourceSpec
): Promise<IngestionResult> {
  const start = Date.now();
  const logId = await openIngestionLog(runId, name, trigger);

  try {
    let fetched: number;
    let inserted: number;
    let skipped: number;
    let errors: number;

    if (spec.customIngest) {
      console.log(`[${name}] Running custom ingest (self-managed upserts)...`);
      const r = await spec.customIngest(runId);
      fetched = r.fetched;
      inserted = r.inserted;
      skipped = r.skipped;
      errors = r.errors;
    } else if (spec.run) {
      console.log(`[${name}] Fetching...`);
      const grants = await spec.run();
      console.log(`[${name}] Fetched ${grants.length} grants, upserting...`);
      const r = await upsertGrants(grants);
      fetched = grants.length;
      inserted = r.inserted;
      skipped = r.skipped;
      errors = r.errors;
    } else {
      throw new Error(`Source "${name}" has neither run nor customIngest`);
    }

    const status: IngestionStatus =
      errors === 0 ? "success" : errors < fetched ? "partial" : "failed";

    const duration_ms = Date.now() - start;

    console.log(
      `[${name}] Done: ${inserted} inserted, ${skipped} skipped, ${errors} errors (${duration_ms}ms)`
    );

    const result: IngestionResult = {
      source: name,
      fetched,
      transformed: fetched,
      inserted,
      skipped,
      errors,
      duration_ms,
      status,
      error_message: null,
    };

    await closeIngestionLog(logId, {
      status,
      fetched,
      transformed: fetched,
      inserted,
      skipped,
      errors,
      duration_ms,
    });

    return result;
  } catch (error) {
    const duration_ms = Date.now() - start;
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    console.error(`[${name}] Ingestion failed:`, errorMessage);

    const result: IngestionResult = {
      source: name,
      fetched: 0,
      transformed: 0,
      inserted: 0,
      skipped: 0,
      errors: 1,
      duration_ms,
      status: "failed",
      error_message: errorMessage,
    };

    await closeIngestionLog(logId, {
      status: "failed",
      fetched: 0,
      transformed: 0,
      inserted: 0,
      skipped: 0,
      errors: 1,
      duration_ms,
      error_message: errorMessage,
      error_details: { stack: error instanceof Error ? error.stack : null },
    });

    return result;
  }
}

/**
 * Run every registered source. Used by the weekly cron and admin "force full".
 */
export async function runFullIngestion(
  options: IngestionOptions = {}
): Promise<IngestionReport> {
  return runIngestion({ ...options });
}

/**
 * Run only the "daily" cadence sources. Used by the nightly cron.
 */
export async function runDailyIngestion(
  options: IngestionOptions = {}
): Promise<IngestionReport> {
  const only = SOURCES.filter((s) => s.cadence === "daily").map((s) => s.name);
  return runIngestion({ ...options, only });
}

/**
 * Generic runner — runs all sources by default, or just the ones whose name
 * appears in `only`.
 */
export async function runIngestion(
  options: IngestionOptions = {}
): Promise<IngestionReport> {
  const runId = options.runId ?? randomUUID();
  const trigger = options.trigger ?? "manual";
  const startedAt = new Date().toISOString();
  const sources: IngestionResult[] = [];

  const selected = options.only
    ? SOURCES.filter((s) => options.only!.includes(s.name))
    : SOURCES;

  console.log(
    `=== Ingestion start (run ${runId}, trigger=${trigger}, ${selected.length} sources) ===`
  );

  for (const spec of selected) {
    const result = await ingestSource(runId, spec.name, trigger, spec);
    sources.push(result);
  }

  const completedAt = new Date().toISOString();

  const report: IngestionReport = {
    runId,
    trigger,
    startedAt,
    completedAt,
    totalFetched: sources.reduce((sum, s) => sum + s.fetched, 0),
    totalInserted: sources.reduce((sum, s) => sum + s.inserted, 0),
    totalSkipped: sources.reduce((sum, s) => sum + s.skipped, 0),
    totalErrors: sources.reduce((sum, s) => sum + s.errors, 0),
    sources,
  };

  console.log("=== Ingestion complete ===");
  console.log(
    `Total: ${report.totalFetched} fetched, ${report.totalInserted} inserted, ${report.totalSkipped} skipped, ${report.totalErrors} errors`
  );

  return report;
}

// Back-compat named export
export { SOURCES as INGESTION_SOURCES };
