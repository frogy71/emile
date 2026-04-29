import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";

/**
 * GET /api/admin/email-sequences/dashboard
 *
 * Aggregates everything the admin dashboard block needs in one round-trip:
 *   - Free → Pro conversion rate (30 days + all time)
 *   - Users in sequence vs completed without converting
 *   - Per-step funnel (sent / opened / clicked / converted)
 *   - 90-day daily series of signups vs conversions
 */

interface ConversionPoint {
  date: string;
  signups: number;
  conversions: number;
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  // --- Users (Auth admin API) ---
  const { data: userList } = await supabaseAdmin.auth.admin.listUsers({
    perPage: 1000,
  });
  const users = userList?.users ?? [];
  const userById = new Map<string, { created_at: string }>();
  for (const u of users) userById.set(u.id, { created_at: u.created_at });

  // --- Organisations ---
  const { data: orgs } = await supabaseAdmin
    .from("organizations")
    .select("id, user_id, plan, plan_status, plan_started_at, created_at");
  const orgRows = orgs ?? [];

  // --- Queue rows (everything; needed for funnel + per-user state) ---
  const { data: queue } = await supabaseAdmin
    .from("email_sequence_queue")
    .select(
      "user_id, step_number, status, sent_at, opened_at, clicked_at, scheduled_at"
    );
  const queueRows = queue ?? [];

  // --- Conversion (all-time + last 30 days) ---
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 86400_000;

  const totalUsers = users.length;
  const totalConverted = orgRows.filter(
    (o) => o.plan_status === "active" && o.plan !== "free"
  ).length;
  const conversionAllTime =
    totalUsers > 0 ? +(totalConverted / totalUsers * 100).toFixed(1) : 0;

  const recentUsers = users.filter(
    (u) => new Date(u.created_at).getTime() >= thirtyDaysAgo
  );
  const recentUserIds = new Set(recentUsers.map((u) => u.id));
  const recentConverted = orgRows.filter(
    (o) =>
      recentUserIds.has(o.user_id) &&
      o.plan_status === "active" &&
      o.plan !== "free"
  ).length;
  const conversion30d =
    recentUsers.length > 0
      ? +(recentConverted / recentUsers.length * 100).toFixed(1)
      : 0;

  // --- Sequence cohort: users who got at least one queue row ---
  const enrolledUserIds = new Set(queueRows.map((q) => q.user_id));
  const enrolledOrgs = orgRows.filter((o) => enrolledUserIds.has(o.user_id));

  let usersInSequence = 0;
  let usersCompleted = 0;
  let usersConvertedFromSequence = 0;

  // Group queue rows per user once.
  const queueByUser = new Map<string, typeof queueRows>();
  for (const q of queueRows) {
    if (!queueByUser.has(q.user_id)) queueByUser.set(q.user_id, []);
    queueByUser.get(q.user_id)!.push(q);
  }

  for (const userId of enrolledUserIds) {
    const userQueue = queueByUser.get(userId) ?? [];
    const hasPending = userQueue.some((q) => q.status === "pending");
    const userOrg = enrolledOrgs.find((o) => o.user_id === userId);
    const converted =
      userOrg?.plan_status === "active" && userOrg.plan !== "free";

    if (converted) usersConvertedFromSequence++;
    else if (hasPending) usersInSequence++;
    else usersCompleted++;
  }

  // --- Per-step funnel ---
  // For each step, count: sent / opened / clicked, plus how many of those
  // recipients eventually converted (regardless of attribution timing).
  type StepFunnel = {
    step: number;
    sent: number;
    opened: number;
    clicked: number;
    converted: number;
  };
  const stepFunnels = new Map<number, StepFunnel>();
  const convertedUserIds = new Set(
    enrolledOrgs
      .filter((o) => o.plan_status === "active" && o.plan !== "free")
      .map((o) => o.user_id)
  );

  for (const q of queueRows) {
    const f = stepFunnels.get(q.step_number) || {
      step: q.step_number,
      sent: 0,
      opened: 0,
      clicked: 0,
      converted: 0,
    };
    if (q.status === "sent") f.sent++;
    if (q.opened_at) f.opened++;
    if (q.clicked_at) f.clicked++;
    if (
      q.status === "sent" &&
      convertedUserIds.has(q.user_id)
    )
      f.converted++;
    stepFunnels.set(q.step_number, f);
  }

  const perStep = Array.from(stepFunnels.values()).sort(
    (a, b) => a.step - b.step
  );

  // --- 90-day chart: signups vs conversions per day ---
  const ninetyDaysAgo = now - 90 * 86400_000;
  const dayKey = (ts: number) => new Date(ts).toISOString().slice(0, 10);
  const series = new Map<string, ConversionPoint>();
  // Pre-fill every day so a sparse week doesn't draw a gap.
  for (let d = ninetyDaysAgo; d <= now; d += 86400_000) {
    series.set(dayKey(d), { date: dayKey(d), signups: 0, conversions: 0 });
  }
  for (const u of users) {
    const ts = new Date(u.created_at).getTime();
    if (ts >= ninetyDaysAgo) {
      const k = dayKey(ts);
      const p = series.get(k);
      if (p) p.signups++;
    }
  }
  for (const o of orgRows) {
    if (o.plan_status === "active" && o.plan !== "free" && o.plan_started_at) {
      const ts = new Date(o.plan_started_at).getTime();
      if (ts >= ninetyDaysAgo) {
        const k = dayKey(ts);
        const p = series.get(k);
        if (p) p.conversions++;
      }
    }
  }
  const chart = Array.from(series.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  return NextResponse.json({
    conversion: {
      allTime: {
        totalUsers,
        converted: totalConverted,
        rate: conversionAllTime,
      },
      last30d: {
        totalUsers: recentUsers.length,
        converted: recentConverted,
        rate: conversion30d,
      },
    },
    sequence: {
      enrolled: enrolledUserIds.size,
      inSequence: usersInSequence,
      completed: usersCompleted,
      converted: usersConvertedFromSequence,
    },
    perStep,
    chart,
  });
}
