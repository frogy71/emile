import { NextResponse } from "next/server";
import { generateProposal } from "@/lib/ai/proposal";
import { createClient } from "@supabase/supabase-js";
import { getPlanState } from "@/lib/billing";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// POST /api/proposals — generate proposal draft
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

  // Paywall — free tier is capped at FREE_PROPOSAL_LIMIT proposals. Returning
  // 402 Payment Required is semantic + our UI can react distinctly to upsell.
  const plan = await getPlanState(organizationId);
  if (!plan.canGenerateProposal) {
    return NextResponse.json(
      {
        error: "proposal_limit_reached",
        message: `Tu as utilisé ${plan.proposalsUsed}/${plan.proposalsLimit} propositions du plan gratuit. Passe en Pro pour en générer sans limite.`,
        plan,
      },
      { status: 402 }
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

  // Fetch match score if exists
  let matchAnalysis = undefined;
  const { data: scoreData } = await supabase
    .from("match_scores")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("grant_id", grantId)
    .single();

  if (scoreData) {
    matchAnalysis = {
      score: scoreData.score,
      strengths: scoreData.explanation?.strengths || [],
      weaknesses: scoreData.explanation?.weaknesses || [],
    };
  }

  // Generate proposal
  const draft = await generateProposal({
    organization: {
      name: org.name,
      mission: org.mission,
      thematicAreas: org.thematic_areas,
      beneficiaries: org.beneficiaries,
      geographicFocus: org.geographic_focus,
      priorGrants: org.prior_grants,
    },
    project: project
      ? {
          name: project.name,
          summary: project.summary,
          objectives: project.objectives,
          targetBeneficiaries: project.target_beneficiaries,
          targetGeography: project.target_geography,
          requestedAmountEur: project.requested_amount_eur,
          durationMonths: project.duration_months,
          indicators: project.indicators,
          logframe: project.logframe_data || undefined,
        }
      : undefined,
    grant: {
      title: grant.title,
      summary: grant.summary,
      funder: grant.funder,
      country: grant.country,
      language: grant.language,
      thematicAreas: grant.thematic_areas,
      eligibleEntities: grant.eligible_entities,
      maxAmountEur: grant.max_amount_eur,
      coFinancingRequired: grant.co_financing_required,
    },
    matchAnalysis,
  });

  // Save to DB
  const { data: proposal, error } = await supabase
    .from("proposals")
    .insert({
      organization_id: organizationId,
      project_id: projectId || null,
      grant_id: grantId,
      content: draft,
      status: "draft",
    })
    .select()
    .single();

  if (error) {
    console.error("Error saving proposal:", error);
    return NextResponse.json({ draft, saved: false });
  }

  return NextResponse.json({ draft, saved: true, proposalId: proposal.id });
}
