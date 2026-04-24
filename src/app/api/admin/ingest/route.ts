import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  runFullIngestion,
  runDailyIngestion,
  runIngestion,
  markExpiredGrants,
} from "@/lib/ingestion";

/**
 * POST /api/admin/ingest
 *
 * Admin-only endpoint to trigger ingestion on demand. Used by the admin
 * dashboard "Forcer mise à jour" button.
 *
 * Body:
 *   { mode: "full" | "daily" | "cleanup", sources?: string[] }
 *
 * - full     → every registered source
 * - daily    → only the fast sources (same as nightly cron)
 * - cleanup  → just mark expired grants
 * - sources  → optional list of source names to run (overrides mode)
 */

const ADMIN_EMAILS = ["francois@tresorier.co", "tresorier.francois@gmail.com"];

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export const maxDuration = 800;

export async function POST(request: Request) {
  const supabase = getSupabase();

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = authHeader.split("Bearer ")[1];
  const {
    data: { user },
  } = await supabase.auth.getUser(token);
  if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { mode?: string; sources?: string[] } = {};
  try {
    body = await request.json();
  } catch {
    // No body is fine — defaults to full
  }

  const start = Date.now();

  try {
    if (body.sources && body.sources.length > 0) {
      const report = await runIngestion({
        trigger: "admin",
        only: body.sources,
      });
      const expired = await markExpiredGrants();
      return NextResponse.json({
        success: true,
        mode: "custom",
        report,
        expired_marked: expired,
        duration_seconds: Math.round((Date.now() - start) / 1000),
      });
    }

    if (body.mode === "cleanup") {
      const expired = await markExpiredGrants();
      return NextResponse.json({
        success: true,
        mode: "cleanup",
        expired_marked: expired,
        duration_seconds: Math.round((Date.now() - start) / 1000),
      });
    }

    if (body.mode === "daily") {
      const report = await runDailyIngestion({ trigger: "admin" });
      const expired = await markExpiredGrants();
      return NextResponse.json({
        success: true,
        mode: "daily",
        report,
        expired_marked: expired,
        duration_seconds: Math.round((Date.now() - start) / 1000),
      });
    }

    // Default: full
    const report = await runFullIngestion({ trigger: "admin" });
    const expired = await markExpiredGrants();
    return NextResponse.json({
      success: true,
      mode: "full",
      report,
      expired_marked: expired,
      duration_seconds: Math.round((Date.now() - start) / 1000),
    });
  } catch (error) {
    console.error("[admin ingest] failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
