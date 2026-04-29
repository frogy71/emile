import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { enrichGrantsBatch } from "@/lib/ai/grant-enricher";

/**
 * CRON: enrichment drainer (Vercel cron, every 6h)
 *
 * Picks the next 50 grants where `enriched_at IS NULL` and runs the enricher
 * on them. The enricher itself only ever processes NULL rows and stamps
 * `enriched_at` even on failure, so a grant is touched at most once per its
 * lifetime — re-enrichment is opt-in and only via an admin trigger.
 *
 * Capacity math: 50 / run × 4 runs / day = 200 / day. With ~6,700 unenriched
 * rows at launch, the queue drains in ~5 weeks. Steady-state daily ingestion
 * adds 10-30 new grants / day, so the cron covers fresh ingest without ever
 * touching token-spent rows again.
 *
 * Auth: standard Vercel cron `Bearer ${CRON_SECRET}` header.
 */

const ENRICH_BATCH_SIZE = 50;
const BACKLOG_ALERT_THRESHOLD = 500;
const ALERT_COOLDOWN_HOURS = 24;
const ALERT_RECIPIENT =
  process.env.ENRICHMENT_ALERT_EMAIL ?? "tresorier.francois@gmail.com";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function handle(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  const startedAt = Date.now();

  // Pre-batch backlog snapshot (used both for the response and the alert).
  const { count: backlogBefore } = await supabase
    .from("grants")
    .select("id", { count: "exact", head: true })
    .is("enriched_at", null);

  let result: Awaited<ReturnType<typeof enrichGrantsBatch>>;
  try {
    result = await enrichGrantsBatch(ENRICH_BATCH_SIZE);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[CRON enrich] failed:", message);
    return NextResponse.json(
      { success: false, error: message, backlog: backlogBefore ?? null },
      { status: 500 }
    );
  }

  const { count: backlogAfter } = await supabase
    .from("grants")
    .select("id", { count: "exact", head: true })
    .is("enriched_at", null);

  // Backlog alert — fire only when over threshold AND we haven't alerted in
  // the last 24h. We track the last alert timestamp in a tiny key/value row
  // on `app_state` so the cooldown survives cold starts.
  let alertSent = false;
  if ((backlogAfter ?? 0) > BACKLOG_ALERT_THRESHOLD) {
    alertSent = await maybeSendBacklogAlert(supabase, backlogAfter ?? 0);
  }

  const duration_seconds = Math.round((Date.now() - startedAt) / 1000);
  console.log("[CRON enrich] complete", {
    processed: result.processed,
    ok: result.ok,
    failed: result.failed,
    backlogBefore,
    backlogAfter,
    duration_seconds,
    alertSent,
  });

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    duration_seconds,
    processed: result.processed,
    ok: result.ok,
    failed: result.failed,
    backlog_before: backlogBefore ?? null,
    backlog_after: backlogAfter ?? null,
    alert_sent: alertSent,
  });
}

/**
 * Stamp the last-alert timestamp in a single-row table so we don't spam.
 * Returns true when an alert was actually sent on this call.
 */
async function maybeSendBacklogAlert(
  supabase: ReturnType<typeof getSupabase>,
  backlog: number
): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;

  const { data: state } = await supabase
    .from("app_state")
    .select("value")
    .eq("key", "enrichment_backlog_alert_sent_at")
    .maybeSingle();

  const lastSent = state?.value ? new Date(state.value as string).getTime() : 0;
  const cooldownMs = ALERT_COOLDOWN_HOURS * 3600 * 1000;
  if (Date.now() - lastSent < cooldownMs) return false;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Emile <noreply@emile.app>",
      to: ALERT_RECIPIENT,
      subject: `⚠️ Enrichment backlog: ${backlog} grants`,
      text:
        `Le backlog d'enrichissement a atteint ${backlog} subventions non enrichies\n` +
        `(seuil d'alerte : ${BACKLOG_ALERT_THRESHOLD}).\n\n` +
        `Le cron tourne toutes les 6h et traite ${ENRICH_BATCH_SIZE} subventions / passage,\n` +
        `soit ${ENRICH_BATCH_SIZE * 4} / jour. Si le backlog ne baisse pas, une\n` +
        `nouvelle ingestion massive est probablement en cours, ou le cron est cassé.\n\n` +
        `Vérifier : ${process.env.NEXT_PUBLIC_APP_URL ?? "https://emile.app"}/admin\n`,
    });
    await supabase
      .from("app_state")
      .upsert(
        { key: "enrichment_backlog_alert_sent_at", value: new Date().toISOString() },
        { onConflict: "key" }
      );
    return true;
  } catch (e) {
    console.error("[CRON enrich] backlog alert send failed:", e);
    return false;
  }
}

export const GET = handle;
export const POST = handle;
// Sequential per-row enrichment with HTTP fetches + LLM call ≈ 5-10s each;
// 50 rows fit in 300s with buffer for retries.
export const maxDuration = 300;
