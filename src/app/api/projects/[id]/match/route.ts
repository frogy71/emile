import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  computeHeuristicScore,
  refineTopMatchesWithAI,
  type GrantProfile,
  type MatchScoreResult,
  type ScoredCandidate,
} from "@/lib/ai/scoring";
import {
  generateProjectEmbedding,
  isEmbeddingsAvailable,
  toPgVector,
} from "@/lib/ai/embeddings";
import {
  buildFeedbackSignals,
  computeFeedbackAdjustment,
  type FeedbackSignals,
} from "@/lib/ai/feedback";
import { getPlan, incrementMatchRun } from "@/lib/plan";

/**
 * POST /api/projects/[id]/match
 *
 * 3-stage funnel matching pipeline. Designed to scale to 10k+ grants and
 * 100+ concurrent users without blowing up AI token costs.
 *
 *   Stage 1 — SQL pre-filter (RPC: prefilter_grants_for_project)
 *     Eliminates 80–90% of grants using indexed gates on geography,
 *     entity eligibility, theme overlap, status, deadline and (loose)
 *     budget. Zero tokens. Target: 10k → 200–400.
 *
 *   Stage 2 — Semantic ranking (pgvector cosine similarity)
 *     Embeds the project (cached on the row) and asks Postgres to rank
 *     the prefiltered grants by cosine similarity. Heuristic still
 *     computed as a fallback — used for grants without an embedding and
 *     blended into the top-N pick for budget/deadline/entity signals
 *     embeddings can't capture. Zero LLM tokens (one cheap embedding
 *     call only when the project's embedding is stale/missing).
 *
 *   Stage 3 — AI refinement (single batched Claude Haiku call)
 *     Sends all top-N candidates in one prompt. Returns refined scores +
 *     explanations. ~1 API call per project match.
 *
 * Backwards compat: every grant from Stage 1 is upserted to match_scores
 * with at least its heuristic score, and the response shape preserves the
 * existing { total, highMatches, goodMatches, toPursue, gated } fields the
 * MatchButton consumes.
 *
 * Falls back gracefully:
 *   - If the prefilter RPC isn't deployed yet, we fall back to a full
 *     active-grants scan and let the heuristic do all the gating.
 *   - If embeddings are unavailable (no provider key, or the project has
 *     no embedding and we can't compute one), we skip Stage 2's semantic
 *     ranking and use the heuristic top-N instead.
 *   - If ANTHROPIC_API_KEY is missing or Claude errors out, we keep the
 *     heuristic+semantic results and skip the refinement stage.
 *
 * Ownership: the project must belong to the authenticated user's org.
 */

const STAGE_2_TOP_N = 30; // grants forwarded to Claude
const STAGE_2_SEMANTIC_POOL = 50; // top-K from cosine before final pick

interface PrefilterRow {
  id: string;
  title: string;
  summary: string | null;
  funder: string | null;
  country: string | null;
  thematic_areas: string[] | null;
  eligible_entities: string[] | null;
  eligible_countries: string[] | null;
  min_amount_eur: number | null;
  max_amount_eur: number | null;
  co_financing_required: boolean | null;
  deadline: string | null;
  grant_type: string | null;
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const t0 = Date.now();
  const { id: projectId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: project, error: projectError } = await supabaseAdmin
    .from("projects")
    .select(
      // Grab the embedding metadata too so we can decide whether to
      // refresh it inline. The embedding column itself isn't deserialised
      // (it'd be 1536 floats); we only check if it's NULL via a flag.
      "*, embedding_updated_at, organizations!inner(id, user_id, name, legal_status, mission, thematic_areas, beneficiaries, geographic_focus, annual_budget_eur, team_size, languages, prior_grants)"
    )
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const org = project.organizations as unknown as {
    id: string;
    user_id: string;
    name: string;
    legal_status?: string;
    mission?: string;
    thematic_areas?: string[];
    beneficiaries?: string[];
    geographic_focus?: string[];
    annual_budget_eur?: number;
    team_size?: number;
    languages?: string[];
    prior_grants?: string;
  };

