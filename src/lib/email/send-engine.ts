/**
 * Email send engine for the Free → Pro nurture sequence.
 *
 * Two entry points:
 *   - enrollUser(userId, organizationId, signupDate) : create queue rows
 *     for every active step at signup_date + delay_days.
 *   - processEmailQueue() : called by the hourly cron. Picks up every
 *     pending row whose scheduled_at <= now, renders the template against
 *     the user's profile, sends via Resend, and updates the row's status.
 *
 * Tracking:
 *   - tracking pixel injected at the bottom of every email
 *   - all hrefs rewritten to /api/email/track/click/[token]?redirect=...
 *   - {{unsubscribe_link}} resolves to /api/email/unsubscribe/[token]
 *
 * Failure handling:
 *   - On send failure we mark status='failed'. The next cron pass also
 *     looks at recent failed rows and retries them once (we keep
 *     scheduled_at unchanged but flip status back to 'pending' if they
 *     were marked failed within the last 2 hours and have no sent_at).
 *   - We skip the entire enrollment as soon as the org converts to a paid
 *     plan or the org sets email_unsubscribed = true.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { resend, FROM_EMAIL } from "@/lib/resend";

interface QueueRow {
  id: string;
  user_id: string;
  organization_id: string | null;
  step_number: number;
  scheduled_at: string;
  tracking_token: string;
  status: string;
  sent_at: string | null;
}

interface TemplateRow {
  step_number: number;
  delay_days: number;
  subject: string;
  body_html: string;
  active: boolean;
}

interface RenderContext {
  firstName: string;
  orgName: string;
  appUrl: string;
  unsubscribeLink: string;
  trackingToken: string;
}

function admin(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

/**
 * Pull all active templates and create one queue row per (user, step). The
 * unique index on (user_id, step_number) makes this idempotent — re-running
 * after enrollment is a no-op.
 *
 * `signupDate` lets us enroll users who signed up earlier (back-fill).
 */
export async function enrollUser(
  userId: string,
  organizationId: string | null,
  signupDate: Date = new Date()
): Promise<{ enrolled: number; skipped: number }> {
  const supabase = admin();

  const { data: templates } = await supabase
    .from("email_sequence_templates")
    .select("step_number, delay_days, active")
    .eq("active", true)
    .order("step_number");

  if (!templates || templates.length === 0) {
    return { enrolled: 0, skipped: 0 };
  }

  // If the org has already converted to a paying plan, skip enrollment.
  if (organizationId) {
    const { data: org } = await supabase
      .from("organizations")
      .select("plan_status, email_unsubscribed")
      .eq("id", organizationId)
      .maybeSingle();
    if (org?.plan_status === "active" || org?.email_unsubscribed) {
      return { enrolled: 0, skipped: templates.length };
    }
  }

  const rows = templates.map((t) => ({
    user_id: userId,
    organization_id: organizationId,
    step_number: t.step_number,
    scheduled_at: new Date(
      signupDate.getTime() + t.delay_days * 86400_000
    ).toISOString(),
  }));

  // ON CONFLICT DO NOTHING via upsert with ignoreDuplicates so we don't
  // double-enroll a user.
  const { error, count } = await supabase
    .from("email_sequence_queue")
    .upsert(rows, {
      onConflict: "user_id,step_number",
      ignoreDuplicates: true,
      count: "exact",
    });

  if (error) {
    console.error("enrollUser failed:", error);
    throw error;
  }

  return { enrolled: count ?? rows.length, skipped: 0 };
}

/**
 * Mark every pending email for a user as 'skipped'. Called when the user
 * converts to Pro/Expert (Stripe webhook) or unsubscribes.
 */
export async function skipPendingForUser(
  userId: string,
  reason: "converted" | "unsubscribed" = "converted"
): Promise<number> {
  const supabase = admin();
  const status = reason === "unsubscribed" ? "unsubscribed" : "skipped";
  const { data, error } = await supabase
    .from("email_sequence_queue")
    .update({ status })
    .eq("user_id", userId)
    .eq("status", "pending")
    .select("id");
  if (error) {
    console.error("skipPendingForUser failed:", error);
    return 0;
  }
  return data?.length ?? 0;
}

/**
 * Mark every pending email for an org as 'skipped' / 'unsubscribed'.
 * Used by the Stripe webhook (we know the org but not the user_id) and
 * by the unsubscribe route.
 */
export async function skipPendingForOrg(
  organizationId: string,
  reason: "converted" | "unsubscribed" = "converted"
): Promise<number> {
  const supabase = admin();
  const status = reason === "unsubscribed" ? "unsubscribed" : "skipped";
  const { data, error } = await supabase
    .from("email_sequence_queue")
    .update({ status })
    .eq("organization_id", organizationId)
    .eq("status", "pending")
    .select("id");
  if (error) {
    console.error("skipPendingForOrg failed:", error);
    return 0;
  }
  return data?.length ?? 0;
}

