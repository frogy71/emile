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

    // Auto-create default alert preferences so new users get deadline emails
    // without having to visit /settings first. Use a low-noise default (weekly,
    // score ≥ 60). Fire-and-forget — don't block org creation on this.
    if (!result.error && result.data?.id) {
      supabaseAdmin
        .from("alert_preferences")
        .upsert(
          {
            organization_id: result.data.id,
            email: user.email || "",
            frequency: "weekly",
            min_score: 60,
            enabled: true,
          },
          { onConflict: "organization_id" }
        )
        .then(({ error: prefError }) => {
          if (prefError) console.error("alert_pref seed error:", prefError.message);
        });
    }
  }

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({ organization: result.data });
}

/**
 * PATCH /api/profile — update alert preferences
 */
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Find org
  const { data: org } = await supabaseAdmin
    .from("organizations")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!org) {
    return NextResponse.json({ error: "No organization found" }, { status: 404 });
  }

  // Upsert alert preferences
  const { error } = await supabaseAdmin
    .from("alert_preferences")
    .upsert({
      organization_id: org.id,
      email: user.email || "",
      frequency: body.alert_frequency || "weekly",
      min_score: body.alert_min_score || 60,
      enabled: true,
    }, { onConflict: "organization_id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
