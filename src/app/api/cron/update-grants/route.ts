import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { runDailyIngestion, markExpiredGrants } from "@/lib/ingestion";

/**
 * CRON: daily incremental grant update (Vercel cron, 06:00 UTC)
 *
 * Runs only the "daily" sources (Aides-Territoires, EU Funding, Fondation de
 * France, ADEME) — the fast API / scraping sources we want to keep fresh.
 * Heavy / static sources run in the weekly cron.
 *
 * After the run we mark expired grants (deadline < now) so the catalog stays
 * clean for the user-facing matching.
 *
 * Auth:
 * - Vercel sends `Authorization: Bearer <CRON_SECRET>` if set in env
 * - Manual calls from the admin dashboard use the user session (no secret)
 * - The admin UI calls a dedicated route (/api/admin/ingest) which bypasses
 *   this check via Supabase session instead
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

  const supabase = getSupabase();
  const startTime = Date.now();

  try {
    const report = await runDailyIngestion({ trigger: "cron-daily" });
    const expired = await markExpiredGrants();

    const { count: totalGrants } = await supabase
      .from("grants")
      .select("id", { count: "exact", head: true });

    const { count: activeGrants } = await supabase
      .from("grants")
      .select("id", { count: "exact", head: true })
      .eq("status", "active");

    const duration_seconds = Math.round((Date.now() - startTime) / 1000);

    console.log("[CRON daily] complete", {
      runId: report.runId,
      totalFetched: report.totalFetched,
      totalInserted: report.totalInserted,
      totalErrors: report.totalErrors,
      expired,
      totalGrants,
      activeGrants,
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
      active_grants: activeGrants,
    });
  } catch (error) {
    console.error("[CRON daily] failed:", error);
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
export const maxDuration = 300; // Hobby plan max — daily ingest (fast sources)
