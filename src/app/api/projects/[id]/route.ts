import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import {
  generateProjectEmbedding,
  isEmbeddingsAvailable,
  toPgVector,
} from "@/lib/ai/embeddings";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getAuthenticatedUser() {
  const supabase = await createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

/**
 * GET /api/projects/[id] — fetch one project (owner-only)
 *
 * Used by the edit page to preload existing values into the form.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { data: project, error } = await supabase
    .from("projects")
    .select("*, organizations!inner(user_id)")
    .eq("id", id)
    .single();

  if (error || !project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Ownership check — never leak someone else's project.
  if ((project.organizations as unknown as { user_id: string })?.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Strip the joined row before returning.
  const { organizations: _, ...projectClean } = project as Record<string, unknown>;
  return NextResponse.json({ project: projectClean });
}

/**
 * PATCH /api/projects/[id] — update a project (rename, edit fields)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const supabase = getSupabaseAdmin();

  // Verify ownership
  const { data: project } = await supabase
    .from("projects")
    .select("id, organization_id, organizations!inner(user_id)")
    .eq("id", id)
    .single();

  if (!project || (project.organizations as unknown as { user_id: string })?.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Build update object from allowed fields
  const allowedFields = [
    "name", "summary", "objectives", "target_beneficiaries",
    "target_geography", "requested_amount_eur", "duration_months",
    "indicators", "logframe_data",
  ];

  const updateData: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Rien à mettre à jour" }, { status: 400 });
  }

  updateData.updated_at = new Date().toISOString();

  const { data: updated, error: updateError } = await supabase
    .from("projects")
    .update(updateData)
    .eq("id", id)
    .select("id, name")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Re-embed if any embedding-relevant field changed. We don't refresh
  // when only the name/budget/duration changed and nothing semantic moved
  // — but the wizard usually rewrites logframe_data wholesale, so we play
  // it safe and check the field set.
  const semanticFields = [
    "summary",
    "objectives",
    "target_beneficiaries",
    "target_geography",
    "logframe_data",
    "name",
  ];
  const semanticChanged = semanticFields.some((f) => f in updateData);
  if (semanticChanged) {
    await refreshProjectEmbedding(supabase, id);
  }

  return NextResponse.json({ project: updated });
}

async function refreshProjectEmbedding(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  projectId: string
) {
  if (!isEmbeddingsAvailable()) return;
  try {
    const { data: project } = await supabase
      .from("projects")
      .select(
        "name, summary, objectives, target_beneficiaries, target_geography, logframe_data, organization_id"
      )
      .eq("id", projectId)
      .single();
    if (!project) return;

    const { data: org } = await supabase
      .from("organizations")
      .select("name, mission, thematic_areas, beneficiaries, geographic_focus")
      .eq("id", project.organization_id)
      .single();

    const logframe = (project.logframe_data || {}) as Record<string, unknown>;
    const vec = await generateProjectEmbedding(
      {
        name: project.name,
        summary: project.summary,
        objectives: project.objectives,
        target_beneficiaries: project.target_beneficiaries,
        target_geography: project.target_geography,
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
      },
      org ?? undefined
    );
    if (!vec) return;

    await supabase
      .from("projects")
      .update({
        embedding: toPgVector(vec),
        embedding_updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);
  } catch (e) {
    console.warn("[projects PATCH] embedding refresh failed:", e);
  }
}

/**
 * DELETE /api/projects/[id] — delete a project
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getSupabaseAdmin();

  // Verify ownership
  const { data: project } = await supabase
    .from("projects")
    .select("id, organization_id, organizations!inner(user_id)")
    .eq("id", id)
    .single();

  if (!project || (project.organizations as unknown as { user_id: string })?.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Delete related data first (match_scores, proposals)
  await supabase.from("match_scores").delete().eq("project_id", id);
  await supabase.from("proposals").delete().eq("project_id", id);

  const { error: deleteError } = await supabase
    .from("projects")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
