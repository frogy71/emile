import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { runIngestion, markExpiredGrants } from "@/lib/ingestion";

/**
 * CRON: weekly private-foundation portal crawl (Wednesday 03:00 UTC)
 *
 * Every private foundation has its own portal and publishes its own
 * "appels à projets" (calls for projects). This cron walks the curated
 * foundation list, visits each portal, finds the calls-for-projects page
 * heuristically, and uses Claude Haiku to extract 0..N structured call
 * objects into our grants table.
 *
 * Runs on its own schedule (separate from weekly-full on Sunday) so the
 * LLM workload has its own 300s budget and doesn't starve the other
 * sources. Mid-week timing also means we pick up new calls fast.
 */
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function handle(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const supabase = getSupabase();

  try {
    const report = await runIngestion({
      trigger: "cron-weekly",
      only: ["Fondations privées — appels actifs"],
    });
    const expired = await markExpiredGrants();

    const { count: totalGrants } = await supabase
      .from("grants")
      .select("id", { count: "exact", head: true });

    const { count: foundationCalls } = await supabase
      .from("grants")
      .select("id", { count: "exact", head: true })
      .eq("source_name", "Fondations privées — appels actifs");

    const duration_seconds = Math.round((Date.now() - startTime) / 1000);

    console.log("[CRON foundation-portals] complete", {
      runId: report.runId,
      totalFetched: report.totalFetched,
      totalInserted: report.totalInserted,
      totalErrors: report.totalErrors,
      expired,
      totalGrants,
      foundationCalls,
      duration_seconds,
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration_seconds,
      runId: report.runId,
      report,
      expired_marked: expired,
      total_grants: totalGrants,
      foundation_calls: foundationCalls,
    });
  } catch (error) {
    console.error("[CRON foundation-portals] failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export const GET = handle;
export const POST = handle;
export const maxDuration = 300; // Hobby plan cap — LLM extraction × N portals
