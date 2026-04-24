/**
 * Master ingestion orchestrator
 *
 * Sources ranked by priority:
 *
 * 🔴 CRITICAL (API — automated):
 * 1. Aides-Territoires — ~3,000 aids (État + Régions + Départements + EPCI)
 * 2. EU Funding & Tenders — ~500 EU calls (CERV, Erasmus+, LIFE, ESF+)
 * 3. EuropeAid / INTPA — humanitarian + development calls
 *
 * Run strategy:
 * - Full sync: weekly (Sunday night)
 * - Incremental: daily (new grants only)
 * - On-demand: triggered by admin
 */

import {
  fetchAllAidesAssociations,
  transformToGrant,
} from "./aides-territoires";
import { fetchEUOpenCalls, transformEUToGrant } from "./eu-funding";
import { fetchEuropeAidCalls, transformEuropeAidToGrant } from "./europeaid";
import { fetchFRUP, transformFRUPToGrant, fetchFondationsEntreprises, transformFEToGrant } from "./data-gouv";
import { fetchBpiGrants, transformBpiToGrant } from "./bpifrance";
import { fetchCuratedFoundations, transformCuratedToGrant } from "./fondations-curated";
import { fetchFondationDeFrance, transformFDFToGrant } from "./fondation-de-france";

export interface IngestionResult {
  source: string;
  fetched: number;
  transformed: number;
  inserted: number;
  skipped: number;
  errors: number;
  duration_ms: number;
}

export interface IngestionReport {
  startedAt: string;
  completedAt: string;
  totalFetched: number;
  totalInserted: number;
  totalSkipped: number;
  sources: IngestionResult[];
}

/**
 * Insert grants into Supabase via REST API
 * Uses upsert (insert or update on conflict) based on source_url
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function upsertGrants(
  grants: Record<string, any>[]
): Promise<{ inserted: number; skipped: number; errors: number }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  // Batch upsert in chunks of 50
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
      deadline: g.deadline?.toISOString() || null,
      grant_type: g.grantType,
      language: g.language,
      status: g.status,
      ai_summary: g.aiSummary,
    }));

    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/grants`, {
        method: "POST",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify(chunk),
      });

      if (res.ok) {
        inserted += chunk.length;
      } else {
        const errText = await res.text();
        // If it's a duplicate error, count as skipped
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

    // Log progress
    if ((i + chunkSize) % 200 === 0 || i + chunkSize >= grants.length) {
      console.log(
        `[Upsert] Progress: ${Math.min(i + chunkSize, grants.length)}/${grants.length}`
      );
    }
  }

  return { inserted, skipped, errors };
}

/**
 * Run full ingestion from all automated sources
 */
export async function runFullIngestion(): Promise<IngestionReport> {
  const startedAt = new Date().toISOString();
  const sources: IngestionResult[] = [];

  console.log("=== Starting full ingestion ===");

  // 1. Aides-Territoires (biggest source)
  const at = await ingestSource("Aides-Territoires", async () => {
    const raw = await fetchAllAidesAssociations();
    return raw.map(transformToGrant);
  });
  sources.push(at);

  // 2. EU Funding & Tenders
  const eu = await ingestSource("EU Funding & Tenders", async () => {
    const raw = await fetchEUOpenCalls();
    return raw.map(transformEUToGrant);
  });
  sources.push(eu);

  // 3. EuropeAid
  const ea = await ingestSource("EuropeAid / INTPA", async () => {
    const raw = await fetchEuropeAidCalls();
    return raw.map(transformEuropeAidToGrant);
  });
  sources.push(ea);

  // 4. data.gouv.fr — FRUP
  const frup = await ingestSource("data.gouv.fr — FRUP", async () => {
    const raw = await fetchFRUP();
    return raw.map((row, i) => transformFRUPToGrant(row, i));
  });
  sources.push(frup);

  // 5. data.gouv.fr — Fondations d'entreprises
  const fe = await ingestSource("data.gouv.fr — Fondations entreprises", async () => {
    const raw = await fetchFondationsEntreprises();
    return raw.map((row, i) => transformFEToGrant(row, i));
  });
  sources.push(fe);

  // 6. BPI France
  const bpi = await ingestSource("BPI France", async () => {
    const raw = await fetchBpiGrants();
    return raw.map(transformBpiToGrant);
  });
  sources.push(bpi);

  // 7. Fondations françaises (curated)
  const curated = await ingestSource("Fondations françaises (curated)", async () => {
    const raw = fetchCuratedFoundations();
    return raw.map(transformCuratedToGrant);
  });
  sources.push(curated);

  // 8. Fondation de France — live scraping of active calls
  const fdf = await ingestSource("Fondation de France (appels actifs)", async () => {
    const raw = await fetchFondationDeFrance();
    return raw.map(transformFDFToGrant);
  });
  sources.push(fdf);

  const completedAt = new Date().toISOString();

  const report: IngestionReport = {
    startedAt,
    completedAt,
    totalFetched: sources.reduce((sum, s) => sum + s.fetched, 0),
    totalInserted: sources.reduce((sum, s) => sum + s.inserted, 0),
    totalSkipped: sources.reduce((sum, s) => sum + s.skipped, 0),
    sources,
  };

  console.log("=== Ingestion complete ===");
  console.log(
    `Total: ${report.totalFetched} fetched, ${report.totalInserted} inserted, ${report.totalSkipped} skipped`
  );

  return report;
}

/**
 * Run ingestion for a single source with error handling and DB insert
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ingestSource(
  name: string,
  fetchAndTransform: () => Promise<Record<string, any>[]>
): Promise<IngestionResult> {
  const start = Date.now();
  try {
    console.log(`[${name}] Fetching...`);
    const grants = await fetchAndTransform();
    console.log(`[${name}] Fetched ${grants.length} grants, upserting to DB...`);

    const { inserted, skipped, errors } = await upsertGrants(grants);

    console.log(
      `[${name}] Done: ${inserted} inserted, ${skipped} skipped, ${errors} errors`
    );

    return {
      source: name,
      fetched: grants.length,
      transformed: grants.length,
      inserted,
      skipped,
      errors,
      duration_ms: Date.now() - start,
    };
  } catch (error) {
    console.error(`[${name}] Ingestion failed:`, error);
    return {
      source: name,
      fetched: 0,
      transformed: 0,
      inserted: 0,
      skipped: 0,
      errors: 1,
      duration_ms: Date.now() - start,
    };
  }
}
