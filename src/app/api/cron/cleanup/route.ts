import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { markExpiredGrants } from "@/lib/ingestion";

/**
 * CRON: daily cleanup (04:00 UTC)
 *
 * - Marks every active grant whose deadline is in the past as "expired".
 * - Cheap — runs every day regardless of ingestion status so the catalog
 *   stays clean even if ingestion fails.
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

  const start = Date.now();
  try {
    const expired = await markExpiredGrants();

    const supabase = getSupabase();
    const { count: activeGrants } = await supabase
      .from("grants")
      .select("id", { count: "exact", head: true })
      .eq("status", "active");

    const duration_seconds = Math.round((Date.now() - start) / 1000);
    console.log("[CRON cleanup]", { expired, activeGrants, duration_seconds });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      expired_marked: expired,
      active_grants: activeGrants,
      duration_seconds,
    });
  } catch (error) {
    console.error("[CRON cleanup] failed:", error);
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