  if (!org || org.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ─── Paywall: free tier capped at 3 matchings / month ──────
  const plan = await getPlan(org.id);
  if (!plan.canMatch) {
    return NextResponse.json(
      {
        error: "match_limit_reached",
        message: `Tu as utilisé tes ${plan.limits.matchesPerMonth} matchings gratuits ce mois-ci. Passe en Pro pour des matchings illimités.`,
        plan: {
          tier: plan.tier,
          matchesUsed: plan.matchesUsed,
          matchesLimit: plan.limits.matchesPerMonth,
        },
      },
      { status: 402 }
    );
  }

  // ─── Stage 1: SQL pre-filter ────────────────────────────────
  const t1Start = Date.now();
  const stage1 = await runPrefilter(projectId);
  const t1Ms = Date.now() - t1Start;

  if (!stage1.ok) {
    return NextResponse.json(
      { error: stage1.error },
      { status: 500 }
    );
  }
  const candidates = stage1.rows;
  const stage1Count = candidates.length;

  // ─── Stage 2: Heuristic scoring + semantic ranking ──────────
  const t2Start = Date.now();

  const orgProfile = {
    name: org.name,
    legalStatus: org.legal_status,
    mission: org.mission,
    thematicAreas: org.thematic_areas,
    beneficiaries: org.beneficiaries,
    geographicFocus: org.geographic_focus,
    annualBudgetEur: org.annual_budget_eur,
    teamSize: org.team_size,
    languages: org.languages,
    priorGrants: org.prior_grants,
  };

  const projectProfile = {
    name: project.name,
    summary: project.summary,
    objectives: project.objectives,
    targetBeneficiaries: project.target_beneficiaries,
    targetGeography: project.target_geography,
    requestedAmountEur: project.requested_amount_eur,
    durationMonths: project.duration_months,
    indicators: project.indicators,
  };

  const scored: ScoredCandidate[] = candidates.map((g) => {
    const grantProfile: GrantProfile = {
      title: g.title,
      summary: g.summary ?? undefined,
      funder: g.funder ?? undefined,
      country: g.country ?? undefined,
      thematicAreas: g.thematic_areas ?? undefined,
      eligibleEntities: g.eligible_entities ?? undefined,
      eligibleCountries: g.eligible_countries ?? undefined,
      minAmountEur: g.min_amount_eur ?? undefined,
      maxAmountEur: g.max_amount_eur ?? undefined,
      coFinancingRequired: g.co_financing_required ?? undefined,
      deadline: g.deadline ?? undefined,
      grantType: g.grant_type ?? undefined,
    };
    return {
      grantId: g.id,
      grant: grantProfile,
      heuristic: computeHeuristicScore(orgProfile, grantProfile, projectProfile),
    };
  });

  // ─ Semantic ranking ─
  //
  // Get/refresh the project's embedding, then ask Postgres to rank the
  // prefiltered grant ids by cosine similarity. Returns a Map<grantId, sim>
  // where sim ∈ [0,1]. Grants without an embedding aren't returned and
  // fall back to the pure heuristic ordering.
  const semantic = await rankBySemanticSimilarity({
    projectId,
    project,
    org,
    candidateIds: scored
      .filter((c) => !c.heuristic.gatedBy)
      .map((c) => c.grantId),
  });

  // Combine: blendedScore = 0.7 · semantic_in_0_100 + 0.3 · heuristic.
  // Why blend rather than replace? Embeddings capture topical similarity
  // beautifully but ignore hard signals — budget fit, deadline runway,
  // experience with the funder. A 30% heuristic anchor preserves those
  // without letting keyword fragility dominate the ranking.
  //
  // Grants the semantic stage didn't return (no embedding) keep their
  // heuristic score as the blended score so they're not penalised.
  const blendedRaw = scored
    .filter((c) => !c.heuristic.gatedBy && c.heuristic.score > 0)
    .map((c) => {
      const sim = semantic.scores.get(c.grantId);
      const semanticScore = sim != null ? Math.round(sim * 100) : null;
      const blendedScore =
        semanticScore != null
          ? 0.7 * semanticScore + 0.3 * c.heuristic.score
          : c.heuristic.score;
      return { c, blendedScore, semanticScore };
    });

  // ─ Feedback adjustment ─
  //
  // After the objective signals (heuristic + semantic) are blended, fold
  // in what we've learned from the user's past gestures and the global
  // popularity counter. The multiplier is bounded (~+15% / -10%) so it
  // can re-rank near-equals without overwhelming objective fit.
  const feedback = await loadFeedbackContext(
    org.id,
    blendedRaw.map((b) => b.c.grantId)
  );
  const blended = blendedRaw.map((b) => {
    const adj = computeFeedbackAdjustment(feedback.signals, {
      funder: b.c.grant.funder,
      thematicAreas: b.c.grant.thematicAreas,
      grantType: b.c.grant.grantType,
      popularityScore: feedback.popularity.get(b.c.grantId) ?? 0,
    });
    return {
      ...b,
      adjustedScore: Math.max(0, Math.min(100, b.blendedScore * adj.multiplier)),
      feedback: adj,
    };
  });
  blended.sort((a, b) => b.adjustedScore - a.adjustedScore);

  // Take top-K semantic pool (default 50), then keep only the top STAGE_2_TOP_N
  // for AI refinement. The intermediate pool exists so the model isn't fed
  // a list that's been pruned too aggressively by either signal alone.
  const semanticPool = blended.slice(0, STAGE_2_SEMANTIC_POOL);
  const topForAi = semanticPool.slice(0, STAGE_2_TOP_N).map((b) => b.c);

  // Per-grant multiplier lookup so we can also apply it to the final
  // persisted score (refined or heuristic-only).
  const feedbackMultipliers = new Map<string, number>();
  for (const b of blended) {
    feedbackMultipliers.set(b.c.grantId, b.feedback.multiplier);
  }

  const t2Ms = Date.now() - t2Start;

  // ─── Stage 3: AI refinement (single batched call) ─────────────
  const t3Start = Date.now();
  const refinement = await refineTopMatchesWithAI(
    orgProfile,
    projectProfile,
    topForAi,
    { userId: user.id, orgId: org.id }
  );
  const t3Ms = Date.now() - t3Start;

  // Apply refined scores back onto the scored list. Anything not refined
  // keeps its heuristic score — that includes everything below the top N
  // and any candidate the model failed to return.
  const finalScores: Map<string, MatchScoreResult> = new Map();
  for (const c of scored) {
    const refined = refinement.results.get(c.grantId);
    finalScores.set(c.grantId, refined ?? c.heuristic);
  }

  // ─── Persist match_scores ──────────────────────────────────
  //
  // Apply the feedback multiplier to the final stored score so it reflects
  // the user's preferences even for grants that didn't make it to Stage 3.
  // Hard-gated (score 0) results stay 0 — feedback shouldn't unblock a
  // grant the org isn't legally eligible for.
  const upsertRows = scored.map((c) => {
    const result = finalScores.get(c.grantId)!;
    const mult = feedbackMultipliers.get(c.grantId) ?? 1;
    const adjustedScore =
      result.score > 0
        ? Math.max(0, Math.min(100, Math.round(result.score * mult)))
        : 0;
    return {
      organization_id: org.id,
      project_id: projectId,
      grant_id: c.grantId,
      score: adjustedScore,
      explanation: {
        ...result,
        refinedByAi: refinement.results.has(c.grantId),
        feedbackMultiplier: mult,
        baseScore: result.score,
        popularityScore: feedback.popularity.get(c.grantId) ?? 0,
      },
      recommendation: result.recommendation,
    };
  });

  const chunkSize = 100;
  let inserted = 0;
  let errors = 0;
  for (let i = 0; i < upsertRows.length; i += chunkSize) {
    const chunk = upsertRows.slice(i, i + chunkSize);
    const { error: upsertError } = await supabaseAdmin
      .from("match_scores")
      .upsert(chunk, { onConflict: "organization_id,project_id,grant_id" });
    if (upsertError) {
      console.error(
        `[funnel-match] chunk ${i}-${i + chunkSize} error:`,
        upsertError.message
      );
      errors += chunk.length;
    } else {
      inserted += chunk.length;
    }
  }

  // ─── Summary stats ────────────────────────────────────────
  // Use the persisted (feedback-adjusted) scores so the dashboard counters
  // match the row scores users see on the project page.
  const persistedScores = upsertRows.map((r) => r.score);
  const highMatches = persistedScores.filter((s) => s >= 75).length;
  const goodMatches = persistedScores.filter((s) => s >= 50 && s < 75).length;
  const toPursue = upsertRows.filter((r) => r.recommendation === "pursue").length;
  const gated = persistedScores.filter((s) => s === 0).length;

  const totalMs = Date.now() - t0;

  // Per-stage telemetry: keep on a single line so it's grep-friendly in
  // production logs. Track candidate counts at each funnel step + cost.
  console.log(
    `[funnel-match] project=${projectId} ` +
      `stage1=${stage1Count} (prefilter=${stage1.usedRpc ? "rpc" : "fallback"} ${t1Ms}ms) ` +
      `stage2=${topForAi.length} (semantic=${semantic.mode}/${semantic.scores.size} ` +
      `heuristic ${t2Ms}ms) ` +
      `stage3=${refinement.results.size}/${topForAi.length} (` +
      `${refinement.skippedReason ? `skipped:${refinement.skippedReason}` : "ok"} ` +
      `${refinement.inputTokens}/${refinement.outputTokens} tokens ` +
      `$${refinement.costUsd.toFixed(4)} ${t3Ms}ms) ` +
      `total=${totalMs}ms upserted=${inserted}/${upsertRows.length}`
  );

  // Bump the monthly match-run counter so the freemium cap stays accurate.
  // Best-effort: if the table isn't there yet, we don't want to block matching.
  try {
    await incrementMatchRun(org.id);
  } catch (e) {
    console.warn("[match] match-run counter bump failed:", e);
  }

  return NextResponse.json({
    success: true,
    total: scored.length,
    inserted,
    errors,
    highMatches,
    goodMatches,
    toPursue,
    gated,
    funnel: {
      stage1Candidates: stage1Count,
      stage2TopN: topForAi.length,
      stage3Refined: refinement.results.size,
      prefilter: stage1.usedRpc ? "rpc" : "fallback",
      semantic: {
        mode: semantic.mode,
        ranked: semantic.scores.size,
        skippedReason: semantic.skippedReason ?? null,
      },
      aiSkippedReason: refinement.skippedReason ?? null,
      aiTokens: {
        input: refinement.inputTokens,
        output: refinement.outputTokens,
        costUsd: refinement.costUsd,
        model: refinement.model,
      },
      timings: { stage1Ms: t1Ms, stage2Ms: t2Ms, stage3Ms: t3Ms, totalMs },
    },
  });
}

// ─── Semantic ranking helper ─────────────────────────────────
//
// Resolves the project's embedding (computing + caching it on first call
// for a project that has none) and asks Postgres to rank the candidate
// grant ids by cosine similarity. Returns a sparse map: grants without
// an embedding aren't included.
//
// Failure modes are silent — the caller falls back to the pure heuristic
// when this returns an empty map. We log the reason for ops debugging.

interface SemanticRankInput {
  projectId: string;
  project: {
    name?: string;
    summary?: string;
    objectives?: string[];
    target_beneficiaries?: string[];
    target_geography?: string[];
    logframe_data?: Record<string, unknown> | null;
    embedding_updated_at?: string | null;
  };
  org: {
    name: string;
    mission?: string;
    thematic_areas?: string[];
    beneficiaries?: string[];
    geographic_focus?: string[];
  };
  candidateIds: string[];
}

interface SemanticRankResult {
  scores: Map<string, number>;
  mode: "rpc" | "client" | "skip";
  skippedReason?: string;
}

async function rankBySemanticSimilarity(
  input: SemanticRankInput
): Promise<SemanticRankResult> {
  if (!isEmbeddingsAvailable()) {
    return { scores: new Map(), mode: "skip", skippedReason: "no_provider" };
  }
  if (input.candidateIds.length === 0) {
    return { scores: new Map(), mode: "skip", skippedReason: "no_candidates" };
  }

  // Compute (and cache) the project's embedding. We always recompute when
  // missing. The PATCH route refreshes on edits, so this is just the
  // first-match-after-creation fallback.
  const logframe = (input.project.logframe_data || {}) as Record<string, unknown>;
  const projectInput = {
    name: input.project.name,
    summary: input.project.summary,
    objectives: input.project.objectives,
    target_beneficiaries: input.project.target_beneficiaries,
    target_geography: input.project.target_geography,
    themes: logframe.themes as string[] | undefined,
    problem: logframe.problem as string | undefined,
    general_objective: logframe.general_objective as string | undefined,
    beneficiaries_direct: logframe.beneficiaries_direct as string | undefined,
    beneficiaries_indirect: logframe.beneficiaries_indirect as string | undefined,
    methodology: logframe.methodology as string | undefined,
    activities: logframe.activities as Array<{
      title?: string;
      description?: string;
    }> | undefined,
  };

  let queryVec: number[] | null;
  try {
    queryVec = await generateProjectEmbedding(projectInput, input.org);
  } catch (e) {
    console.warn("[funnel-match] project embed failed:", e);
    return { scores: new Map(), mode: "skip", skippedReason: "embed_error" };
  }
  if (!queryVec) {
    return { scores: new Map(), mode: "skip", skippedReason: "embed_empty" };
  }

  // Cache the freshly-computed embedding on the project row so the next
  // run skips this step. Best-effort.
  if (!input.project.embedding_updated_at) {
    void supabaseAdmin
      .from("projects")
      .update({
        embedding: toPgVector(queryVec),
        embedding_updated_at: new Date().toISOString(),
      })
      .eq("id", input.projectId)
      .then(({ error }) => {
        if (error) console.warn("[funnel-match] cache embed failed:", error.message);
      });
  }

  // Ask Postgres to rank — pgvector handles the dot product over the HNSW
  // index, which is way faster than shipping every grant's 1536-float
  // vector to Node.js.
  const { data, error } = await supabaseAdmin.rpc("rank_grants_by_embedding", {
    p_query_embedding: toPgVector(queryVec),
    p_grant_ids: input.candidateIds,
    p_match_count: input.candidateIds.length, // rank everything we sent
  });

  if (error) {
    console.warn("[funnel-match] rank_grants_by_embedding error:", error.message);
    return { scores: new Map(), mode: "skip", skippedReason: "rpc_error" };
  }

  const out = new Map<string, number>();
  for (const row of (data ?? []) as Array<{
    grant_id: string;
    similarity: number;
  }>) {
    out.set(row.grant_id, Number(row.similarity));
  }
  return { scores: out, mode: "rpc" };
}

/**
 * Stage 1 runner. Tries the Postgres RPC first; if it doesn't exist yet
 * (e.g. migration not deployed), falls back to a plain SELECT so users
 * keep getting matches while we ship the migration.
 */
async function runPrefilter(
  projectId: string
): Promise<
  | { ok: true; rows: PrefilterRow[]; usedRpc: boolean }
  | { ok: false; error: string }
> {
  // Try the RPC.
  const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc(
    "prefilter_grants_for_project",
    { p_project_id: projectId }
  );

  if (!rpcError && Array.isArray(rpcData)) {
    return { ok: true, rows: rpcData as PrefilterRow[], usedRpc: true };
  }

  // RPC not deployed → fall back to a permissive SELECT. Logs a warning so
  // we notice in production if the migration didn't ship.
  if (rpcError) {
    console.warn(
      "[funnel-match] prefilter RPC unavailable, falling back:",
      rpcError.message
    );
  }

  const { data, error } = await supabaseAdmin
    .from("grants")
    .select(
      "id, title, summary, funder, country, thematic_areas, eligible_entities, eligible_countries, min_amount_eur, max_amount_eur, co_financing_required, deadline, grant_type"
    )
    .eq("status", "active")
    .limit(5000);

  if (error || !data) {
    return { ok: false, error: error?.message || "Failed to load grants" };
  }
  return { ok: true, rows: data as PrefilterRow[], usedRpc: false };
}

// ─── Feedback context loader ─────────────────────────────────────
//
// Pulls the org's full interaction history (joined to the grants we care
// about for funder/theme/grant_type) and the popularity counter for each
// candidate in a single pair of queries. Returns empty signals on error so
// matching never fails because feedback couldn't be loaded.

interface FeedbackContext {
  signals: FeedbackSignals;
  popularity: Map<string, number>;
}

async function loadFeedbackContext(
  orgId: string,
  candidateIds: string[]
): Promise<FeedbackContext> {
  const empty: FeedbackContext = {
    signals: buildFeedbackSignals([]),
    popularity: new Map(),
  };

  if (candidateIds.length === 0) return empty;

  const [interactionsRes, popularityRes] = await Promise.all([
    supabaseAdmin
      .from("user_grant_interactions")
      .select(
        "interaction_type, grants(funder, thematic_areas, grant_type)"
      )
      .eq("organization_id", orgId)
      .limit(1000),
    supabaseAdmin
      .from("grants")
      .select("id, popularity_score")
      .in("id", candidateIds),
  ]);

  if (interactionsRes.error) {
    console.warn(
      "[funnel-match] feedback interactions load failed:",
      interactionsRes.error.message
    );
  }
  if (popularityRes.error) {
    console.warn(
      "[funnel-match] feedback popularity load failed:",
      popularityRes.error.message
    );
  }

  // Supabase types the joined `grants` field as an array even though the FK
  // makes it a single row. Normalise to `{ grants: { … } | null }`.
  type RawRow = {
    interaction_type: string;
    grants:
      | {
          funder?: string | null;
          thematic_areas?: string[] | null;
          grant_type?: string | null;
        }
      | Array<{
          funder?: string | null;
          thematic_areas?: string[] | null;
          grant_type?: string | null;
        }>
      | null;
  };
  const normalisedRows = (interactionsRes.data ?? []).map((r) => {
    const raw = r as RawRow;
    const grants = Array.isArray(raw.grants) ? raw.grants[0] ?? null : raw.grants;
    return { interaction_type: raw.interaction_type, grants };
  });

  const signals = buildFeedbackSignals(normalisedRows);

  const popularity = new Map<string, number>();
  for (const row of (popularityRes.data ?? []) as Array<{
    id: string;
    popularity_score: number | null;
  }>) {
    popularity.set(row.id, row.popularity_score ?? 0);
  }

  return { signals, popularity };
}
