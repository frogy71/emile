/**
 * Local runner for the master ingestion orchestrator.
 *
 * Mirrors the pattern in scripts/run-foundation-portals.ts so we can
 * re-run every API/HTML source with the latest transform layer (deadlines,
 * amounts, funders) without depending on a deployed Vercel function.
 *
 * Usage:
 *   npx tsx scripts/run-full-ingestion.ts            # run every source
 *   npx tsx scripts/run-full-ingestion.ts --skip-foundations
 *
 * The foundation-portal source is also part of the registry but it's
 * covered by scripts/run-foundation-portals.ts (no batch cap) so the
 * --skip-foundations flag avoids running it twice.
 */

import dotenv from "dotenv";
import path from "path";
import fs from "fs";

const candidates = [
  path.resolve(process.cwd(), ".env.local"),
  "/tmp/.env.prod",
];
for (const p of candidates) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p, override: true });
  }
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

import {
  INGESTION_SOURCES,
  runIngestion,
  runFullIngestion,
  markExpiredGrants,
} from "../src/lib/ingestion";

async function main() {
  const skipFoundations = process.argv.includes("--skip-foundations");
  const start = Date.now();

  let report;
  if (skipFoundations) {
    const only = INGESTION_SOURCES.filter(
      (s) => s.name !== "Fondations privées — appels actifs"
    ).map((s) => s.name);
    console.log(
      `[full-ingestion] Running ${only.length} sources (foundations skipped):`
    );
    only.forEach((n) => console.log(`  - ${n}`));
    report = await runIngestion({ trigger: "manual", only });
  } else {
    console.log("[full-ingestion] Running every registered source");
    report = await runFullIngestion({ trigger: "manual" });
  }

  console.log("\n[full-ingestion] Marking expired grants...");
  const expired = await markExpiredGrants();
  console.log(`[full-ingestion] Expired marked: ${expired}`);

  console.log("\n=== SUMMARY ===");
  console.log(`Run ID: ${report.runId}`);
  console.log(`Duration: ${Math.round((Date.now() - start) / 1000)}s`);
  console.log(`Total fetched: ${report.totalFetched}`);
  console.log(`Total inserted/updated: ${report.totalInserted}`);
  console.log(`Total skipped: ${report.totalSkipped}`);
  console.log(`Total errors: ${report.totalErrors}`);
  console.log("\nPer-source:");
  for (const s of report.sources) {
    console.log(
      `  [${s.status}] ${s.source}: fetched=${s.fetched} inserted=${s.inserted} skipped=${s.skipped} errors=${s.errors} (${Math.round(s.duration_ms / 1000)}s)${s.error_message ? "  err=" + s.error_message : ""}`
    );
  }
}

main().catch((e) => {
  console.error("[full-ingestion] Fatal:", e);
  process.exit(1);
});
