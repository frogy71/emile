import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/sources — Status of all data sources
 * Shows: source name, method, grant count, last update, freshness
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const sources = [
    "Aides-Territoires",
    "data.gouv.fr — FRUP",
    "data.gouv.fr — Fondations entreprises",
    "EU Funding & Tenders",
    "Fondations françaises",
    "FDVA",
    "Fondation de France",
    "Service Civique",
    "Ministère de la Culture",
    "Ministère Écologie",
  ];

  const sourceStats = [];

  for (const src of sources) {
    // Count grants
    const { count } = await supabase
      .from("grants")
      .select("id", { count: "exact", head: true })
      .eq("source_name", src);

    // Get latest update
    const { data: latest } = await supabase
      .from("grants")
      .select("updated_at")
      .eq("source_name", src)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    if (count && count > 0) {
      const method = src === "Aides-Territoires" ? "API (JWT)" :
        src.startsWith("data.gouv.fr") ? "API (open data download)" :
        src === "EU Funding & Tenders" ? "curated (API SEDIA en investigation)" :
        "curated";

      const frequency = src === "Aides-Territoires" ? "daily" :
        src.startsWith("data.gouv.fr") ? "monthly" :
        src === "EU Funding & Tenders" ? "weekly" :
        "quarterly";

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

  // Total
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

  return NextResponse.json({
    total: totalGrants,
    active: activeGrants,
    withDeadline,
    withSummary,
    sources: sourceStats,
    cronSchedule: "Daily at 6am UTC (Aides-Territoires)",
    nextFeatures: [
      "EU SEDIA API integration (in progress)",
      "Fondation de France scraping (planned)",
      "CFF directory (planned, requires paid access)",
    ],
  });
}
