import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * GET /api/grants/preferences
 *
 * Returns the authenticated user's full interaction history (likes,
 * dislikes, saves, dismisses, applies, views) for the current org. The
 * frontend uses this to:
 *   - render the "Saved grants" view
 *   - hydrate the like/dislike button state across pages
 *   - inform follow-up suggestions
 *
 * Grouped by interaction_type for cheap client-side rendering.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: org, error: orgError } = await supabaseAdmin
    .from("organizations")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (orgError || !org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  const { data, error } = await supabaseAdmin
    .from("user_grant_interactions")
    .select(
      "id, interaction_type, project_id, grant_id, created_at, grants(id, title, funder, deadline, max_amount_eur, source_name, thematic_areas, grant_type, popularity_score)"
    )
    .eq("organization_id", org.id)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data || [];
  const grouped: Record<string, typeof rows> = {
    like: [],
    dislike: [],
    save: [],
    dismiss: [],
    view: [],
    apply: [],
  };
  for (const row of rows) {
    const t = row.interaction_type as string;
    if (grouped[t]) grouped[t].push(row);
  }

  return NextResponse.json({
    organizationId: org.id,
    total: rows.length,
    interactions: rows,
    byType: grouped,
  });
}
