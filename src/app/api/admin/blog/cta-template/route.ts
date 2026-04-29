import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { buildCtaBlockForArticle } from "@/lib/blog/cta";

/**
 * GET   /api/admin/blog/cta-template — list all templates (most recent first)
 * POST  /api/admin/blog/cta-template — create or update the active template
 *   Body: { id?, title_template, body_text, cta_button_label, logframe_embed_url, reassurance_line }
 *   When `id` is omitted, a new row is inserted; the previous active rows are
 *   set to is_active=false so only one template is active at a time.
 *
 * POST /api/admin/blog/cta-template/apply-all — re-render the cta_block field
 *   on every published article using the current active template. Used by
 *   the admin "Appliquer à tous les articles" button.
 */

const EDITABLE_FIELDS = [
  "title_template",
  "body_text",
  "cta_button_label",
  "logframe_embed_url",
  "reassurance_line",
  "is_active",
] as const;

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { data, error } = await supabaseAdmin
    .from("blog_cta_templates")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ templates: data || [] });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json().catch(() => ({}));
  const updates: Record<string, unknown> = {};
  for (const k of EDITABLE_FIELDS) {
    if (k in body) updates[k] = body[k];
  }

  // Required minimum to create a template
  if (!body.id) {
    if (!updates.title_template || !updates.body_text) {
      return NextResponse.json(
        { error: "title_template and body_text required" },
        { status: 400 }
      );
    }
  }

  // If we're activating this one, deactivate the others first.
  if (updates.is_active === true) {
    await supabaseAdmin
      .from("blog_cta_templates")
      .update({ is_active: false })
      .neq("id", body.id || "00000000-0000-0000-0000-000000000000");
  }

  updates.updated_at = new Date().toISOString();

  let row;
  if (body.id) {
    const { data, error } = await supabaseAdmin
      .from("blog_cta_templates")
      .update(updates)
      .eq("id", body.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    row = data;
  } else {
    const { data, error } = await supabaseAdmin
      .from("blog_cta_templates")
      .insert(updates)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    row = data;
  }

  return NextResponse.json(row);
}

/**
 * Re-render the `cta_block` HTML on every published article using the
 * current active template. Strips the previous block from `body_html` and
 * appends the new one.
 */
export async function PUT(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://grant-finder-kappa.vercel.app";

  const { data: posts, error } = await supabaseAdmin
    .from("blog_posts")
    .select("id, slug, thematic_tag, body_html, cta_block")
    .eq("status", "published");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let updated = 0;
  for (const p of posts || []) {
    const newBlock = await buildCtaBlockForArticle(supabaseAdmin, {
      thematicTag: p.thematic_tag || "subvention",
      blogSlug: p.slug,
      siteUrl,
    });
    if (!newBlock) continue;

    let body = p.body_html as string;
    if (p.cta_block) {
      body = body.replace(p.cta_block as string, "").trimEnd();
    }
    body = `${body}\n${newBlock}`;

    await supabaseAdmin
      .from("blog_posts")
      .update({
        cta_block: newBlock,
        body_html: body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", p.id);
    updated++;
  }

  return NextResponse.json({ ok: true, updated });
}
