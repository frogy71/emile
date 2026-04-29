/**
 * Blog grant selector — picks one grant per day for the SEO engine.
 *
 * Priority (highest first):
 *   1. blog_published_at IS NULL                  → never reuse a grant
 *   2. Deadline 30–90 days out                    → leaves time to act on it
 *   3. Known funders preferred                    → search-traffic friendly
 *   4. Thematic rotation                          → don't publish two
 *      consecutive articles on the same theme
 *   5. High amounts preferred                     → eye-catching headline
 *   6. Not used in carousel within last 7 days    → don't double-publish
 *
 * Pure scoring is exported for tests; the DB query lives in
 * `pickBlogGrant`.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { BlogGrantInput } from "./types";

const SELECT_COLUMNS =
  "id, title, summary, funder, country, thematic_areas, eligible_entities, eligible_countries, min_amount_eur, max_amount_eur, co_financing_required, deadline, grant_type, language, eligibility_conditions, ai_summary, blog_published_at, carousel_published_at, status";

/** "Known" funders that draw real organic traffic. Lowercase substrings. */
const KNOWN_FUNDERS = [
  "ademe",
  "fondation de france",
  "bpi",
  "agence nationale",
  "european commission",
  "commission européenne",
  "feder",
  "fse",
  "feader",
  "feampa",
  "anr",
  "région ",
  "ministère",
  "fondation orange",
  "fondation crédit",
  "fondation total",
  "fondation veolia",
  "fondation engie",
  "fondation edf",
  "fondation bnp",
];

const PRIORITY_MIN_DAYS = 30;
const PRIORITY_MAX_DAYS = 90;
const FALLBACK_MIN_DAYS = 14;
const FALLBACK_MAX_DAYS = 180;
const RECENT_THEME_LOOKBACK_DAYS = 7;
const CAROUSEL_LOOKBACK_DAYS = 7;

function daysFromNow(d: number): string {
  const x = new Date();
  x.setUTCHours(0, 0, 0, 0);
  x.setUTCDate(x.getUTCDate() + d);
  return x.toISOString();
}

function isoMinusDays(d: number): string {
  const x = new Date();
  x.setUTCDate(x.getUTCDate() - d);
  return x.toISOString();
}

function primaryTheme(g: BlogGrantInput): string {
  return (g.thematic_areas?.[0] || g.funder || g.id).toLowerCase();
}

function isKnownFunder(funder: string | null | undefined): boolean {
  if (!funder) return false;
  const lower = funder.toLowerCase();
  return KNOWN_FUNDERS.some((k) => lower.includes(k));
}

/**
 * Score a candidate. Higher is better. Pure for testability.
 */
export function scoreBlogCandidate(
  g: BlogGrantInput,
  recentThemes: string[] = [],
  recentCarouselIds: string[] = [],
  now = new Date()
): number {
  let score = 0;

  // Deadline window
  if (g.deadline) {
    const days = Math.ceil(
      (new Date(g.deadline).getTime() - now.getTime()) / 86_400_000
    );
    if (days >= PRIORITY_MIN_DAYS && days <= PRIORITY_MAX_DAYS) {
      score += 600;
    } else if (days >= FALLBACK_MIN_DAYS && days < PRIORITY_MIN_DAYS) {
      score += 250;
    } else if (days > PRIORITY_MAX_DAYS && days <= FALLBACK_MAX_DAYS) {
      score += 200;
    } else if (days < FALLBACK_MIN_DAYS) {
      // Too late to be useful for SEO traffic
      score -= 800;
    }
  } else {
    score += 50; // permanent calls still publishable
  }

  // Known funder bonus
  if (isKnownFunder(g.funder)) score += 300;

  // High amount bonus (log-scaled so 100k vs 1M doesn't blow out)
  if (g.max_amount_eur && g.max_amount_eur > 0) {
    score += Math.log10(g.max_amount_eur) * 60;
  }

  // Content depth — articles need raw material
  if (g.summary && g.summary.length >= 200) score += 80;
  if (g.eligibility_conditions && g.eligibility_conditions.length >= 100)
    score += 80;
  if (g.ai_summary && g.ai_summary.length >= 200) score += 60;
  if (g.thematic_areas && g.thematic_areas.length > 0) score += 40;

  // Theme rotation — penalise themes we just published on
  const theme = primaryTheme(g);
  if (recentThemes.includes(theme)) score -= 400;

  // Carousel overlap penalty
  if (recentCarouselIds.includes(g.id)) score -= 250;

  return score;
}

