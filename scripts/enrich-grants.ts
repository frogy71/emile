#!/usr/bin/env -S npx tsx
/**
 * Run a single enrichment batch from the command line / a cron.
 *
 * Usage:
 *   npx tsx scripts/enrich-grants.ts            # default 100 rows
 *   npx tsx scripts/enrich-grants.ts 500        # custom batch size
 *
 * Idempotent: each run pulls the next N grants where enriched_at IS NULL,
 * processes them sequentially, and writes the result back. Safe to schedule
 * every few minutes; queue drains naturally and the job is a no-op when the
 * database is fully enriched.
 */

import { config } from "dotenv";
// override:true so .env.local wins over a stale empty ANTHROPIC_API_KEY in
// the shell — without it dotenv silently keeps the empty value and the
// enricher fails at the LLM step.
config({ path: ".env.local", override: true });

import { enrichGrantsBatch } from "../src/lib/ai/grant-enricher";

async function main() {
  const arg = process.argv[2];
  const limit = arg ? Math.max(1, parseInt(arg, 10) || 100) : 100;

  console.log(`[enrich-grants] starting batch of up to ${limit}`);
  const t0 = Date.now();
  try {
    const r = await enrichGrantsBatch(limit);
    const dur = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(
      `[enrich-grants] done in ${dur}s — processed=${r.processed} ok=${r.ok} failed=${r.failed}`
    );
    process.exit(0);
  } catch (e) {
    console.error("[enrich-grants] crashed:", e);
    process.exit(1);
  }
}

main();
