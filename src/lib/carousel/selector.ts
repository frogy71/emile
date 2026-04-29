import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Subset of the grants table the carousel maker actually needs. Kept narrow
 * on purpose so we never accidentally surface fields that belong only inside
 * the app (application_url, contact_info, full eligibility, etc.).
 */
export interface CarouselGrant {
  id: string;
  title: string;
  summary: string | null;
  funder: string | null;
  thematic_areas: string[] | null;
  max_amount_eur: number | null;
  deadline: string | null;
  eligibility_conditions: string | null;
}

const SELECT_COLUMNS =
  "id, title, summary, funder, thematic_areas, max_amount_eur, deadline, eligibility_conditions, carousel_published_at, status";

const PRIORITY_WINDOW_MIN_DAYS = 14;
const PRIORITY_WINDOW_MAX_DAYS = 30;
const FALLBACK_WINDOW_MAX_DAYS = 90;
const PER_DAY = 2;

function daysFromNow(d: number): string {
  const x = new Date();
  x.setUTCHours(0, 0, 0, 0);
  x.setUTCDate(x.getUTCDate() + d);
  return x.toISOString();
}

/**
 * Score a candidate so the cherry-picker prefers high-amount, soon-deadline,
 * thematic-rich rows. Pure function so it can be unit tested without a DB.
 */
export function scoreGrant(g: CarouselGrant, now = new Date()): number {
  let score = 0;

  if (g.max_amount_eur && g.max_amount_eur > 0) {
    // log10 keeps a 100k grant from completely dominating a 10k grant — we
    // still want some rotation. log10(1_000_000) ≈ 6 → 600 points.
    score += Math.log10(g.max_amount_eur) * 100;
  }

  if (g.deadline) {
    const days = Math.ceil(
      (new Date(g.deadline).getTime() - now.getTime()) / 86_400_000
    );
    if (days >= PRIORITY_WINDOW_MIN_DAYS && days <= PRIORITY_WINDOW_MAX_DAYS) {
      score += 500; // sweet spot — urgent but reachable
    } else if (days >= 7 && days < PRIORITY_WINDOW_MIN_DAYS) {
      score += 200;
    } else if (days > PRIORITY_WINDOW_MAX_DAYS && days <= FALLBACK_WINDOW_MAX_DAYS) {
      score += 100;
    } else if (days < 7) {
      score -= 1000; // too late to act on, penalise hard
    }
  }

  if (g.summary && g.summary.length > 80) score += 50;
  if (g.thematic_areas && g.thematic_areas.length > 0) score += 30;

  return score;
}

/**
 * Picks N grants for today's carousels.
 *
 * Rules (in order):
 *  1. Never pick a grant with carousel_published_at set
 *  2. Prefer deadline in [14, 30] days (urgency window)
 *  3. Prefer high amounts
 *  4. Rotate thematic areas — never two carousels from the same primary theme
 *  5. Active grants only
 *
 * Returns up to `count` grants, ranked by score then de-duped on theme.
 */
export async function pickCarouselGrants(
  supabase: SupabaseClient,
  count = PER_DAY
): Promise<CarouselGrant[]> {
  const now = new Date();

  const tryFetch = async (
    minDays: number,
    maxDays: number
  ): Promise<CarouselGrant[]> => {
    const { data, error } = await supabase
      .from("grants")
      .select(SELECT_COLUMNS)
      .eq("status", "active")
      .is("carousel_published_at", null)
      .gte("deadline", daysFromNow(minDays))
      .lte("deadline", daysFromNow(maxDays))
      .not("title", "is", null)
      .limit(60);
    if (error) throw error;
    return (data || []) as CarouselGrant[];
  };

  let pool = await tryFetch(PRIORITY_WINDOW_MIN_DAYS, PRIORITY_WINDOW_MAX_DAYS);
  if (pool.length < count) {
    // widen the deadline window so we always have something to publish, even
    // on a slow week
    pool = await tryFetch(7, FALLBACK_WINDOW_MAX_DAYS);
  }

  // Rank highest score first
  pool.sort((a, b) => scoreGrant(b, now) - scoreGrant(a, now));

  // Theme rotation — once we've taken a grant on theme X, skip the next ones
  // on theme X until we've fulfilled `count`.
  const used = new Set<string>();
  const picked: CarouselGrant[] = [];

  const primaryTheme = (g: CarouselGrant) =>
    (g.thematic_areas?.[0] || g.funder || g.id).toLowerCase();

  for (const g of pool) {
    const theme = primaryTheme(g);
    if (used.has(theme)) continue;
    picked.push(g);
    used.add(theme);
    if (picked.length >= count) break;
  }

  // If theme rotation starved us (every grant shares a theme), fill from the
  // top of the ranked pool regardless.
  if (picked.length < count) {
    for (const g of pool) {
      if (picked.find((p) => p.id === g.id)) continue;
      picked.push(g);
      if (picked.length >= count) break;
    }
  }

  return picked;
}

/** Stamp the selected grants so they aren't re-published. */
export async function markCarouselPublished(
  supabase: SupabaseClient,
  ids: string[]
): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase
    .from("grants")
    .update({ carousel_published_at: new Date().toISOString() })
    .in("id", ids);
  if (error) throw error;
}
