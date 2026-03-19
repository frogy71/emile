import { createClient } from "@supabase/supabase-js";

// Claude API pricing (per 1M tokens, in USD)
const PRICING = {
  "claude-haiku-4-5-20250315": { input: 0.80, output: 4.00 },
  "claude-sonnet-4-20250514": { input: 3.00, output: 15.00 },
} as const;

type ModelId = keyof typeof PRICING;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Log an AI API call for cost tracking
 */
export async function logAiUsage(params: {
  userId?: string;
  orgId?: string;
  action: "scoring" | "proposal";
  model: string;
  inputTokens: number;
  outputTokens: number;
  metadata?: Record<string, string>;
}) {
  const modelPricing = PRICING[params.model as ModelId];
  const costUsd = modelPricing
    ? (params.inputTokens * modelPricing.input +
        params.outputTokens * modelPricing.output) /
      1_000_000
    : 0;

  try {
    const supabase = getSupabase();
    await supabase.from("ai_usage_logs").insert({
      user_id: params.userId || null,
      org_id: params.orgId || null,
      action: params.action,
      model: params.model,
      input_tokens: params.inputTokens,
      output_tokens: params.outputTokens,
      cost_usd: costUsd,
      metadata: params.metadata || {},
    });
  } catch {
    // Don't fail the main request if logging fails
    console.error("Failed to log AI usage");
  }

  return costUsd;
}

/**
 * Get AI cost summary for admin dashboard
 */
export async function getAiCostSummary() {
  const supabase = getSupabase();

  // Total costs all time
  const { data: allTime } = await supabase.rpc("sum_ai_costs_all_time").single();

  // Costs this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: thisMonth } = await supabase
    .from("ai_usage_logs")
    .select("cost_usd, action")
    .gte("created_at", startOfMonth.toISOString());

  const monthlyTotal = (thisMonth || []).reduce(
    (sum, r) => sum + Number(r.cost_usd || 0),
    0
  );

  const scoringCalls = (thisMonth || []).filter(
    (r) => r.action === "scoring"
  ).length;
  const proposalCalls = (thisMonth || []).filter(
    (r) => r.action === "proposal"
  ).length;

  // Total all time (simple query)
  const { count: totalCalls } = await supabase
    .from("ai_usage_logs")
    .select("id", { count: "exact", head: true });

  const { data: allCosts } = await supabase
    .from("ai_usage_logs")
    .select("cost_usd");

  const totalCostUsd = (allCosts || []).reduce(
    (sum, r) => sum + Number(r.cost_usd || 0),
    0
  );

  return {
    totalCalls: totalCalls || 0,
    totalCostUsd,
    monthlyTotal,
    monthlyScoringCalls: scoringCalls,
    monthlyProposalCalls: proposalCalls,
  };
}
