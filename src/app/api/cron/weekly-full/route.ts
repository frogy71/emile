import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { runFullIngestion, markExpiredGrants } from "@/lib/ingestion";

/**
 * CRON: weekly full ingestion (Sunday 02:00 UTC)
 *
 * Runs every configured source, including the slower / static ones
 * (data.gouv.fr FRUP, Fondations entreprises, BPI, curated foundations, FDVA,
 * ANS). This is the "ground truth" sync that guarantees exhaustiveness.
 *
 * If Aides-Territoires or another API is temporarily down mid-week, the
 * weekly run catches up when it recovers.
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
    const report = await runFullIngestion({ trigger: "cron-weekly" });
    const expired = await markExpiredGrants();

    const { count: totalGrants } = await supabase
      .from("grants")
      .select("id", { count: "exact", head: true });

    const { count: activeGrants } = await supabase
      .from("grants")
      .select("id", { count: "exact", head: true })
      .eq("status", "active");

    const duration_seconds = Math.round((Date.now() - startTime) / 1000);

    console.log("[CRON weekly-full] complete", {
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
    console.error("[CRON weekly-full] failed:", error);
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
export const maxDuration = 800;
