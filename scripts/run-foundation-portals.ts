/**
 * Local runner for the foundation-portal crawler + reconciler.
 *
 * Why: on Vercel's Hobby plan serverless functions are capped at 60s,
 * which is not enough to visit ~200+ foundation portals × one LLM call
 * each. This script runs the same code locally (no time cap) against
 * production Supabase so we get the first full baseline of AAP data
 * and lifecycle events without waiting for a plan upgrade.
 *
 * Usage:
 *   pnpm exec tsx scripts/run-foundation-portals.ts
 *
 * Requires .env.local (or equivalent exported vars) with:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - ANTHROPIC_API_KEY
 */

import dotenv from "dotenv";
import crypto from "crypto";
import path from "path";
import fs from "fs";

// Try .env.local first, then /tmp/.env.prod as fallback
const candidates = [
  path.resolve(process.cwd(), ".env.local"),
  "/tmp/.env.prod",
];
for (const p of candidates) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p, override: true });
  }
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.ANTHROPIC_API_KEY) {
  console.error("Missing one of: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY");
  process.exit(1);
}

import { crawlFoundationPortalsSnapshots } from "../src/lib/ingestion/foundation-portal-crawler";
import { reconcileFoundationPortals } from "../src/lib/ingestion/foundation-portal-reconciler";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function insertIngestionLog(
  runId: string,
  trigger: string
): Promise<string | null> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/ingestion_logs`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      run_id: runId,
      source_name: "Fondations privées — appels actifs",
      status: "running",
      trigger,
      started_at: new Date().toISOString(),
    }),
  });
  if (!res.ok) {
    console.error("log insert failed:", res.status, await res.text());
    return null;
  }
  const json = (await res.json()) as Array<{ id: string }>;
  return json[0]?.id ?? null;
}

async function finishIngestionLog(
  logId: string,
  status: "success" | "failed",
  payload: {
    fetched: number;
    inserted: number;
    skipped: number;
    errors: number;
    error_message?: string | null;
    duration_ms: number;
  }
) {
  await fetch(
    `${SUPABASE_URL}/rest/v1/ingestion_logs?id=eq.${encodeURIComponent(logId)}`,
    {
      method: "PATCH",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status,
        completed_at: new Date().toISOString(),
        fetched: payload.fetched,
        inserted: payload.inserted,
        skipped: payload.skipped,
        errors: payload.errors,
        duration_ms: payload.duration_ms,
        error_message: payload.error_message ?? null,
      }),
    }
  );
}

async function main() {
  const runId = crypto.randomUUID();
  const start = Date.now();
  const trigger = process.argv.includes("--cron") ? "cron-weekly" : "local-backfill";
  console.log(`[local-runner] Run ${runId} trigger=${trigger}`);

  const logId = await insertIngestionLog(runId, trigger);
  if (!logId) {
    console.error("Could not create ingestion log row — continuing anyway.");
  }

  try {
    const snapshots = await crawlFoundationPortalsSnapshots({
      budgetSeconds: 1800, // 30 min, cap big enough to finish all ~220 foundations
    });
    const totalFetched = snapshots.reduce((n, s) => n + s.calls.length, 0);
    console.log(
      `[local-runner] Crawl done — ${snapshots.length} foundations, ${totalFetched} calls`
    );

    const res = await reconcileFoundationPortals(snapshots, runId);
    console.log("[local-runner] Reconcile:", res);

    const inserted =
      res.opened + res.reopened + res.stillOpen + res.closed + res.disappeared;

    if (logId) {
      await finishIngestionLog(logId, "success", {
        fetched: totalFetched,
        inserted,
        skipped: 0,
        errors: res.foundationsSkippedUnreachable,
        duration_ms: Date.now() - start,
      });
    }

    console.log(
      `[local-runner] Done in ${Math.round((Date.now() - start) / 1000)}s — opened=${res.opened} reopened=${res.reopened} stillOpen=${res.stillOpen} closed=${res.closed} disappeared=${res.disappeared} unreachable=${res.foundationsSkippedUnreachable}`
    );
  } catch (e) {
    console.error("[local-runner] Failed:", e);
    if (logId) {
      await finishIngestionLog(logId, "failed", {
        fetched: 0,
        inserted: 0,
        skipped: 0,
        errors: 1,
        error_message: e instanceof Error ? e.message : String(e),
        duration_ms: Date.now() - start,
      });
    }
    process.exit(1);
  }
}

main();
