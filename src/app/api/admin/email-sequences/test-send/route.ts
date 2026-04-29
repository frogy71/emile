import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { decorateForTracking } from "@/lib/email/send-engine";

/**
 * POST /api/admin/email-sequences/test-send
 * Body: { templateId: string, to?: string }
 *
 * Sends a one-off render of a template to the admin (or a custom address).
 * No queue row is created — this is purely a preview send.
 */

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "RESEND_API_KEY not configured" },
      { status: 500 }
    );
  }

  const body = await request.json();
  const { templateId, to } = body as { templateId?: string; to?: string };
  const recipient = (to && to.trim()) || auth.user.email;

  if (!templateId) {
    return NextResponse.json(
      { error: "templateId required" },
      { status: 400 }
    );
  }

  const { data: template, error } = await supabaseAdmin
    .from("email_sequence_templates")
    .select("step_number, subject, body_html")
    .eq("id", templateId)
    .single();

  if (error || !template) {
    return NextResponse.json(
      { error: "Template not found" },
      { status: 404 }
    );
  }

  // Use a sentinel tracking token for previews so prod metrics aren't
  // polluted with admin clicks. The links still work — they just don't
  // map to a queue row.
  const previewToken = "00000000-0000-0000-0000-000000000000";
  const ctx = {
    firstName: "François",
    orgName: "Test Org",
    appUrl: appUrl(),
    unsubscribeLink: `${appUrl()}/api/email/unsubscribe/${previewToken}`,
  };
  const subject = `[TEST] ${template.subject}`
    .replaceAll("{{first_name}}", ctx.firstName)
    .replaceAll("{{org_name}}", ctx.orgName);
  const rendered = template.body_html
    .replaceAll("{{first_name}}", escapeHtml(ctx.firstName))
    .replaceAll("{{org_name}}", escapeHtml(ctx.orgName))
    .replaceAll("{{app_url}}", ctx.appUrl)
    .replaceAll("{{unsubscribe_link}}", ctx.unsubscribeLink);
  const finalHtml = decorateForTracking(rendered, previewToken, appUrl());

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: recipient,
      subject,
      html: finalHtml,
    });
    return NextResponse.json({ success: true, sent_to: recipient });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