async function fetchPool(
  supabase: SupabaseClient,
  minDays: number,
  maxDays: number
): Promise<BlogGrantInput[]> {
  const { data, error } = await supabase
    .from("grants")
    .select(SELECT_COLUMNS)
    .eq("status", "active")
    .eq("blog_blacklisted", false)
    .is("blog_published_at", null)
    .gte("deadline", daysFromNow(minDays))
    .lte("deadline", daysFromNow(maxDays))
    .not("title", "is", null)
    .limit(120);
  if (error) throw error;
  return (data || []) as unknown as BlogGrantInput[];
}

async function fetchPoolNoDeadline(
  supabase: SupabaseClient
): Promise<BlogGrantInput[]> {
  const { data, error } = await supabase
    .from("grants")
    .select(SELECT_COLUMNS)
    .eq("status", "active")
    .eq("blog_blacklisted", false)
    .is("blog_published_at", null)
    .is("deadline", null)
    .not("title", "is", null)
    .limit(60);
  if (error) throw error;
  return (data || []) as unknown as BlogGrantInput[];
}

async function fetchRecentThemes(
  supabase: SupabaseClient,
  lookbackDays = RECENT_THEME_LOOKBACK_DAYS
): Promise<string[]> {
  const since = isoMinusDays(lookbackDays);
  const { data } = await supabase
    .from("blog_posts")
    .select("thematic_tag, published_at")
    .eq("status", "published")
    .gte("published_at", since)
    .order("published_at", { ascending: false });
  return (data || [])
    .map((r) => (r.thematic_tag || "").toLowerCase())
    .filter(Boolean);
}

async function fetchRecentCarouselGrantIds(
  supabase: SupabaseClient,
  lookbackDays = CAROUSEL_LOOKBACK_DAYS
): Promise<string[]> {
  const since = isoMinusDays(lookbackDays);
  // carousel_publications.date is a date string (YYYY-MM-DD)
  const sinceDate = since.slice(0, 10);
  const { data } = await supabase
    .from("carousel_publications")
    .select("grant_id, date")
    .gte("date", sinceDate);
  return (data || []).map((r) => r.grant_id).filter(Boolean) as string[];
}

export interface PickResult {
  grant: BlogGrantInput | null;
  poolSize: number;
}

export async function pickBlogGrant(
  supabase: SupabaseClient
): Promise<PickResult> {
  const [recentThemes, recentCarouselIds] = await Promise.all([
    fetchRecentThemes(supabase),
    fetchRecentCarouselGrantIds(supabase),
  ]);

  let pool = await fetchPool(supabase, PRIORITY_MIN_DAYS, PRIORITY_MAX_DAYS);
  if (pool.length === 0) {
    pool = await fetchPool(supabase, FALLBACK_MIN_DAYS, FALLBACK_MAX_DAYS);
  }
  if (pool.length === 0) {
    pool = await fetchPoolNoDeadline(supabase);
  }
  if (pool.length === 0) {
    return { grant: null, poolSize: 0 };
  }

  const now = new Date();
  pool.sort(
    (a, b) =>
      scoreBlogCandidate(b, recentThemes, recentCarouselIds, now) -
      scoreBlogCandidate(a, recentThemes, recentCarouselIds, now)
  );

  return { grant: pool[0], poolSize: pool.length };
}

/**
 * Quick health check: how many grants we still have to publish under the
 * priority window. Used by the cron to alert when the pool runs low.
 */
export async function getWritablePoolSize(
  supabase: SupabaseClient
): Promise<number> {
  const { count } = await supabase
    .from("grants")
    .select("id", { count: "exact", head: true })
    .eq("status", "active")
    .eq("blog_blacklisted", false)
    .is("blog_published_at", null)
    .gte("deadline", daysFromNow(FALLBACK_MIN_DAYS))
    .lte("deadline", daysFromNow(FALLBACK_MAX_DAYS));
  return count ?? 0;
}

export async function markGrantBlogPublished(
  supabase: SupabaseClient,
  grantId: string
): Promise<void> {
  const { error } = await supabase
    .from("grants")
    .update({ blog_published_at: new Date().toISOString() })
    .eq("id", grantId);
  if (error) throw error;
}
