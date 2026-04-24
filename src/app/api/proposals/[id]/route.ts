import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type ProposalSection = { title: string; content: string };
type ProposalContent = {
  sections?: ProposalSection[];
  language?: string;
  generatedAt?: string;
};

/**
 * Ownership guard — resolves the proposal, validates it belongs to the
 * authenticated user's org. Returns null + a 404 response if not.
 */
async function getOwnedProposal(
  id: string
): Promise<
  | { proposal: Record<string, unknown> }
  | { error: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: proposal, error } = await supabaseAdmin
    .from("proposals")
    .select("*, organizations!inner(user_id)")
    .eq("id", id)
    .single();

  if (error || !proposal) {
    return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }

  const ownerId = (proposal.organizations as unknown as { user_id: string })?.user_id;
  if (ownerId !== user.id) {
    return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }

  return { proposal: proposal as Record<string, unknown> };
}

/**
 * PATCH /api/proposals/[id] — edit proposal sections in place.
 *
 * Body: { sections: [{ title, content }, ...], status?: "draft" | "submitted" }
 *
 * Only the sections array and status are mutable. Everything else (grant,
 * project, org) is immutable because it'd create dangling references.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guarded = await getOwnedProposal(id);
  if ("error" in guarded) return guarded.error;

  const body = (await request.json()) as {
    sections?: ProposalSection[];
    status?: string;
  };

  // Validate sections shape — reject silently-malformed payloads so we
  // don't wipe content.
  if (body.sections !== undefined) {
    if (
      !Array.isArray(body.sections) ||
      !body.sections.every(
        (s) => typeof s?.title === "string" && typeof s?.content === "string"
      )
    ) {
      return NextResponse.json({ error: "Invalid sections" }, { status: 400 });
    }
  }

  const existingContent = (guarded.proposal.content || {}) as ProposalContent;
  const nextContent: ProposalContent = {
    ...existingContent,
    ...(body.sections !== undefined ? { sections: body.sections } : {}),
  };

  const update: Record<string, unknown> = {
    content: nextContent,
    updated_at: new Date().toISOString(),
  };
  if (body.status && ["draft", "submitted", "archived"].includes(body.status)) {
    update.status = body.status;
  }

  const { data, error } = await supabaseAdmin
    .from("proposals")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ proposal: data });
}

/**
 * DELETE /api/proposals/[id] — remove a proposal the user owns.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guarded = await getOwnedProposal(id);
  if ("error" in guarded) return guarded.error;

  const { error } = await supabaseAdmin
    .from("proposals")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
