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
  try {
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
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", organizationId)
      .single();

    if (orgError || !org) {
      console.error("Organization fetch failed:", orgError);
      return NextResponse.json(
        { error: "Organization not found", detail: orgError?.message },
        { status: 404 }
      );
    }

    // Fetch grant
    const { data: grant, error: grantError } = await supabase
      .from("grants")
      .select("*")
      .eq("id", grantId)
      .single();

    if (grantError || !grant) {
      console.error("Grant fetch failed:", grantError);
      return NextResponse.json(
        { error: "Grant not found", detail: grantError?.message },
        { status: 404 }
      );
    }

    // Fetch project if provided (don't hard-fail if missing — some flows
    // generate without a project attached).
    let project = null;
    if (projectId) {
      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .maybeSingle();
      project = data;
    }

    // Fetch match score. Multiple rows can exist (one per project) so we
    // filter by project when available and use maybeSingle() to tolerate
    // zero rows. .single() would bubble an error on multi-row results.
    let matchAnalysis = undefined;
    {
      let query = supabase
        .from("match_scores")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("grant_id", grantId);
      if (projectId) query = query.eq("project_id", projectId);
      const { data: scoreData } = await query
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (scoreData) {
        matchAnalysis = {
          score: scoreData.score,
          strengths: scoreData.explanation?.strengths || [],
          weaknesses: scoreData.explanation?.weaknesses || [],
        };
      }
    }

    // Generate proposal — has an internal try/catch and returns a fallback
    // template if the Claude call fails, so this should never throw.
    let draft;
    try {
      draft = await generateProposal({
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
    } catch (e) {
      console.error("Proposal generation failed:", e);
      return NextResponse.json(
        {
          error: "generation_failed",
          message:
            "La génération IA a échoué. Vérifie la configuration ANTHROPIC_API_KEY ou réessaie dans un instant.",
          detail: e instanceof Error ? e.message : String(e),
        },
        { status: 500 }
      );
    }

    // Save to DB
    const { data: proposal, error: insertError } = await supabase
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

    if (insertError || !proposal) {
      console.error("Error saving proposal:", insertError);
      return NextResponse.json(
        {
          error: "save_failed",
          message:
            "La proposition a été générée mais n'a pas pu être sauvegardée. Réessaie dans un instant.",
          detail: insertError?.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      draft,
      saved: true,
      proposalId: proposal.id,
    });
  } catch (e) {
    console.error("Unexpected proposals POST error:", e);
    return NextResponse.json(
      {
        error: "internal_error",
        message: "Erreur interne inattendue.",
        detail: e instanceof Error ? e.message : String(e),
      },
      { status: 500 }
    );
  }
}
