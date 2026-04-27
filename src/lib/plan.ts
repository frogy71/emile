/**
 * Plan tier resolution + usage caps for the freemium model.
 *
 *   free   — 3 matchings / month, top 5 results, 0 proposals, no feedback learning
 *   pro    — unlimited matchings, top 50, 5 proposals / month, all features
 *   expert — everything unlimited
 *
 * The tier is derived from `organizations.plan` + `plan_status`. An org is
 * only "paying" when `plan_status = 'active'`; cancelled / inactive orgs
 * fall back to free.
 */

import { createClient } from "@supabase/supabase-js";

export type PlanTier = "free" | "pro" | "expert";

export interface PlanLimits {
  matchesPerMonth: number | null; // null = unlimited
  proposalsPerMonth: number | null;
  topResults: number; // matches surfaced in UI
  feedbackLearning: boolean;
  prioritySupport: boolean;
  analytics: boolean;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    matchesPerMonth: 3,
    proposalsPerMonth: 0,
    topResults: 5,
    feedbackLearning: false,
    prioritySupport: false,
    analytics: false,
  },
  pro: {
    matchesPerMonth: null,
    proposalsPerMonth: 5,
    topResults: 50,
    feedbackLearning: true,
    prioritySupport: false,
    analytics: false,
  },
  expert: {
    matchesPerMonth: null,
    proposalsPerMonth: null,
    topResults: 1000,
    feedbackLearning: true,
    prioritySupport: true,
    analytics: true,
  },
};

export interface PlanState {
  tier: PlanTier;
  limits: PlanLimits;
  matchesUsed: number;
  matchesRemaining: number | null;
  proposalsUsed: number;
  proposalsRemaining: number | null;
  canMatch: boolean;
  canGenerateProposal: boolean;
  canUseFeedback: boolean;
}

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function currentYearMonth(now = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function startOfMonthIso(now = new Date()): string {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  ).toISOString();
}

export function resolveTier(
  rawPlan: string | null | undefined,
  rawStatus: string | null | undefined
): PlanTier {
  const status = (rawStatus || "free").toLowerCase();
  if (status !== "active") return "free";
  const plan = (rawPlan || "").toLowerCase();
  if (plan === "expert") return "expert";
  if (plan === "pro") return "pro";
  return "free";
}

/**
 * Resolve the plan state for an organization. Counts matches and proposals
 * already used this calendar month (UTC).
 */
export async function getPlan(organizationId: string): Promise<PlanState> {
  const supabase = admin();
  const ym = currentYearMonth();
  const monthStart = startOfMonthIso();

  const [{ data: org }, { data: matchRow }, { count: proposalsThisMonth }] =
    await Promise.all([
      supabase
        .from("organizations")
        .select("plan, plan_status")
        .eq("id", organizationId)
        .single(),
      supabase
        .from("match_runs")
        .select("count")
        .eq("organization_id", organizationId)
        .eq("year_month", ym)
        .maybeSingle(),
      supabase
        .from("proposals")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .gte("created_at", monthStart),
    ]);

  const tier = resolveTier(org?.plan, org?.plan_status);
  const limits = PLAN_LIMITS[tier];
  const matchesUsed = matchRow?.count ?? 0;
  const proposalsUsed = proposalsThisMonth ?? 0;

  const matchesRemaining =
    limits.matchesPerMonth === null
      ? null
      : Math.max(0, limits.matchesPerMonth - matchesUsed);
  const proposalsRemaining =
    limits.proposalsPerMonth === null
      ? null
      : Math.max(0, limits.proposalsPerMonth - proposalsUsed);

  return {
    tier,
    limits,
    matchesUsed,
    matchesRemaining,
    proposalsUsed,
    proposalsRemaining,
    canMatch: matchesRemaining === null || matchesRemaining > 0,
    canGenerateProposal:
      proposalsRemaining === null || proposalsRemaining > 0,
    canUseFeedback: limits.feedbackLearning,
  };
}

/**
 * Increment the monthly match-run counter for an org. Idempotency is the
 * caller's responsibility — call this only after a successful match run.
 */
export async function incrementMatchRun(organizationId: string): Promise<void> {
  const supabase = admin();
  const ym = currentYearMonth();

  const { data: existing } = await supabase
    .from("match_runs")
    .select("id, count")
    .eq("organization_id", organizationId)
    .eq("year_month", ym)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("match_runs")
      .update({
        count: (existing.count ?? 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("match_runs").insert({
      organization_id: organizationId,
      year_month: ym,
      count: 1,
    });
  }
}

/**
 * Resolve the organization id for the authenticated user. Returns null if the
 * user has no organization yet (eg. during onboarding).
 */
export async function getOrganizationIdForUser(
  userId: string
): Promise<string | null> {
  const supabase = admin();
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  return org?.id ?? null;
}
