import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { SEQUENCE_STEPS } from "@/lib/email/sequence-templates";

/**
 * POST /api/admin/email-sequences/seed
 * Body: { force?: boolean }
 *
 * Runs the same logic as scripts/seed-email-sequence.ts so the admin can
 * one-click re-load defaults without dropping into a terminal. Without
 * `force`, rows that have been edited via the admin UI are preserved.
 */

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json().catch(() => ({}));
  const force = !!body.force;

  let inserted = 0;
  let updated = 0;
  let preserved = 0;

  for (const step of SEQUENCE_STEPS) {
    const { data: existing } = await supabaseAdmin
      .from("email_sequence_templates")
      .select("id, created_at, updated_at")
      .eq("step_number", step.stepNumber)
      .maybeSingle();

    if (existing) {
      const created = new Date(existing.created_at).getTime();
      const updatedAt = new Date(existing.updated_at).getTime();
      const wasEdited = Math.abs(updatedAt - created) > 1000;
      if (wasEdited && !force) {
        preserved++;
        continue;
      }
      const { error } = await supabaseAdmin
        .from("email_sequence_templates")
        .update({
          delay_days: step.delayDays,
          subject: step.subject,
          body_html: step.bodyHtml,
          updated_at: existing.created_at,
        })
        .eq("id", existing.id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      updated++;
    } else {
      const { error } = await supabaseAdmin
        .from("email_sequence_templates")
        .insert({
          step_number: step.stepNumber,
          delay_days: step.delayDays,
          subject: step.subject,
          body_html: step.bodyHtml,
        });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      inserted++;
    }
  }

  return NextResponse.json({ success: true, inserted, updated, preserved });
}
