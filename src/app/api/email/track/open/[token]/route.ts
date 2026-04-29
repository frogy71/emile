import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/email/track/open/[token]
 *
 * Tracking pixel endpoint. Returns a 1×1 transparent GIF and stamps
 * `opened_at` on the matching queue row (only if it's still null — we don't
 * want to overwrite the first-open timestamp on every load).
 */

// 43-byte 1×1 transparent GIF
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

function pixelResponse() {
  return new NextResponse(new Uint8Array(PIXEL), {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": String(PIXEL.length),
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
    },
  });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  if (!token) return pixelResponse();

  try {
    const supabase = getSupabase();
    await supabase
      .from("email_sequence_queue")
      .update({ opened_at: new Date().toISOString() })
      .eq("tracking_token", token)
      .is("opened_at", null);
  } catch (err) {
    // Tracking is best-effort. Never let a tracking failure block the
    // pixel — the user shouldn't see a broken image in their inbox.
    console.warn("[email-open]", err);
  }

  return pixelResponse();
}
