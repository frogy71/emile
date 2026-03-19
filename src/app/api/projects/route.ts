import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

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
  } = body;

  if (!name) {
    return NextResponse.json(
      { error: "Le nom du projet est requis" },
      { status: 400 }
    );
  }

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
  }

  // 4. Build logframe_data for fields not in the schema
  const logframeData = {
    general_objective: general_objective || null,
    specific_objectives: specific_objectives || [],
    beneficiaries_direct: beneficiaries_direct || null,
    beneficiaries_indirect: beneficiaries_indirect || null,
    beneficiaries_count: beneficiaries_count || null,
    activities: activities || [],
    methodology: methodology || null,
    partners: partners || null,
    expected_results: expected_results || [],
    sustainability: sustainability || null,
    problem: problem || null,
    themes: themes || [],
  };

  // 5. Map wizard data to existing project columns + logframe_data
  const projectRow = {
    organization_id: orgId,
    name,
    summary: summary || null,
    objectives: specific_objectives?.filter(Boolean) || [],
    target_beneficiaries: [
      beneficiaries_direct,
      beneficiaries_indirect,
    ].filter(Boolean),
    target_geography: geography || [],
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
      return NextResponse.json({ project: fallback }, { status: 201 });
    }

    return NextResponse.json(
      { error: insertError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ project }, { status: 201 });
}
