import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { INGESTION_SOURCES } from "@/lib/ingestion";

/**
 * GET /api/admin/ingestion-health
 *
 * Returns per-source ingestion health based on the `ingestion_logs` table:
 * - last run timestamp, duration, status
 * - fetched / inserted / errors for the last run
 * - consecutive failure count
 * - live grant count from `grants`
 *
 * Admin-only (gated by email allowlist, matches /api/admin/stats).
 */

const ADMIN_EMAILS = ["francois@tresorier.co", "tresorier.francois@gmail.com"];

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(request: Request) {
  const supabase = getSupabase();

  // Auth
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = authHeader.split("Bearer ")[1];
  const {
    data: { user },
  } = await supabase.auth.getUser(token);
  if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── Per-source health ──────────────────────────────────────────
  const sourceNames = INGESTION_SOURCES.map((s) => s.name);
  const health = [];

  for (const name of sourceNames) {
    // Last run (ordered by started_at desc)
    const { data: lastRows } = await supabase
      .from("ingestion_logs")
      .select("*")
      .eq("source_name", name)
      .order("started_at", { ascending: false })
      .limit(5);

    const lastRun = lastRows?.[0] ?? null;
    const recentRuns = lastRows ?? [];

    // Count consecutive failures (walk back until we hit success)
    let consecutiveFailures = 0;
    for (const r of recentRuns) {
      if (r.status === "failed") consecutiveFailures++;
      else break;
    }

    // Live grant count
    const { count: grantCount } = await supabase
      .from("grants")
      .select("id", { count: "exact", head: true })
      .eq("source_name", name);

    const { count: activeGrantCount } = await supabase
      .from("grants")
      .select("id", { count: "exact", head: true })
      .eq("source_name", name)
      .eq("status", "active");

    const cadence =
      INGESTION_SOURCES.find((s) => s.name === name)?.cadence ?? "weekly";

    health.push({
      name,
      cadence,
      grantCount: grantCount || 0,
      activeGrantCount: activeGrantCount || 0,
      lastRun: lastRun
        ? {
            startedAt: lastRun.started_at,
            completedAt: lastRun.completed_at,
            status: lastRun.status,
            fetched: lastRun.fetched,
            inserted: lastRun.inserted,
            skipped: lastRun.skipped,
            errors: lastRun.errors,
            durationMs: lastRun.duration_ms,
            errorMessage: lastRun.error_message,
            trigger: lastRun.trigger,
          }
        : null,
      consecutiveFailures,
      reliability: computeReliability(recentRuns, cadence, lastRun),
    });
  }

  // ── Recent runs (last 20 across all sources) ──────────────────
  const { data: recentLogs } = await supabase
    .from("ingestion_logs")
    .select(
      "id, run_id, source_name, started_at, completed_at, status, fetched, inserted, errors, duration_ms, trigger"
    )
    .order("started_at", { ascending: false })
    .limit(20);

  // ── Totals ────────────────────────────────────────────────────
  const { count: totalGrants } = await supabase
    .from("grants")
    .select("id", { count: "exact", head: true });
  const { count: activeGrants } = await supabase
    .from("grants")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    totals: {
      totalGrants: totalGrants || 0,
      activeGrants: activeGrants || 0,
      sources: sourceNames.length,
    },
    sources: health,
    recentRuns: recentLogs ?? [],
  });
}

function computeReliability(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recentRuns: any[],
  cadence: "daily" | "weekly",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lastRun: any
): "healthy" | "degraded" | "broken" | "stale" | "unknown" {
  if (!lastRun) return "unknown";

  // Stale = last success is too old compared to cadence
  const staleWindowMs =
    cadence === "daily" ? 2 * 24 * 3600 * 1000 : 10 * 24 * 3600 * 1000;
  const last = new Date(lastRun.started_at).getTime();
  if (Date.now() - last > staleWindowMs) return "stale";

  const failures = recentRuns.filter((r) => r.status === "failed").length;
  if (failures === 0) return "healthy";
  if (failures >= recentRuns.length) return "broken";
  return "degraded";
}
