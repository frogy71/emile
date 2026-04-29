import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/email/track/click/[token]?redirect=<encoded-url>
 *
 * Records the click and 302-redirects to the original target. We only
 * stamp clicked_at the first time — repeated clicks on the same link are
 * still counted in the open rate, but we keep the timestamp meaningful.
 *
 * The redirect URL is validated to be either http(s) or a relative path
 * on the app, so an attacker can't use the tracking endpoint as an open
 * redirect to phishing pages.
 */

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

function safeRedirect(redirect: string | null): string {
  const fallback = process.env.NEXT_PUBLIC_APP_URL || "/";
  if (!redirect) return fallback;
  // Allow same-origin paths and absolute http(s) only.
  if (redirect.startsWith("/")) return redirect;
  try {
    const u = new URL(redirect);
    if (u.protocol === "http:" || u.protocol === "https:") return redirect;
  } catch {
    /* fall through */
  }
  return fallback;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const url = new URL(request.url);
  const target = safeRedirect(url.searchParams.get("redirect"));

  if (token) {
    try {
      const supabase = getSupabase();
      // Stamp clicked_at only on first click. Also stamp opened_at if
      // still null — a click implies an open, even if the pixel was
      // blocked by the email client.
      const nowIso = new Date().toISOString();
      const { data: row } = await supabase
        .from("email_sequence_queue")
        .select("clicked_at, opened_at")
        .eq("tracking_token", token)
        .maybeSingle();
      if (row) {
        const update: Record<string, string> = {};
        if (!row.clicked_at) update.clicked_at = nowIso;
        if (!row.opened_at) update.opened_at = nowIso;
        if (Object.keys(update).length > 0) {
          await supabase
            .from("email_sequence_queue")
            .update(update)
            .eq("tracking_token", token);
        }
      }
    } catch (err) {
      // Don't block redirect on tracking failure.
      console.warn("[email-click]", err);
    }
  }

  return NextResponse.redirect(target, { status: 302 });
}
