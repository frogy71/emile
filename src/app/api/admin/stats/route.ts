import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAILS = ["francois@tresorier.co"];

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
  // Monthly subscribers: plan_status='active' AND plan='monthly' => 79 EUR
  const { count: monthlyActive } = await supabase
    .from("organizations")
    .select("id", { count: "exact", head: true })
    .eq("plan_status", "active")
    .eq("plan", "monthly");

  // Annual subscribers: plan_status='active' AND plan='annual' => 59 EUR/mo equivalent
  const { count: annualActive } = await supabase
    .from("organizations")
    .select("id", { count: "exact", head: true })
    .eq("plan_status", "active")
    .eq("plan", "annual");

  const mrr = (monthlyActive || 0) * 79 + (annualActive || 0) * 59;

  const totalPayingOrgs = (monthlyActive || 0) + (annualActive || 0);

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

  return NextResponse.json({
    grants: {
      total: totalGrants || 0,
      active: activeGrants || 0,
      withDeadline: withDeadline || 0,
      withSummary: withSummary || 0,
    },
    users: {
      total: totalUsers,
      signupsThisWeek,
    },
    organizations: {
      total: totalOrganizations || 0,
      monthlyActive: monthlyActive || 0,
      annualActive: annualActive || 0,
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
    sources: sourceStats,
  });
}
