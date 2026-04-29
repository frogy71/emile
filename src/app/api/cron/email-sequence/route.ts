import { NextResponse } from "next/server";
import { processEmailQueue } from "@/lib/email/send-engine";

/**
 * Hourly cron — flush every pending nurture email whose scheduled_at <= now.
 *
 * Auth: same pattern as the rest of /api/cron — Vercel Cron sends
 * `Authorization: Bearer <CRON_SECRET>`. Manual triggers from /admin can
 * use `x-api-key: <INGESTION_API_KEY>`.
 */

function isAuthorized(request: Request): boolean {
  const bearer = request.headers.get("authorization");
  if (
    bearer &&
    process.env.CRON_SECRET &&
    bearer === `Bearer ${process.env.CRON_SECRET}`
  ) {
    return true;
  }
  const apiKey = request.headers.get("x-api-key");
  if (
    apiKey &&
    process.env.INGESTION_API_KEY &&
    apiKey === process.env.INGESTION_API_KEY
  ) {
    return true;
  }
  // In a fully-unconfigured local dev (no CRON_SECRET, no INGESTION_API_KEY)
  // the route is closed by default — set one to expose the endpoint.
  return false;
}

async function handle(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "RESEND_API_KEY not configured" },
      { status: 500 }
    );
  }

  const start = Date.now();
  try {
    const result = await processEmailQueue();
    const duration_ms = Date.now() - start;
    console.log("[CRON email-sequence]", {
      ...result,
      details: undefined, // keep logs short — full details in response body
      duration_ms,
    });
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration_ms,
      ...result,
    });
  } catch (err) {
    console.error("[CRON email-sequence] failed:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export const GET = handle;
export const POST = handle;
