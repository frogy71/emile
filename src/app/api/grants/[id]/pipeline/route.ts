import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * PATCH /api/grants/[id]/pipeline
 *
 * Move a grant between Kanban columns. Updates pipeline_status on the
 * underlying user_grant_interactions row that represents the user's
 * relationship with the grant.
 *
 * The pipeline lives on top of likes/saves (see migration 0011). When the
 * user has multiple interactions on the same grant (e.g. both 'like' and
 * 'save'), we update *all* rows for that org/grant pair so the column move
 * stays coherent regardless of which interaction was used to surface the
 * card. If no positive interaction exists yet, we create one of type 'like'
 * — dragging an unrelated grant onto the board is itself an expression of
 * interest.
 */

const VALID_STATUSES = new Set([
  "discovered",
  "preparing",
  "applied",
  "waiting",
  "accepted",
  "rejected",
]);

export async function PATCH(
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

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const status = body.status;
  if (!status || !VALID_STATUSES.has(status)) {
    return NextResponse.json(
      {
        error:
          "status must be one of: " + Array.from(VALID_STATUSES).join(", "),
      },
      { status: 400 }
    );
  }

  const { data: org, error: orgError } = await supabaseAdmin
    .from("organizations")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (orgError || !org) {
    return NextResponse.json(
      { error: "Organization not found" },
      { status: 404 }
    );
  }

  // Look for any positive interaction (like / save / apply) on this grant.
  // We update them all so the card has one canonical pipeline_status no
  // matter which row the SELECT later picks up.
  const { data: existing } = await supabaseAdmin
    .from("user_grant_interactions")
    .select("id, interaction_type")
    .eq("organization_id", org.id)
    .eq("grant_id", grantId)
    .in("interaction_type", ["like", "save", "apply"]);

  if (!existing || existing.length === 0) {
    // No interaction yet — create one. We pick 'like' as the implicit
    // interaction type because dragging a grant onto the board is an
    // affirmative act, not a save-for-later.
    const { data: created, error: insertError } = await supabaseAdmin
      .from("user_grant_interactions")
      .insert({
        organization_id: org.id,
        grant_id: grantId,
        interaction_type: "like",
        pipeline_status: status,
      })
      .select()
      .single();
    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true, interaction: created });
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from("user_grant_interactions")
    .update({ pipeline_status: status })
    .eq("organization_id", org.id)
    .eq("grant_id", grantId)
    .in("interaction_type", ["like", "save", "apply"])
    .select();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    interaction: updated?.[0] ?? null,
    updatedCount: updated?.length ?? 0,
  });
}
