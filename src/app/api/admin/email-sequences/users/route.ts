import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";

/**
 * GET /api/admin/email-sequences/users — list users currently or previously
 * enrolled in the nurture sequence, with their progress.
 */

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  // Pull the queue grouped per user. We hand-aggregate in JS — even at
  // 50k rows this is < 50ms and avoids needing a DB view.
  const { data: rows, error } = await supabaseAdmin
    .from("email_sequence_queue")
    .select(
      "user_id, organization_id, step_number, scheduled_at, sent_at, opened_at, clicked_at, status"
    )
    .order("scheduled_at");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type UserAgg = {
    userId: string;
    organizationId: string | null;
    sentCount: number;
    openedCount: number;
    clickedCount: number;
    pendingCount: number;
    skippedCount: number;
    failedCount: number;
    totalSteps: number;
    currentStep: number; // highest sent step
    nextStep: number | null; // next pending step
    nextScheduledAt: string | null;
  };
  const byUser = new Map<string, UserAgg>();

  for (const r of rows ?? []) {
    let agg = byUser.get(r.user_id);
    if (!agg) {
      agg = {
        userId: r.user_id,
        organizationId: r.organization_id,
        sentCount: 0,
        openedCount: 0,
        clickedCount: 0,
        pendingCount: 0,
        skippedCount: 0,
        failedCount: 0,
        totalSteps: 0,
        currentStep: 0,
        nextStep: null,
        nextScheduledAt: null,
      };
      byUser.set(r.user_id, agg);
    }
    agg.totalSteps++;
    if (r.status === "sent") {
      agg.sentCount++;
      if (r.step_number > agg.currentStep) agg.currentStep = r.step_number;
    } else if (r.status === "pending") {
      agg.pendingCount++;
      if (agg.nextStep === null || r.step_number < agg.nextStep) {
        agg.nextStep = r.step_number;
        agg.nextScheduledAt = r.scheduled_at;
      }
    } else if (r.status === "skipped") agg.skippedCount++;
    else if (r.status === "failed") agg.failedCount++;
    if (r.opened_at) agg.openedCount++;
    if (r.clicked_at) agg.clickedCount++;
  }

  const userIds = Array.from(byUser.keys());
  const orgIds = Array.from(
    new Set(
      Array.from(byUser.values())
        .map((a) => a.organizationId)
        .filter((x): x is string => !!x)
    )
  );

  const orgById = new Map<
    string,
    { name: string | null; plan: string | null; plan_status: string | null }
  >();
  if (orgIds.length > 0) {
    const { data: orgs } = await supabaseAdmin
      .from("organizations")
      .select("id, name, plan, plan_status")
      .in("id", orgIds);
    for (const o of orgs ?? []) {
      orgById.set(o.id, {
        name: o.name ?? null,
        plan: o.plan ?? null,
        plan_status: o.plan_status ?? null,
      });
    }
  }

  // Resolve user emails. listUsers maxes at 1000 / page.
  const { data: userList } = await supabaseAdmin.auth.admin.listUsers({
    perPage: 1000,
  });
  const userById = new Map<
    string,
    { email: string | null; created_at: string | null }
  >();
  for (const u of userList?.users ?? []) {
    if (userIds.includes(u.id)) {
      userById.set(u.id, {
        email: u.email ?? null,
        created_at: u.created_at,
      });
    }
  }

  const result = Array.from(byUser.values())
    .map((a) => {
      const user = userById.get(a.userId);
      const org = a.organizationId ? orgById.get(a.organizationId) : null;
      const openRate = a.sentCount > 0 ? a.openedCount / a.sentCount : 0;
      return {
        userId: a.userId,
        email: user?.email ?? null,
        signupDate: user?.created_at ?? null,
        organizationId: a.organizationId,
        organizationName: org?.name ?? null,
        plan: org?.plan ?? "free",
        planStatus: org?.plan_status ?? "free",
        currentStep: a.currentStep,
        nextStep: a.nextStep,
        nextScheduledAt: a.nextScheduledAt,
        sentCount: a.sentCount,
        openedCount: a.openedCount,
        clickedCount: a.clickedCount,
        pendingCount: a.pendingCount,
        skippedCount: a.skippedCount,
        failedCount: a.failedCount,
        totalSteps: a.totalSteps,
        openRate: Math.round(openRate * 100),
      };
    })
    .sort((a, b) => {
      // Pending users first (active in sequence), most recent activity first
      if (a.pendingCount > 0 && b.pendingCount === 0) return -1;
      if (a.pendingCount === 0 && b.pendingCount > 0) return 1;
      return (b.signupDate || "").localeCompare(a.signupDate || "");
    });

  return NextResponse.json({ users: result });
}
