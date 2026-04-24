import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/admin/foundation-health
 *
 * Per-foundation portal health + lifecycle stats for AAP. Feeds the
 * "Fondations privées — portails" section in the admin dashboard.
 *
 * Returns for each crawled foundation:
 *   - last crawl timestamp, reachability, health label
 *   - active AAP count, total AAP count (all time)
 *   - # events by type over the last 30 days (opened / closed / etc.)
 *   - recent lifecycle events (top 5)
 *
 * Plus a global "lifecycleSummary" — counts of open AAP, closing-soon
 * AAP, closed-this-month AAP, etc.
 */

const ADMIN_EMAILS = ["francois@tresorier.co", "tresorier.francois@gmail.com"];

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

type EventType =
  | "opened"
  | "still_open"
  | "deadline_changed"
  | "closing_soon"
  | "disappeared"
  | "closed"
  | "reopened";

interface HealthRow {
  funder: string;
  portal_url: string;
  last_crawled_at: string | null;
  last_success_at: string | null;
  last_reachable: boolean;
  active_calls_count: number;
  empty_crawls_in_a_row: number | null;
  health: "healthy" | "no_calls" | "unreachable" | "unknown";
  last_error: string | null;
  updated_at: string;
}

interface EventRow {
  id: string;
  grant_id: string;
  event_type: EventType;
  detected_at: string;
  previous_status: string | null;
  new_status: string | null;
  notes: string | null;
  grants?: { title: string; funder: string } | null;
}

export async function GET(request: Request) {
  const supabase = getSupabase();

  // Auth
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

  // ── Per-portal health rollup ────────────────────────────────
  const { data: healthRaw } = await supabase
    .from("foundation_portal_health")
    .select("*")
    .order("last_crawled_at", { ascending: false });
  const health = (healthRaw ?? []) as HealthRow[];

  // ── Lifecycle events (last 30 days, aggregated per funder) ──
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const { data: eventsRaw } = await supabase
    .from("grant_lifecycle_events")
    .select(
      `
      id, grant_id, event_type, detected_at, previous_status, new_status, notes,
      grants ( title, funder )
    `
    )
    .gte("detected_at", since)
    .order("detected_at", { ascending: false })
    .limit(500);
  const events = (eventsRaw ?? []) as unknown as EventRow[];

  // Per-funder event counts
  const perFunder = new Map<
    string,
    {
      opened: number;
      closed: number;
      disappeared: number;
      reopened: number;
      closingSoon: number;
      deadlineChanged: number;
      lastEventAt: string | null;
    }
  >();
  for (const e of events) {
    const funder = e.grants?.funder;
    if (!funder) continue;
    if (!perFunder.has(funder)) {
      perFunder.set(funder, {
        opened: 0,
        closed: 0,
        disappeared: 0,
        reopened: 0,
        closingSoon: 0,
        deadlineChanged: 0,
        lastEventAt: null,
      });
    }
    const row = perFunder.get(funder)!;
    if (e.event_type === "opened") row.opened += 1;
    else if (e.event_type === "closed") row.closed += 1;
    else if (e.event_type === "disappeared") row.disappeared += 1;
    else if (e.event_type === "reopened") row.reopened += 1;
    else if (e.event_type === "closing_soon") row.closingSoon += 1;
    else if (e.event_type === "deadline_changed") row.deadlineChanged += 1;
    if (!row.lastEventAt || e.detected_at > row.lastEventAt)
      row.lastEventAt = e.detected_at;
  }

  const portals = health.map((h) => {
    const events30d = perFunder.get(h.funder);
    return {
      funder: h.funder,
      portalUrl: h.portal_url,
      lastCrawledAt: h.last_crawled_at,
      lastSuccessAt: h.last_success_at,
      lastReachable: h.last_reachable,
      activeCalls: h.active_calls_count,
      health: h.health,
      lastError: h.last_error,
      emptyCrawlsInARow: h.empty_crawls_in_a_row ?? 0,
      events30d: events30d
        ? {
            opened: events30d.opened,
            closed: events30d.closed,
            disappeared: events30d.disappeared,
            reopened: events30d.reopened,
            closingSoon: events30d.closingSoon,
            deadlineChanged: events30d.deadlineChanged,
            lastEventAt: events30d.lastEventAt,
          }
        : null,
    };
  });

  // ── Global lifecycle summary ────────────────────────────────
  // Count all "Fondations privées — appels actifs" grants by status.
  const { count: totalCalls } = await supabase
    .from("grants")
    .select("id", { count: "exact", head: true })
    .eq("source_name", "Fondations privées — appels actifs");
  const { count: activeCalls } = await supabase
    .from("grants")
    .select("id", { count: "exact", head: true })
    .eq("source_name", "Fondations privées — appels actifs")
    .eq("status", "active");

  // Closing soon = active with deadline ≤ 14 days ahead
  const in14Days = new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString();
  const { count: closingSoon } = await supabase
    .from("grants")
    .select("id", { count: "exact", head: true })
    .eq("source_name", "Fondations privées — appels actifs")
    .eq("status", "active")
    .lte("deadline", in14Days)
    .gt("deadline", new Date().toISOString());

  // Count event types over 30 days globally
  const counts30d = {
    opened: 0,
    closed: 0,
    disappeared: 0,
    reopened: 0,
    closingSoon: 0,
    deadlineChanged: 0,
  };
  for (const e of events) {
    if (e.event_type === "opened") counts30d.opened += 1;
    else if (e.event_type === "closed") counts30d.closed += 1;
    else if (e.event_type === "disappeared") counts30d.disappeared += 1;
    else if (e.event_type === "reopened") counts30d.reopened += 1;
    else if (e.event_type === "closing_soon") counts30d.closingSoon += 1;
    else if (e.event_type === "deadline_changed") counts30d.deadlineChanged += 1;
  }

  // ── Recent events timeline (top 25, for the admin feed) ─────
  const recentEvents = events.slice(0, 25).map((e) => ({
    id: e.id,
    grantId: e.grant_id,
    eventType: e.event_type,
    detectedAt: e.detected_at,
    previousStatus: e.previous_status,
    newStatus: e.new_status,
    notes: e.notes,
    grantTitle: e.grants?.title ?? null,
    funder: e.grants?.funder ?? null,
  }));

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    totals: {
      totalPortals: health.length,
      healthyPortals: health.filter((h) => h.health === "healthy").length,
      noCallsPortals: health.filter((h) => h.health === "no_calls").length,
      unreachablePortals: health.filter((h) => h.health === "unreachable")
        .length,
      totalCalls: totalCalls || 0,
      activeCalls: activeCalls || 0,
      closingSoonCalls: closingSoon || 0,
    },
    counts30d,
    portals,
    recentEvents,
  });
}
