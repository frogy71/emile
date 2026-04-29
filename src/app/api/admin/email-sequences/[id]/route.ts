import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";

/**
 * PATCH /api/admin/email-sequences/[id] — update a template
 * DELETE /api/admin/email-sequences/[id] — delete a template
 */

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const body = await request.json();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.subject === "string") update.subject = body.subject;
  if (typeof body.body_html === "string") update.body_html = body.body_html;
  if (typeof body.delay_days === "number") update.delay_days = body.delay_days;
  if (typeof body.active === "boolean") update.active = body.active;

  const { data, error } = await supabaseAdmin
    .from("email_sequence_templates")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ template: data });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const { error } = await supabaseAdmin
    .from("email_sequence_templates")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
