#!/usr/bin/env -S npx tsx
/**
 * Drain the entire enrichment queue. Loops calls to enrichGrantsBatch (the
 * underlying function only ever processes enriched_at IS NULL rows and stamps
 * the timestamp on its way out, so each iteration moves forward) until the
 * queue is empty.
 *
 * Use this for the one-shot "catch up" before launch. Steady-state goes
 * through the cron (50 / 6h).
 */
import { config } from "dotenv";
config({ path: ".env.local", override: true });

import { enrichGrantsBatch } from "../src/lib/ai/grant-enricher";

const BATCH = 30;

async function main() {
  let totalProcessed = 0, totalOk = 0, totalFailed = 0;
  const t0 = Date.now();
  // Hard ceiling so a runaway loop can't spin forever — at 30/batch this
  // covers up to 60_000 grants which is more than 10x the catalog.
  for (let i = 0; i < 2000; i++) {
    const r = await enrichGrantsBatch(BATCH);
    if (r.processed === 0) {
      console.log(`[enrich-all] queue drained after ${i} batches`);
      break;
    }
    totalProcessed += r.processed;
    totalOk += r.ok;
    totalFailed += r.failed;
    const elapsedMin = ((Date.now() - t0) / 60000).toFixed(1);
    console.log(
      `[enrich-all] batch ${i + 1}: +${r.ok} ok, +${r.failed} failed | ` +
        `running totals ${totalOk} ok, ${totalFailed} failed | ${elapsedMin} min elapsed`
    );
  }
  const dur = ((Date.now() - t0) / 60000).toFixed(1);
  console.log(
    `[enrich-all] DONE in ${dur} min — processed=${totalProcessed} ok=${totalOk} failed=${totalFailed}`
  );
}

main().catch((e) => {
  console.error("[enrich-all] crashed:", e);
  process.exit(1);
});
