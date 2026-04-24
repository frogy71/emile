import { NextResponse } from "next/server";
import { computeMatchScore } from "@/lib/ai/scoring";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// POST /api/matching — compute match score for org + grant
export async function POST(request: Request) {
  const supabase = getSupabase();
  const body = await request.json();
  const { organizationId, grantId, projectId } = body;

  if (!organizationId || !grantId) {
    return NextResponse.json(
      { error: "organizationId and grantId are required" },
      { status: 400 }
    );
  }

  // Fetch org
  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", organizationId)
    .single();

  if (!org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  // Fetch grant
  const { data: grant } = await supabase
    .from("grants")
    .select("*")
    .eq("id", grantId)
    .single();

  if (!grant) {
    return NextResponse.json({ error: "Grant not found" }, { status: 404 });
  }

  // Fetch project if provided
  let project = null;
  if (projectId) {
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();
    project = data;
  }

  // Compute score
  const scoreResult = await computeMatchScore(
    {
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
    },
    {
      title: grant.title,
      summary: grant.summary,
      funder: grant.funder,
      country: grant.country,
      thematicAreas: grant.thematic_areas,
      eligibleEntities: grant.eligible_entities,
      eligibleCountries: grant.eligible_countries,
      maxAmountEur: grant.max_amount_eur,
      coFinancingRequired: grant.co_financing_required,
      deadline: grant.deadline,
      grantType: grant.grant_type,
    },
    project
      ? {
          name: project.name,
          summary: project.summary,
          objectives: project.objectives,
          targetBeneficiaries: project.target_beneficiaries,
          targetGeography: project.target_geography,
          requestedAmountEur: project.requested_amount_eur,
          durationMonths: project.duration_months,
          indicators: project.indicators,
        }
      : undefined
  );

  // Save to DB
  const { error: upsertError } = await supabase.from("match_scores").upsert(
    {
      organization_id: organizationId,
      project_id: projectId || null,
      grant_id: grantId,
      score: scoreResult.score,
      explanation: scoreResult,
      recommendation: scoreResult.recommendation,
    },
    { onConflict: "organization_id,project_id,grant_id" }
  );

  if (upsertError) {
    console.error("Error saving score:", upsertError);
  }

  return NextResponse.json(scoreResult);
}
