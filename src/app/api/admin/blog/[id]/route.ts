import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { countWords } from "@/lib/blog/slug";

/**
 * GET    /api/admin/blog/:id  → full row
 * PATCH  /api/admin/blog/:id  → edit fields (title, body, meta, status…)
 * DELETE /api/admin/blog/:id  → hard delete
 *
 * The PATCH handler accepts any subset of editable fields and recomputes
 * `word_count` if the body changes. Status transitions to "published"
 * stamp `published_at` automatically.
 */

const EDITABLE_FIELDS = [
  "title",
  "slug",
  "meta_title",
  "meta_description",
  "body_html",
  "cta_block",
  "cover_image_url",
  "thematic_tag",
  "keywords",
  "status",
  "scheduled_at",
] as const;

type EditableField = (typeof EDITABLE_FIELDS)[number];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await params;

  const body = await request.json().catch(() => ({}));
  const updates: Record<string, unknown> = {};
  for (const k of EDITABLE_FIELDS) {
    if (k in body) updates[k] = body[k as EditableField];
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No editable fields" }, { status: 400 });
  }

  if (typeof updates.body_html === "string") {
    updates.word_count = countWords(updates.body_html as string);
  }

  if (updates.status === "published") {
    // Stamp publish time only if the row wasn't already published.
    const { data: current } = await supabaseAdmin
      .from("blog_posts")
      .select("published_at")
      .eq("id", id)
      .maybeSingle();
    if (!current?.published_at) {
      updates.published_at = new Date().toISOString();
    }
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("blog_posts")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await params;

  const { error } = await supabaseAdmin.from("blog_posts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
