import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";

/**
 * GET  /api/admin/email-sequences — list all templates + per-step stats
 * POST /api/admin/email-sequences — create a new template (rare)
 */

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { data: templates, error } = await supabaseAdmin
    .from("email_sequence_templates")
    .select("*")
    .order("step_number");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Per-step stats from the queue. Single query, group in JS.
  const { data: queueRows } = await supabaseAdmin
    .from("email_sequence_queue")
    .select("step_number, status, opened_at, clicked_at");

  type Stats = {
    total: number;
    sent: number;
    opened: number;
    clicked: number;
    failed: number;
    skipped: number;
    unsubscribed: number;
    pending: number;
  };
  const stats: Record<number, Stats> = {};
  for (const r of queueRows ?? []) {
    const s = (stats[r.step_number] ||= {
      total: 0,
      sent: 0,
      opened: 0,
      clicked: 0,
      failed: 0,
      skipped: 0,
      unsubscribed: 0,
      pending: 0,
    });
    s.total++;
    if (r.status === "sent") s.sent++;
    else if (r.status === "failed") s.failed++;
    else if (r.status === "skipped") s.skipped++;
    else if (r.status === "unsubscribed") s.unsubscribed++;
    else if (r.status === "pending") s.pending++;
    if (r.opened_at) s.opened++;
    if (r.clicked_at) s.clicked++;
  }

  return NextResponse.json({
    templates: templates || [],
    stats,
  });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const { step_number, delay_days, subject, body_html, active } = body;
  if (
    typeof step_number !== "number" ||
    typeof delay_days !== "number" ||
    !subject ||
    !body_html
  ) {
    return NextResponse.json(
      { error: "step_number, delay_days, subject, body_html required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("email_sequence_templates")
    .insert({
      step_number,
      delay_days,
      subject,
      body_html,
      active: active !== false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ template: data });
}
