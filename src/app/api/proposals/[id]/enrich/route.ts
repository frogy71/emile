import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { enrichProposal } from "@/lib/ai/proposal";

type ProposalSection = { title: string; content: string };

type ProposalContent = {
  sections?: ProposalSection[];
  language?: string;
  generatedAt?: string;
  enrichedAt?: string;
};

/**
 * POST /api/proposals/[id]/enrich — fold user-provided storytelling/context
 * answers into an existing draft.
 *
 * Body: { answers: [{ question, answer }, ...] }
 *
 * This is a second pass AFTER the first draft is generated — users answer a
 * short set of questions (anecdotes, chiffres, urgence, différenciateurs) and
 * Claude rewrites the sections to integrate them at the right spots.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Auth + ownership check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: proposal, error: fetchError } = await supabaseAdmin
      .from("proposals")
      .select(
        "*, grants(*), projects(*), organizations!inner(user_id, name, mission, thematic_areas, beneficiaries, geographic_focus, prior_grants)"
      )
      .eq("id", id)
      .single();

    if (fetchError || !proposal) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const org = proposal.organizations as {
      user_id: string;
      name: string;
      mission?: string;
      thematic_areas?: string[];
      beneficiaries?: string[];
      geographic_focus?: string[];
      prior_grants?: string;
    };

    if (org?.user_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Validate body
    const body = (await request.json()) as {
      answers?: { question: string; answer: string }[];
    };
    const answers = Array.isArray(body.answers) ? body.answers : [];
    if (
      !answers.every(
        (a) => typeof a?.question === "string" && typeof a?.answer === "string"
      )
    ) {
      return NextResponse.json(
        { error: "Invalid answers payload" },
        { status: 400 }
      );
    }

    const filled = answers.filter((a) => a.answer.trim().length > 0);
    if (filled.length === 0) {
      return NextResponse.json(
        { error: "no_answers", message: "Réponds à au moins une question." },
        { status: 400 }
      );
    }

    const content = (proposal.content || {}) as ProposalContent;
    const sections = content.sections || [];
    if (sections.length === 0) {
      return NextResponse.json(
        {
          error: "empty_proposal",
          message: "Ce brouillon n'a pas encore de contenu à enrichir.",
        },
        { status: 400 }
      );
    }

    const grant = proposal.grants as Record<string, unknown> | null;
    const project = proposal.projects as Record<string, unknown> | null;

    if (!grant) {
      return NextResponse.json(
        { error: "grant_missing", message: "Subvention introuvable." },
        { status: 404 }
      );
    }

    // Call Claude — has an internal fallback so this should not throw,
    // but we still wrap it defensively.
    let enriched;
    try {
      enriched = await enrichProposal({
        sections,
        answers: filled,
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
              name: String(project.name || ""),
              summary: project.summary as string | undefined,
              objectives: project.objectives as string[] | undefined,
              targetBeneficiaries: project.target_beneficiaries as
                | string[]
                | undefined,
              targetGeography: project.target_geography as string[] | undefined,
              requestedAmountEur: project.requested_amount_eur as
                | number
                | undefined,
              durationMonths: project.duration_months as number | undefined,
              indicators: project.indicators as string[] | undefined,
              logframe: (project.logframe_data as Record<
                string,
                unknown
              >) as never,
            }
          : undefined,
        grant: {
          title: String(grant.title || ""),
          summary: grant.summary as string | undefined,
          funder: grant.funder as string | undefined,
          country: grant.country as string | undefined,
          language: grant.language as string | undefined,
          thematicAreas: grant.thematic_areas as string[] | undefined,
          eligibleEntities: grant.eligible_entities as string[] | undefined,
          maxAmountEur: grant.max_amount_eur as number | undefined,
          coFinancingRequired: grant.co_financing_required as
            | boolean
            | undefined,
        },
      });
    } catch (e) {
      console.error("Enrichment failed:", e);
      return NextResponse.json(
        {
          error: "enrichment_failed",
          message:
            "L'enrichissement IA a échoué. Réessaie dans un instant.",
          detail: e instanceof Error ? e.message : String(e),
        },
        { status: 500 }
      );
    }

    // Persist — we overwrite sections but also append the Q&A to the content
    // so the user can review what they provided later.
    const existingAnswers = (
      (content as { answers?: { question: string; answer: string }[] }).answers ||
      []
    );
    const nextContent: ProposalContent & {
      answers?: { question: string; answer: string }[];
    } = {
      ...content,
      sections: enriched.sections,
      enrichedAt: enriched.enrichedAt,
      answers: [...existingAnswers, ...filled],
    };

    const { error: updateError } = await supabaseAdmin
      .from("proposals")
      .update({
        content: nextContent,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json(
        {
          error: "save_failed",
          message:
            "L'enrichissement a été généré mais n'a pas pu être sauvegardé.",
          detail: updateError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      sections: enriched.sections,
      enrichedAt: enriched.enrichedAt,
    });
  } catch (e) {
    console.error("Unexpected enrich POST error:", e);
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
