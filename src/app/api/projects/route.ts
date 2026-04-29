import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import {
  generateProjectEmbedding,
  isEmbeddingsAvailable,
  toPgVector,
} from "@/lib/ai/embeddings";
import { cleanupProjectText } from "@/lib/ai/project-cleanup";
import { enrollUser } from "@/lib/email/send-engine";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * POST /api/projects — create a new project from the logframe wizard
 */
export async function POST(request: Request) {
  // 1. Authenticate user via Supabase cookies
  const supabaseAuth = await createServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabaseAuth.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // 2. Parse body
  const body = await request.json();
  const {
    name,
    summary,
    themes,
    geography,
    budget,
    duration_months,
    general_objective,
    specific_objectives,
    beneficiaries_direct,
    beneficiaries_indirect,
    beneficiaries_count,
    activities,
    methodology,
    partners,
    expected_results,
    sustainability,
    problem,
    // The simple quick-start form opts in to a server-side cleanup pass that
    // fixes typos and normalizes vocabulary before the project is embedded
    // for matching. The advanced wizard skips it because power users have
    // already structured their text. Default off so the field is purely
    // additive.
    cleanup,
  } = body;

  if (!name) {
    return NextResponse.json(
      { error: "Le nom du projet est requis" },
      { status: 400 }
    );
  }

  // 2b. Optional AI cleanup pass — fix typos, normalize vocabulary, expand
  // beneficiary terms with synonyms so the embedding catches more grants.
  // The user's raw input is preserved separately under
  // logframe_data.raw_input so they can see what they typed if they go to
  // the edit page. Fail-soft: if Claude is down or rate-limited, fall back
  // to the raw text rather than blocking project creation.
  const rawInput = {
    name,
    summary,
    problem,
    themes,
    geography,
    beneficiaries_direct,
    beneficiaries_indirect,
    general_objective,
    specific_objectives,
    activities,
    methodology,
    partners,
  };
  const cleaned = cleanup
    ? await cleanupProjectText({
        name,
        summary,
        problem,
        themes,
        geography,
        beneficiaries_direct,
        beneficiaries_indirect,
        general_objective,
        specific_objectives,
        activities,
        methodology,
        partners,
      })
    : null;

  // Helpers to merge cleaned fields back over the raw values, falling back
  // to the user's input whenever cleanup returned null/empty.
  const pickStr = (clean: string | null | undefined, raw: string | null | undefined) =>
    clean && clean.trim() ? clean : raw || null;
  const pickArr = (clean: string[] | undefined, raw: string[] | undefined) =>
    clean && clean.length ? clean : Array.isArray(raw) ? raw : [];

  const finalName = pickStr(cleaned?.name, name) || name;
  const finalSummary = pickStr(cleaned?.summary, summary);
  const finalProblem = pickStr(cleaned?.problem, problem);
  const finalThemes = pickArr(cleaned?.themes, themes);
  const finalGeography = pickArr(cleaned?.geography, geography);
  const finalBeneficiariesDirect = pickStr(
    cleaned?.beneficiaries_direct,
    beneficiaries_direct
  );
  const finalBeneficiariesIndirect = pickStr(
    cleaned?.beneficiaries_indirect,
    beneficiaries_indirect
  );
  const finalGeneralObjective = pickStr(cleaned?.general_objective, general_objective);
  const finalSpecificObjectives = pickArr(
    cleaned?.specific_objectives,
    specific_objectives
  );
  const finalActivities = pickArr(cleaned?.activities, activities);
  const finalMethodology = pickStr(cleaned?.methodology, methodology);
  const finalPartners = pickStr(cleaned?.partners, partners);

  const supabase = getSupabaseAdmin();

  // 3. Find or create org for this user
  let orgId: string;
  const { data: existingOrgs } = await supabase
    .from("organizations")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  if (existingOrgs && existingOrgs.length > 0) {
    orgId = existingOrgs[0].id;
  } else {
    // Create a default organization for the user
    const { data: newOrg, error: orgError } = await supabase
      .from("organizations")
      .insert({
        user_id: user.id,
        name: user.email ? `Organisation de ${user.email}` : "Mon organisation",
        country: "FR",
      })
      .select("id")
      .single();

    if (orgError || !newOrg) {
      return NextResponse.json(
        { error: "Impossible de créer l'organisation" },
        { status: 500 }
      );
    }
    orgId = newOrg.id;

    // Enroll the freshly-onboarded user in the nurture sequence. Idempotent
    // via the (user_id, step_number) unique index. Fire-and-forget.
    enrollUser(user.id, orgId, new Date(user.created_at)).catch((err) =>
      console.error("[email-sequence] enrollUser failed:", err)
    );
  }

  // 4. Build logframe_data for fields not in the schema. The cleaned
  //    versions feed matching; raw_input keeps the user's original wording
  //    so the edit page can show what they actually typed.
  const logframeData = {
    general_objective: finalGeneralObjective,
    specific_objectives: finalSpecificObjectives,
    beneficiaries_direct: finalBeneficiariesDirect,
    beneficiaries_indirect: finalBeneficiariesIndirect,
    beneficiaries_count: beneficiaries_count || null,
    activities: finalActivities,
    methodology: finalMethodology,
    partners: finalPartners,
    expected_results: expected_results || [],
    sustainability: sustainability || null,
    problem: finalProblem,
    themes: finalThemes,
    // Keep what the user actually typed so we can show it back on the edit
    // page or re-run cleanup later. Only stored when cleanup ran.
    raw_input: cleaned ? rawInput : null,
    cleanup_applied: cleaned ? true : false,
  };

  // 5. Map data to existing project columns + logframe_data
  const projectRow = {
    organization_id: orgId,
    name: finalName,
    summary: finalSummary,
    objectives: finalSpecificObjectives.filter(Boolean),
    target_beneficiaries: [
      finalBeneficiariesDirect,
      finalBeneficiariesIndirect,
    ].filter(Boolean) as string[],
    target_geography: finalGeography,
    requested_amount_eur: budget ? parseInt(budget, 10) : null,
    duration_months: duration_months ? parseInt(duration_months, 10) : null,
    indicators: (expected_results || [])
      .map((r: { indicator?: string }) => r.indicator)
      .filter(Boolean),
    logframe_data: logframeData,
  };

  const { data: project, error: insertError } = await supabase
    .from("projects")
    .insert(projectRow)
    .select("id, name")
    .single();

  if (insertError) {
    console.error("Error creating project:", insertError);
    // If logframe_data column doesn't exist, retry without it
    if (insertError.message?.includes("logframe_data")) {
      const { logframe_data: _, ...rowWithoutLogframe } = projectRow;
      const { data: fallback, error: fallbackError } = await supabase
        .from("projects")
        .insert(rowWithoutLogframe)
        .select("id, name")
        .single();

      if (fallbackError) {
        return NextResponse.json(
          { error: fallbackError.message },
          { status: 500 }
        );
      }
      await embedProjectInBackground(supabase, fallback.id, projectRow, orgId);
      return NextResponse.json({ project: fallback }, { status: 201 });
    }

    return NextResponse.json(
      { error: insertError.message },
      { status: 500 }
    );
  }

  await embedProjectInBackground(supabase, project.id, projectRow, orgId);

  return NextResponse.json({ project }, { status: 201 });
}

/**
 * Generate + persist the project embedding. Awaited inline (rather than
 * fire-and-forget) so it's available immediately for the next match-run
 * the user triggers on this project. Best-effort: failures don't block
 * the API response.
 */
async function embedProjectInBackground(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  projectId: string,
  projectRow: Record<string, unknown>,
  orgId: string
) {
  if (!isEmbeddingsAvailable()) return;
  try {
    const { data: org } = await supabase
      .from("organizations")
      .select("name, mission, thematic_areas, beneficiaries, geographic_focus")
      .eq("id", orgId)
      .single();

    const logframe = (projectRow.logframe_data || {}) as Record<string, unknown>;
    const projectInput = {
      name: projectRow.name as string,
      summary: projectRow.summary as string | null,
      objectives: projectRow.objectives as string[] | null,
      target_beneficiaries: projectRow.target_beneficiaries as string[] | null,
      target_geography: projectRow.target_geography as string[] | null,
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

    const vec = await generateProjectEmbedding(projectInput, org ?? undefined);
    if (!vec) return;

    await supabase
      .from("projects")
      .update({
        embedding: toPgVector(vec),
        embedding_updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);
  } catch (e) {
    console.warn("[projects] embedding failed:", e);
  }
}
