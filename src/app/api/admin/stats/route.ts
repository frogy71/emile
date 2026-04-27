import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAiCostSummary } from "@/lib/ai/usage-tracker";

const ADMIN_EMAILS = ["francois@tresorier.co", "tresorier.francois@gmail.com"];

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export async function GET(request: Request) {
  const supabase = getSupabase();

  // --- Auth check: verify admin email via Authorization header (Bearer token) ---
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split("Bearer ")[1];
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user || !ADMIN_EMAILS.includes(user.email || "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // --- Grants stats ---
  const { count: totalGrants } = await supabase
    .from("grants")
    .select("id", { count: "exact", head: true });

  const { count: activeGrants } = await supabase
    .from("grants")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  const { count: withDeadline } = await supabase
    .from("grants")
    .select("id", { count: "exact", head: true })
    .not("deadline", "is", null);

  const { count: withSummary } = await supabase
    .from("grants")
    .select("id", { count: "exact", head: true })
    .not("summary", "is", null);

  // --- Users (auth admin API) ---
  const {
    data: { users },
  } = await supabase.auth.admin.listUsers({ perPage: 1000 });

  const totalUsers = users?.length || 0;

  // Signups this week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const signupsThisWeek =
    users?.filter(
      (u) => new Date(u.created_at) >= oneWeekAgo
    ).length || 0;

  // --- Organizations ---
  const { count: totalOrganizations } = await supabase
    .from("organizations")
    .select("id", { count: "exact", head: true });

  // --- Projects ---
  const { count: totalProjects } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true });

  // --- Proposals ---
  const { count: totalProposals } = await supabase
    .from("proposals")
    .select("id", { count: "exact", head: true });

  // --- Match Scores ---
  const { count: totalMatchScores } = await supabase
    .from("match_scores")
    .select("id", { count: "exact", head: true });

  // --- MRR calculation ---
  // Pro subscribers: plan_status='active' AND plan='pro' => 79 EUR/mo
  const { count: proActive } = await supabase
    .from("organizations")
    .select("id", { count: "exact", head: true })
    .eq("plan_status", "active")
    .eq("plan", "pro");

  // Expert subscribers: plan_status='active' AND plan='expert' => 199 EUR/mo
  const { count: expertActive } = await supabase
    .from("organizations")
    .select("id", { count: "exact", head: true })
    .eq("plan_status", "active")
    .eq("plan", "expert");

  const mrr = (proActive || 0) * 79 + (expertActive || 0) * 199;

  const totalPayingOrgs = (proActive || 0) + (expertActive || 0);

  // Conversion rate: paying orgs / total users
  const conversionRate =
    totalUsers > 0 ? Math.round((totalPayingOrgs / totalUsers) * 100 * 10) / 10 : 0;

  // --- Sources (reuse same logic as /api/sources) ---
  const sourceNames = [
    "Aides-Territoires",
    "data.gouv.fr \u2014 FRUP",
    "data.gouv.fr \u2014 Fondations entreprises",
    "EU Funding & Tenders",
    "Fondations fran\u00e7aises",
    "FDVA",
    "Fondation de France",
    "Service Civique",
    "Minist\u00e8re de la Culture",
    "Minist\u00e8re \u00c9cologie",
  ];

  const sourceStats = [];

  for (const src of sourceNames) {
    const { count } = await supabase
      .from("grants")
      .select("id", { count: "exact", head: true })
      .eq("source_name", src);

    const { data: latest } = await supabase
      .from("grants")
      .select("updated_at")
      .eq("source_name", src)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    if (count && count > 0) {
      const method =
        src === "Aides-Territoires"
          ? "API (JWT)"
          : src.startsWith("data.gouv.fr")
            ? "API (open data download)"
            : src === "EU Funding & Tenders"
              ? "curated (API SEDIA en investigation)"
              : "curated";

      const frequency =
        src === "Aides-Territoires"
          ? "daily"
          : src.startsWith("data.gouv.fr")
            ? "monthly"
            : src === "EU Funding & Tenders"
              ? "weekly"
              : "quarterly";

      sourceStats.push({
        name: src,
        method,
        frequency,
        grantCount: count,
        lastUpdate: latest?.updated_at || null,
        reliability: method.includes("API") ? "high" : "medium",
      });
    }
  }

  // --- AI cost summary (tolerant — table may not exist yet on fresh installs) ---
  let aiCost = null;
  try {
    aiCost = await getAiCostSummary();
  } catch (e) {
    console.warn("AI cost summary unavailable:", e);
  }

  // --- 14-day conversion cohort ---
  // Among users who signed up >14d ago, what % have a paying plan today?
  // (Imperfect — a user who converted on day 3 then cancelled will still
  // count as non-converted today. Good enough for directional signal.)
  let conversion14d = null;
  try {
    const now = Date.now();
    const fourteenDaysAgo = new Date(now - 14 * 86400_000);
    const eligibleCohort = (users || []).filter(
      (u) => new Date(u.created_at) <= fourteenDaysAgo
    );
    if (eligibleCohort.length > 0) {
      const eligibleIds = eligibleCohort.map((u) => u.id);
      const { data: converted } = await supabase
        .from("organizations")
        .select("user_id, plan_started_at")
        .in("user_id", eligibleIds)
        .eq("plan_status", "active");
      const convertedCount = (converted || []).length;
      conversion14d = {
        cohortSize: eligibleCohort.length,
        converted: convertedCount,
        rate:
          Math.round((convertedCount / eligibleCohort.length) * 1000) / 10,
      };
    } else {
      conversion14d = { cohortSize: 0, converted: 0, rate: 0 };
    }
  } catch (e) {
    console.warn("14-day conversion unavailable:", e);
  }

  // --- Churn M2 ---
  // Among orgs that started paying between 60 and 90 days ago, what % have
  // since cancelled? Gives us a trailing "month 2" churn signal.
  let churnM2 = null;
  try {
    const now = Date.now();
    const ninety = new Date(now - 90 * 86400_000).toISOString();
    const sixty = new Date(now - 60 * 86400_000).toISOString();
    const { data: startedOrgs } = await supabase
      .from("organizations")
      .select("id, plan_status, plan_cancelled_at, plan_started_at")
      .gte("plan_started_at", ninety)
      .lte("plan_started_at", sixty);
    const cohort = startedOrgs || [];
    const cancelled = cohort.filter(
      (o) => o.plan_status !== "active" || !!o.plan_cancelled_at
    ).length;
    churnM2 = {
      cohortSize: cohort.length,
      cancelled,
      rate:
        cohort.length > 0
          ? Math.round((cancelled / cohort.length) * 1000) / 10
          : 0,
    };
  } catch (e) {
    console.warn("Churn M2 unavailable:", e);
  }

  // --- Partnerships tracker ---
  let partnerships: {
    id: string;
    name: string;
    type: string;
    status: string;
    signedAt: string | null;
  }[] = [];
  let partnershipsStats = { signed: 0, discussing: 0, prospect: 0 };
  try {
    const { data: pRows } = await supabase
      .from("partnerships")
      .select("id, name, type, status, signed_at")
      .order("created_at", { ascending: false })
      .limit(50);
    partnerships =
      pRows?.map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        status: p.status,
        signedAt: p.signed_at,
      })) ?? [];
    partnershipsStats = {
      signed: partnerships.filter((p) => p.status === "signed").length,
      discussing: partnerships.filter((p) => p.status === "discussing").length,
      prospect: partnerships.filter((p) => p.status === "prospect").length,
    };
  } catch (e) {
    console.warn("Partnerships tracker unavailable:", e);
  }

  return NextResponse.json({
    grants: {
      total: totalGrants || 0,
      active: activeGrants || 0,
      withDeadline: withDeadline || 0,
      withSummary: withSummary || 0,
    },
    aiCost,
    users: {
      total: totalUsers,
      signupsThisWeek,
    },
    organizations: {
      total: totalOrganizations || 0,
      proActive: proActive || 0,
      expertActive: expertActive || 0,
    },
    projects: {
      total: totalProjects || 0,
    },
    proposals: {
      total: totalProposals || 0,
    },
    matchScores: {
      total: totalMatchScores || 0,
    },
    revenue: {
      mrr,
      conversionRate,
      totalPayingOrgs,
    },
    kpis: {
      conversion14d,
      churnM2,
      partnerships: partnershipsStats,
    },
    partnerships,
    sources: sourceStats,
  });
}
