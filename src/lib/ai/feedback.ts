/**
 * Feedback-based score adjustment.
 *
 * After Stage 2 (heuristic + semantic blend) and before Stage 3 (Haiku
 * refinement) we apply a feedback multiplier to each candidate grant
 * based on the org's interaction history:
 *
 *   POSITIVE SIGNALS (boost up to ~+15%):
 *     - Org previously liked / saved / applied to a grant from the same
 *       funder, with overlapping thematic_areas, or the same grant_type.
 *     - Each axis contributes additively, capped at +15% total so a single
 *       repeat-funder doesn't overwhelm objective fit.
 *
 *   NEGATIVE SIGNALS (penalty up to -10%):
 *     - Org previously dismissed / disliked from the same funder or with
 *       overlapping themes — clear "not interested" signal.
 *
 *   POPULARITY SIGNAL (+0–5%):
 *     - Grants with higher popularity_score (other orgs are interested)
 *       get a small "wisdom of the crowd" bump. Saturates fast — beyond
 *       ~10 interactions the boost flattens.
 *
 * Why a multiplier rather than additive points? Heuristic + semantic
 * already produce a 0–100 score with meaningful spread. A multiplier
 * preserves the rank of objectively-good matches while amplifying the
 * signals we've learned about the user.
 */

export interface FeedbackSignals {
  /** Funders the org has positively engaged with (lowercased). */
  likedFunders: Set<string>;
  /** Funders the org has negatively engaged with (lowercased). */
  dislikedFunders: Set<string>;
  /** Themes the org has positively engaged with (lowercased). */
  likedThemes: Set<string>;
  /** Themes the org has negatively engaged with (lowercased). */
  dislikedThemes: Set<string>;
  /** Grant types the org has positively engaged with (lowercased). */
  likedGrantTypes: Set<string>;
}

export interface FeedbackInput {
  funder?: string | null;
  thematicAreas?: string[] | null;
  grantType?: string | null;
  popularityScore?: number | null;
}

export interface FeedbackAdjustment {
  /** Multiplier applied to the score (1 = neutral). */
  multiplier: number;
  /** Boost contribution (positive) before clamping. */
  positiveBoost: number;
  /** Penalty contribution (negative) before clamping. */
  negativePenalty: number;
  /** Popularity bump (positive). */
  popularityBoost: number;
}

const POSITIVE_TYPES = new Set(["like", "save", "apply"]);
const NEGATIVE_TYPES = new Set(["dislike", "dismiss"]);

/** Lowercase + strip diacritics + trim — same shape as scoring.normalize. */
function norm(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

interface InteractionRow {
  interaction_type: string;
  grants: {
    funder?: string | null;
    thematic_areas?: string[] | null;
    grant_type?: string | null;
  } | null;
}

/**
 * Build the per-org signal sets from raw interaction rows. A funder/theme
 * appears in BOTH the positive and negative set if the org has done both
 * — in that case the negative set wins at scoring time (most recent
 * intent matters less than "explicitly didn't want this kind of thing").
 */
export function buildFeedbackSignals(
  rows: InteractionRow[]
): FeedbackSignals {
  const signals: FeedbackSignals = {
    likedFunders: new Set(),
    dislikedFunders: new Set(),
    likedThemes: new Set(),
    dislikedThemes: new Set(),
    likedGrantTypes: new Set(),
  };

  for (const row of rows) {
    const grant = row.grants;
    if (!grant) continue;
    const isPositive = POSITIVE_TYPES.has(row.interaction_type);
    const isNegative = NEGATIVE_TYPES.has(row.interaction_type);
    if (!isPositive && !isNegative) continue;

    const funder = norm(grant.funder);
    if (funder) {
      if (isPositive) signals.likedFunders.add(funder);
      else signals.dislikedFunders.add(funder);
    }

    for (const theme of grant.thematic_areas || []) {
      const t = norm(theme);
      if (!t) continue;
      if (isPositive) signals.likedThemes.add(t);
      else signals.dislikedThemes.add(t);
    }

    if (isPositive) {
      const gt = norm(grant.grant_type);
      if (gt) signals.likedGrantTypes.add(gt);
    }
  }

  return signals;
}

/**
 * Compute the feedback multiplier for one candidate grant. Returns 1.0 when
 * no signals apply — the score passes through unchanged.
 */
export function computeFeedbackAdjustment(
  signals: FeedbackSignals,
  grant: FeedbackInput
): FeedbackAdjustment {
  let positiveBoost = 0;
  let negativePenalty = 0;

  const funder = norm(grant.funder);
  if (funder) {
    if (signals.likedFunders.has(funder)) positiveBoost += 0.08;
    if (signals.dislikedFunders.has(funder)) negativePenalty += 0.08;
  }

  // Themes: take the strongest hit per side (multiple matching themes
  // shouldn't compound linearly, that would over-amplify a single
  // dimension and drown out budget/eligibility signals).
  let themePositive = 0;
  let themeNegative = 0;
  for (const theme of grant.thematicAreas || []) {
    const t = norm(theme);
    if (!t) continue;
    if (signals.likedThemes.has(t)) themePositive = 0.05;
    if (signals.dislikedThemes.has(t)) themeNegative = 0.05;
  }
  positiveBoost += themePositive;
  negativePenalty += themeNegative;

  const gt = norm(grant.grantType);
  if (gt && signals.likedGrantTypes.has(gt)) {
    positiveBoost += 0.02;
  }

  // Cap each side so a single very-active org can't blow up the ranking.
  // +15% / -10% mirrors the spec.
  positiveBoost = Math.min(positiveBoost, 0.15);
  negativePenalty = Math.min(negativePenalty, 0.10);

  // Popularity: 1 - exp(-pop/5) flattens to ~1 around pop≈15, so a grant
  // with 5 interactions gets ~63% of the max boost (~3%), 10 gets ~86%
  // (~4.3%), 20+ approaches the +5% cap.
  const pop = Math.max(0, grant.popularityScore ?? 0);
  const popularityBoost = pop > 0 ? 0.05 * (1 - Math.exp(-pop / 5)) : 0;

  const multiplier = 1 + positiveBoost - negativePenalty + popularityBoost;

  return { multiplier, positiveBoost, negativePenalty, popularityBoost };
}
