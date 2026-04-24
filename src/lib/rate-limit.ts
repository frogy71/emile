import { createClient } from "@supabase/supabase-js";

/**
 * Simple per-user rate limiter backed by the existing `ai_usage_logs` table.
 *
 * We don't need Redis: we already log every AI call to Supabase, so counting
 * recent rows for a given user + action gives us a free sliding-window check.
 *
 * Serverless-safe (no in-memory state), and naturally scales with Postgres.
 *
 * Usage:
 *   const rl = await checkRateLimit(userId, "scoring", { limit: 20, windowSec: 60 });
 *   if (!rl.ok) return NextResponse.json({ error: rl.message }, { status: 429 });
 */

type Action = "scoring" | "proposal" | "project_suggest" | "enrich";

export interface RateLimitConfig {
  limit: number;
  windowSec: number;
}

export interface RateLimitResult {
  ok: boolean;
  count: number;
  limit: number;
  retryAfterSec: number;
  message: string;
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function checkRateLimit(
  userId: string,
  action: Action,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  if (!userId) {
    // We don't rate-limit anonymous here; callers should enforce auth first.
    return {
      ok: true,
      count: 0,
      limit: config.limit,
      retryAfterSec: 0,
      message: "No user to rate-limit",
    };
  }

  try {
    const supabase = getSupabase();
    const since = new Date(
      Date.now() - config.windowSec * 1000
    ).toISOString();

    const { count, error } = await supabase
      .from("ai_usage_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("action", action)
      .gte("created_at", since);

    if (error) {
      // Fail-open: if the rate-limit query itself errored we don't want to
      // block paying users on infra blips. Admin dashboard reveals anomalies.
      console.warn("rate-limit query failed:", error.message);
      return {
        ok: true,
        count: 0,
        limit: config.limit,
        retryAfterSec: 0,
        message: "Rate limit check skipped (DB error)",
      };
    }

    const current = count ?? 0;
    if (current >= config.limit) {
      return {
        ok: false,
        count: current,
        limit: config.limit,
        retryAfterSec: config.windowSec,
        message: `Trop de requêtes. Réessaie dans ${config.windowSec}s (${current}/${config.limit} dans la dernière minute).`,
      };
    }
    return {
      ok: true,
      count: current,
      limit: config.limit,
      retryAfterSec: 0,
      message: "ok",
    };
  } catch (e) {
    console.warn("rate-limit unexpected error:", e);
    return {
      ok: true,
      count: 0,
      limit: config.limit,
      retryAfterSec: 0,
      message: "Rate limit check skipped (unexpected error)",
    };
  }
}

/**
 * Preset limits — easy to tune in one place.
 */
export const RATE_LIMITS = {
  scoring: { limit: 30, windowSec: 60 }, // bursty matching computations
  proposal: { limit: 5, windowSec: 60 }, // expensive Sonnet calls
  enrich: { limit: 10, windowSec: 60 },
  project_suggest: { limit: 10, windowSec: 60 },
} as const;
