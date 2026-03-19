import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * GET /api/profile — fetch the current user's organization
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("organizations")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows found — that's fine for new users
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ organization: data });
}

/**
 * POST /api/profile — upsert the current user's organization
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const row = {
    user_id: user.id,
    name: body.name || "",
    legal_status: body.legal_status || null,
    country: body.country || "FR",
    mission: body.mission || null,
    annual_budget_eur: body.annual_budget_eur ? parseInt(body.annual_budget_eur, 10) : null,
    team_size: body.team_size ? parseInt(body.team_size, 10) : null,
    languages: body.languages || null,
    thematic_areas: body.thematic_areas || [],
    geographic_focus: body.geographic_focus || [],
    prior_grants: body.prior_grants || null,
    updated_at: new Date().toISOString(),
  };

  // Check if org already exists for this user
  const { data: existing } = await supabaseAdmin
    .from("organizations")
    .select("id")
    .eq("user_id", user.id)
    .single();

  let result;
  if (existing) {
    // Update
    result = await supabaseAdmin
      .from("organizations")
      .update(row)
      .eq("id", existing.id)
      .select()
      .single();
  } else {
    // Insert
    result = await supabaseAdmin
      .from("organizations")
      .insert(row)
      .select()
      .single();
  }

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({ organization: result.data });
}
