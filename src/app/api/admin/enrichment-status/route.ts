import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { enrichGrantsBatch } from "@/lib/ai/grant-enricher";

/**
 * GET  /api/admin/enrichment-status   — dashboard widget data
 * POST /api/admin/enrichment-status   — manual trigger ("Lancer l'enrichissement")
 *
 * Returns counts (enriched / unenriched / total) plus recent enrichment
 * timestamps so the admin dashboard can show progress.
 *
 * Admin-only: gated by the same email allowlist as the other /api/admin
 * routes.
 */

const ADMIN_EMAILS = ["francois@tresorier.co", "tresorier.francois@gmail.com"];
const MANUAL_BATCH_SIZE = 50;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function requireAdmin(request: Request) {
  const supabase = getSupabase();
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false as const, status: 401, error: "Unauthorized", supabase };
  }
  const token = authHeader.split("Bearer ")[1];
  const {
    data: { user },
  } = await supabase.auth.getUser(token);
  if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
    return { ok: false as const, status: 403, error: "Forbidden", supabase };
  }
  return { ok: true as const, supabase };
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const supabase = auth.supabase;

  const { count: total } = await supabase
    .from("grants")
    .select("id", { count: "exact", head: true });

  const { count: enriched } = await supabase
    .from("grants")
    .select("id", { count: "exact", head: true })
    .not("enriched_at", "is", null);

  const { count: unenriched } = await supabase
    .from("grants")
    .select("id", { count: "exact", head: true })
    .is("enriched_at", null);

  const { data: lastEnriched } = await supabase
    .from("grants")
    .select("enriched_at")
    .not("enriched_at", "is", null)
    .order("enriched_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const totalNum = total ?? 0;
  const enrichedNum = enriched ?? 0;
  const unenrichedNum = unenriched ?? 0;
  const pct = totalNum > 0 ? Math.round((enrichedNum / totalNum) * 100) : 0;

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    total: totalNum,
    enriched: enrichedNum,
    unenriched: unenrichedNum,
    progress_pct: pct,
    last_enriched_at: lastEnriched?.enriched_at ?? null,
    backlog_warning: unenrichedNum > 100,
    backlog_critical: unenrichedNum > 500,
  });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const startedAt = Date.now();
  try {
    const r = await enrichGrantsBatch(MANUAL_BATCH_SIZE);
    return NextResponse.json({
      success: true,
      processed: r.processed,
      ok: r.ok,
      failed: r.failed,
      duration_seconds: Math.round((Date.now() - startedAt) / 1000),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export const maxDuration = 300;
