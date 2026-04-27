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

/**
 * POST /api/projects/[id]/match
 *
 * 3-stage funnel matching pipeline. Designed to scale to 3 000+ grants and
 * 100+ concurrent users without blowing up AI token costs.
 *
 *   Stage 1 — SQL pre-filter (RPC: prefilter_grants_for_project)
 *     Eliminates 80–90% of grants using indexed gates on geography,
 *     entity eligibility, theme overlap, status, deadline and (loose)
 *     budget. Zero tokens. Target: 3 000 → 200–400.
 *
 *   Stage 2 — Heuristic scoring (in-process)
 *     Runs computeHeuristicScore on the Stage 1 candidates only. Zero
 *     tokens. Sort by score, take the top N (default 30).
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
 *   - If ANTHROPIC_API_KEY is missing or Claude errors out, we keep the
 *     heuristic results and skip the refinement stage.
 *
 * Ownership: the project must belong to the authenticated user's org.
 */

const STAGE_2_TOP_N = 30; // grants forwarded to Claude

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
      "*, organizations!inner(id, user_id, name, legal_status, mission, thematic_areas, beneficiaries, geographic_focus, annual_budget_eur, team_size, languages, prior_grants)"
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

  // ─── Stage 2: Heuristic scoring ─────────────────────────────
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

  // Sort by heuristic score (high → low) and pick the top N for AI refinement.
  // We exclude grants that the heuristic gated to 0 — the heuristic answer is
  // already correct for those (deadline/entity/geo mismatch), so spending AI
  // tokens on them is pure waste.
  scored.sort((a, b) => b.heuristic.score - a.heuristic.score);
  const topForAi = scored
    .filter((c) => !c.heuristic.gatedBy && c.heuristic.score > 0)
    .slice(0, STAGE_2_TOP_N);

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
  const upsertRows = scored.map((c) => {
    const result = finalScores.get(c.grantId)!;
    return {
      organization_id: org.id,
      project_id: projectId,
      grant_id: c.grantId,
      score: result.score,
      explanation: {
        ...result,
        refinedByAi: refinement.results.has(c.grantId),
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
  const finalArr = Array.from(finalScores.values());
  const highMatches = finalArr.filter((r) => r.score >= 75).length;
  const goodMatches = finalArr.filter((r) => r.score >= 50 && r.score < 75).length;
  const toPursue = finalArr.filter((r) => r.recommendation === "pursue").length;
  const gated = finalArr.filter((r) => r.score === 0).length;

  const totalMs = Date.now() - t0;

  // Per-stage telemetry: keep on a single line so it's grep-friendly in
  // production logs. Track candidate counts at each funnel step + cost.
  console.log(
    `[funnel-match] project=${projectId} ` +
      `stage1=${stage1Count} (prefilter=${stage1.usedRpc ? "rpc" : "fallback"} ${t1Ms}ms) ` +
      `stage2=${topForAi.length} (heuristic ${t2Ms}ms) ` +
      `stage3=${refinement.results.size}/${topForAi.length} (` +
      `${refinement.skippedReason ? `skipped:${refinement.skippedReason}` : "ok"} ` +
      `${refinement.inputTokens}/${refinement.outputTokens} tokens ` +
      `$${refinement.costUsd.toFixed(4)} ${t3Ms}ms) ` +
      `total=${totalMs}ms upserted=${inserted}/${upsertRows.length}`
  );

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
