import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";

/**
 * GET /api/admin/blog/settings
 *   Returns: env-driven config (auto-publish, publication time) + the
 *   grant blacklist.
 *
 * POST /api/admin/blog/settings
 *   Body: { blacklistAdd?: string, blacklistRemove?: string }
 *   Toggles `grants.blog_blacklisted` for one grant id at a time.
 *
 * Auto-publish & cron schedule are env-controlled (BLOG_AUTO_PUBLISH +
 * vercel.json) so changing them requires a redeploy. The page surfaces
 * their current values for transparency rather than offering inline edits.
 */

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const autoPublish = process.env.BLOG_AUTO_PUBLISH !== "false";
  const cronSchedule = "0 6 * * *"; // mirrors vercel.json

  const { data: blacklist } = await supabaseAdmin
    .from("grants")
    .select("id, title, funder, deadline")
    .eq("blog_blacklisted", true)
    .order("title");

  return NextResponse.json({
    autoPublish,
    cronSchedule,
    blacklist: blacklist || [],
    indexNowKey: process.env.INDEXNOW_KEY ? "configured" : "missing",
    blogAlertEmail: process.env.BLOG_ALERT_EMAIL || "francois@tresorier.co",
  });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json().catch(() => ({}));
  if (typeof body.blacklistAdd === "string" && body.blacklistAdd) {
    await supabaseAdmin
      .from("grants")
      .update({ blog_blacklisted: true })
      .eq("id", body.blacklistAdd);
  }
  if (typeof body.blacklistRemove === "string" && body.blacklistRemove) {
    await supabaseAdmin
      .from("grants")
      .update({ blog_blacklisted: false })
      .eq("id", body.blacklistRemove);
  }
  return NextResponse.json({ ok: true });
}
