import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { computeHeuristicScore } from "@/lib/ai/scoring";

/**
 * POST /api/projects/[id]/match
 *
 * Bulk match a project against the entire grants catalog using the fast
 * heuristic scorer. Results are upserted into match_scores.
 *
 * Strategy:
 *  - Heuristic only (no Claude API) so we can score 3000+ grants in seconds
 *  - User can trigger "deep AI analysis" on a specific grant later
 *    (POST /api/matching with organizationId + grantId + projectId)
 *
 * Ownership: the project must belong to the authenticated user's organization.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Ownership check
  const { data: project, error: projectError } = await supabaseAdmin
    .from("projects")
    .select("*, organizations!inner(id, user_id, name, legal_status, mission, thematic_areas, beneficiaries, geographic_focus, annual_budget_eur, team_size, languages, prior_grants)")
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

  // Fetch all active grants (up to 5000)
  const { data: grants, error: grantsError } = await supabaseAdmin
    .from("grants")
    .select(
      "id, title, summary, funder, country, thematic_areas, eligible_entities, eligible_countries, min_amount_eur, max_amount_eur, co_financing_required, deadline, grant_type"
    )
    .eq("status", "active")
    .limit(5000);

  if (grantsError || !grants) {
    return NextResponse.json(
      { error: grantsError?.message || "Failed to load grants" },
      { status: 500 }
    );
  }

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

  // Score each grant
  const scoredRows = grants.map((g) => {
    const grantProfile = {
      title: g.title,
      summary: g.summary,
      funder: g.funder,
      country: g.country,
      thematicAreas: g.thematic_areas,
      eligibleEntities: g.eligible_entities,
      eligibleCountries: g.eligible_countries,
      minAmountEur: g.min_amount_eur,
      maxAmountEur: g.max_amount_eur,
      coFinancingRequired: g.co_financing_required,
      deadline: g.deadline,
      grantType: g.grant_type,
    };
    const result = computeHeuristicScore(orgProfile, grantProfile, projectProfile);
    return {
      organization_id: org.id,
      project_id: projectId,
      grant_id: g.id,
      score: result.score,
      explanation: result,
      recommendation: result.recommendation,
    };
  });

  // Upsert in chunks of 100
  const chunkSize = 100;
  let inserted = 0;
  let errors = 0;
  for (let i = 0; i < scoredRows.length; i += chunkSize) {
    const chunk = scoredRows.slice(i, i + chunkSize);
    const { error: upsertError } = await supabaseAdmin
      .from("match_scores")
      .upsert(chunk, { onConflict: "organization_id,project_id,grant_id" });
    if (upsertError) {
      console.error(
        `[bulk-match] Chunk ${i}-${i + chunkSize} error:`,
        upsertError.message
      );
      errors += chunk.length;
    } else {
      inserted += chunk.length;
    }
  }

  // Summary stats
  const highMatches = scoredRows.filter((r) => r.score >= 75).length;
  const goodMatches = scoredRows.filter((r) => r.score >= 50 && r.score < 75).length;
  const toPursue = scoredRows.filter((r) => r.recommendation === "pursue").length;
  const gated = scoredRows.filter((r) => r.score === 0).length;

  return NextResponse.json({
    success: true,
    total: scoredRows.length,
    inserted,
    errors,
    highMatches,
    goodMatches,
    toPursue,
    gated,
  });
}
