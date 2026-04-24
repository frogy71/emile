/**
 * Billing + paywall helpers.
 *
 * Free tier: 1 proposal total (enough to experience the full flow).
 * Pro tier : unlimited everything.
 *
 * We gate on proposal generation specifically because that's the expensive
 * AI call (Sonnet, 2-5k tokens) — matching is cheap Haiku/heuristic and stays
 * free forever so users always see the value before being asked to pay.
 */

import { createClient } from "@supabase/supabase-js";

export const FREE_PROPOSAL_LIMIT = 1;

export type PlanStatus = "free" | "active" | "cancelled" | "inactive";

export interface PlanState {
  isPro: boolean;
  status: PlanStatus;
  proposalsUsed: number;
  proposalsLimit: number | null; // null = unlimited
  canGenerateProposal: boolean;
}

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Resolve the user's plan state given their organization id.
 * Safe to call frequently — two light queries, no external API calls.
 */
export async function getPlanState(organizationId: string): Promise<PlanState> {
  const supabase = admin();

  const [{ data: org }, { count: proposalsUsed }] = await Promise.all([
    supabase
      .from("organizations")
      .select("plan, plan_status")
      .eq("id", organizationId)
      .single(),
    supabase
      .from("proposals")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
  ]);

  const rawStatus = (org?.plan_status || "free") as string;
  const status: PlanStatus = ["active", "cancelled", "inactive", "free"].includes(
    rawStatus
  )
    ? (rawStatus as PlanStatus)
    : "free";

  const isPro = status === "active";
  const used = proposalsUsed ?? 0;
  const limit = isPro ? null : FREE_PROPOSAL_LIMIT;
  const canGenerate = isPro || used < FREE_PROPOSAL_LIMIT;

  return {
    isPro,
    status,
    proposalsUsed: used,
    proposalsLimit: limit,
    canGenerateProposal: canGenerate,
  };
}