function deriveFirstName(
  email: string,
  metadata: Record<string, unknown> | null | undefined
): string {
  const fromMeta =
    (metadata?.first_name as string | undefined) ||
    (metadata?.firstName as string | undefined) ||
    (metadata?.full_name as string | undefined)?.split(" ")[0] ||
    (metadata?.name as string | undefined)?.split(" ")[0];
  if (fromMeta && fromMeta.trim()) return fromMeta.trim();
  // Fall back to the local-part of the email, capitalised. "alice.dupont" → "Alice".
  const local = email.split("@")[0] || "";
  const head = local.split(/[._-]/)[0] || local;
  if (!head) return "";
  return head.charAt(0).toUpperCase() + head.slice(1);
}

function renderTemplate(html: string, ctx: RenderContext): string {
  return html
    .replaceAll("{{first_name}}", escapeHtml(ctx.firstName))
    .replaceAll("{{org_name}}", escapeHtml(ctx.orgName))
    .replaceAll("{{app_url}}", ctx.appUrl)
    .replaceAll("{{unsubscribe_link}}", ctx.unsubscribeLink);
}

function renderSubject(subject: string, ctx: RenderContext): string {
  return subject
    .replaceAll("{{first_name}}", ctx.firstName)
    .replaceAll("{{org_name}}", ctx.orgName);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Rewrite all `href` attributes in the email so clicks go through the
 * tracking endpoint. The unsubscribe link stays untouched (it's already
 * served by /api/email/unsubscribe/[token]). Anchor (#) and mailto: links
 * are left alone.
 */
export function rewriteLinksForTracking(
  html: string,
  trackingToken: string,
  baseUrl: string
): string {
  const trackBase = `${baseUrl}/api/email/track/click/${trackingToken}`;
  return html.replace(
    /href="([^"]+)"/g,
    (match, url: string) => {
      if (
        url.startsWith("#") ||
        url.startsWith("mailto:") ||
        url.includes("/api/email/unsubscribe/") ||
        url.includes("/api/email/track/")
      ) {
        return match;
      }
      const redirected = `${trackBase}?redirect=${encodeURIComponent(url)}`;
      return `href="${redirected}"`;
    }
  );
}

/**
 * Inject a 1×1 transparent tracking pixel before </body>. If </body> isn't
 * present we just append it.
 */
export function injectTrackingPixel(
  html: string,
  trackingToken: string,
  baseUrl: string
): string {
  const pixel = `<img src="${baseUrl}/api/email/track/open/${trackingToken}" width="1" height="1" alt="" style="display:none;border:0;" />`;
  if (html.includes("</body>")) {
    return html.replace("</body>", `${pixel}</body>`);
  }
  return html + pixel;
}

/**
 * Decorate a rendered email body with both tracking mechanisms.
 */
export function decorateForTracking(
  html: string,
  trackingToken: string,
  baseUrl: string
): string {
  return injectTrackingPixel(
    rewriteLinksForTracking(html, trackingToken, baseUrl),
    trackingToken,
    baseUrl
  );
}

interface ProcessResult {
  picked: number;
  sent: number;
  failed: number;
  skipped: number;
  retriedFailures: number;
  details: Array<{
    queueId: string;
    step: number;
    status: "sent" | "failed" | "skipped";
    error?: string;
  }>;
}

/**
 * The main loop, called by the hourly cron. Picks up every pending row
 * whose scheduled_at <= now, plus any recently-failed rows for one retry,
 * and dispatches them one at a time.
 */
