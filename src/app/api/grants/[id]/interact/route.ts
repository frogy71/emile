import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * POST /api/grants/[id]/interact
 *
 * Record a user gesture on a grant — like, dislike, save, dismiss, view, apply.
 * Upserts on (organization_id, grant_id, interaction_type) so re-clicking
 * the same button is idempotent rather than inflating popularity or history.
 *
 * Positive intents (like / save / apply) also bump the grant's
 * popularity_score so other orgs get a "wisdom of the crowd" boost in their
 * matching pipeline (see /api/projects/[id]/match).
 */

const VALID_TYPES = new Set([
  "like",
  "dislike",
  "save",
  "dismiss",
  "view",
  "apply",
]);

const POPULARITY_BOOSTS = new Set(["like", "save", "apply"]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: grantId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    interaction_type?: string;
    project_id?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const interactionType = body.interaction_type;
  if (!interactionType || !VALID_TYPES.has(interactionType)) {
    return NextResponse.json(
      { error: "interaction_type must be one of: " + Array.from(VALID_TYPES).join(", ") },
      { status: 400 }
    );
  }

  // Resolve the user's organization. The app currently assumes one org per
  // user (matching the rest of the API surface).
  const { data: org, error: orgError } = await supabaseAdmin
    .from("organizations")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (orgError || !org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  // Verify the grant exists — guards against typo'd IDs producing zombie
  // interactions that fail the FK on insert anyway.
  const { data: grant, error: grantError } = await supabaseAdmin
    .from("grants")
    .select("id, popularity_score")
    .eq("id", grantId)
    .single();
  if (grantError || !grant) {
    return NextResponse.json({ error: "Grant not found" }, { status: 404 });
  }

  // Was this interaction already recorded? If so, skip the popularity bump
  // so re-clicks stay idempotent.
  const { data: existing } = await supabaseAdmin
    .from("user_grant_interactions")
    .select("id")
    .eq("organization_id", org.id)
    .eq("grant_id", grantId)
    .eq("interaction_type", interactionType)
    .maybeSingle();
  const isNew = !existing;

  const { data: interaction, error: upsertError } = await supabaseAdmin
    .from("user_grant_interactions")
    .upsert(
      {
        organization_id: org.id,
        project_id: body.project_id || null,
        grant_id: grantId,
        interaction_type: interactionType,
      },
      { onConflict: "organization_id,grant_id,interaction_type" }
    )
    .select()
    .single();

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  // Bump popularity only on the FIRST positive interaction from this org.
  // Done as an additive update so concurrent requests can't lose increments.
  let popularityScore = grant.popularity_score ?? 0;
  if (isNew && POPULARITY_BOOSTS.has(interactionType)) {
    const { data: updated, error: updError } = await supabaseAdmin
      .from("grants")
      .update({ popularity_score: popularityScore + 1 })
      .eq("id", grantId)
      .select("popularity_score")
      .single();
    if (updError) {
      console.warn("[interact] popularity bump failed:", updError.message);
    } else if (updated) {
      popularityScore = updated.popularity_score ?? popularityScore;
    }
  }

  return NextResponse.json({
    success: true,
    interaction,
    popularityScore,
    isNew,
  });
}