export async function processEmailQueue(): Promise<ProcessResult> {
  const supabase = admin();
  const now = new Date();
  const result: ProcessResult = {
    picked: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
    retriedFailures: 0,
    details: [],
  };

  // 1. Resurrect failed rows from the last 2h so they get one retry.
  const twoHoursAgo = new Date(now.getTime() - 2 * 3600_000).toISOString();
  const { data: retryRows } = await supabase
    .from("email_sequence_queue")
    .update({ status: "pending" })
    .eq("status", "failed")
    .is("sent_at", null)
    .gte("scheduled_at", twoHoursAgo)
    .select("id");
  result.retriedFailures = retryRows?.length ?? 0;

  // 2. Pick all pending rows due to be sent. Cap the batch to a
  // reasonable size so a single cron run doesn't try to dispatch a
  // mountain of email at once. Resend rate-limits at 10 req/s by default.
  const { data: pending, error: pendingErr } = await supabase
    .from("email_sequence_queue")
    .select("id, user_id, organization_id, step_number, scheduled_at, tracking_token, status, sent_at")
    .eq("status", "pending")
    .lte("scheduled_at", now.toISOString())
    .order("scheduled_at")
    .limit(200);

  if (pendingErr) {
    console.error("processEmailQueue select failed:", pendingErr);
    throw pendingErr;
  }

  result.picked = pending?.length ?? 0;
  if (!pending || pending.length === 0) return result;

  // 3. Pre-fetch active templates keyed by step_number. Cuts a query per row.
  const stepNumbers = Array.from(new Set(pending.map((p) => p.step_number)));
  const { data: templatesData } = await supabase
    .from("email_sequence_templates")
    .select("step_number, delay_days, subject, body_html, active")
    .in("step_number", stepNumbers);
  const templates = new Map<number, TemplateRow>(
    (templatesData ?? []).map((t) => [t.step_number, t as TemplateRow])
  );

  // 4. Pre-fetch user emails + metadata. The auth admin API doesn't expose
  // a bulk getByIds, so we list (cheap on small bases) and index.
  const userIds = Array.from(new Set(pending.map((p) => p.user_id)));
  const { data: userList } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const userById = new Map<
    string,
    { email: string | null; metadata: Record<string, unknown> | null }
  >();
  for (const u of userList?.users ?? []) {
    if (userIds.includes(u.id)) {
      userById.set(u.id, {
        email: u.email ?? null,
        metadata: (u.user_metadata as Record<string, unknown>) ?? null,
      });
    }
  }

  // 5. Pre-fetch orgs (plan + name + email_unsubscribed) for skip checks.
  const orgIds = Array.from(
    new Set(pending.map((p) => p.organization_id).filter((x): x is string => !!x))
  );
  const orgById = new Map<
    string,
    { name: string | null; plan_status: string | null; email_unsubscribed: boolean }
  >();
  if (orgIds.length > 0) {
    const { data: orgs } = await supabase
      .from("organizations")
      .select("id, name, plan_status, email_unsubscribed")
      .in("id", orgIds);
    for (const o of orgs ?? []) {
      orgById.set(o.id, {
        name: o.name ?? null,
        plan_status: o.plan_status ?? null,
        email_unsubscribed: !!o.email_unsubscribed,
      });
    }
  }

  // 6. Dispatch each row.
  for (const row of pending as QueueRow[]) {
    try {
      const template = templates.get(row.step_number);
      if (!template || !template.active) {
        await markStatus(supabase, row.id, "skipped");
        result.skipped++;
        result.details.push({ queueId: row.id, step: row.step_number, status: "skipped", error: "template inactive" });
        continue;
      }

      const user = userById.get(row.user_id);
      if (!user || !user.email) {
        await markStatus(supabase, row.id, "skipped");
        result.skipped++;
        result.details.push({ queueId: row.id, step: row.step_number, status: "skipped", error: "no email" });
        continue;
      }

      const org = row.organization_id ? orgById.get(row.organization_id) : null;
      if (org?.plan_status === "active") {
        await markStatus(supabase, row.id, "skipped");
        result.skipped++;
        result.details.push({ queueId: row.id, step: row.step_number, status: "skipped", error: "converted to paid" });
        continue;
      }
      if (org?.email_unsubscribed) {
        await markStatus(supabase, row.id, "unsubscribed");
        result.skipped++;
        result.details.push({ queueId: row.id, step: row.step_number, status: "skipped", error: "unsubscribed" });
        continue;
      }

      const ctx: RenderContext = {
        firstName: deriveFirstName(user.email, user.metadata),
        orgName: org?.name || "votre organisation",
        appUrl: appUrl(),
        unsubscribeLink: `${appUrl()}/api/email/unsubscribe/${row.tracking_token}`,
        trackingToken: row.tracking_token,
      };

      const subject = renderSubject(template.subject, ctx);
      const renderedBody = renderTemplate(template.body_html, ctx);
      const finalHtml = decorateForTracking(renderedBody, row.tracking_token, appUrl());

      await resend.emails.send({
        from: FROM_EMAIL,
        to: user.email,
        subject,
        html: finalHtml,
        headers: {
          "List-Unsubscribe": `<${ctx.unsubscribeLink}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      });

      await supabase
        .from("email_sequence_queue")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", row.id);

      result.sent++;
      result.details.push({ queueId: row.id, step: row.step_number, status: "sent" });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await markStatus(supabase, row.id, "failed");
      result.failed++;
      result.details.push({
        queueId: row.id,
        step: row.step_number,
        status: "failed",
        error: message,
      });
      console.error(`[email-queue] step ${row.step_number} failed:`, message);
    }
  }

  return result;
}

async function markStatus(
  supabase: SupabaseClient,
  queueId: string,
  status: "skipped" | "failed" | "unsubscribed"
) {
  await supabase.from("email_sequence_queue").update({ status }).eq("id", queueId);
}
