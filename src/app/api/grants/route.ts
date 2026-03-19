import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * GET /api/grants — list grants with filters
 *
 * Filters:
 * - q: search text (title, funder, summary)
 * - country: FR, EU
 * - type: public, private, fondation, all
 * - territory: territory filter for AT grants
 * - theme: thematic area filter
 * - status: active (default), expired, forthcoming
 * - limit, offset: pagination
 */
export async function GET(request: Request) {
  const supabase = getSupabase();
  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country");
  const search = searchParams.get("q");
  const type = searchParams.get("type"); // public, private, fondation
  const territory = searchParams.get("territory");
  const theme = searchParams.get("theme");
  const status = searchParams.get("status") || "active";
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  let query = supabase
    .from("grants")
    .select("*", { count: "exact" })
    .eq("status", status)
    .order("deadline", { ascending: true, nullsFirst: false })
    .range(offset, offset + limit - 1);

  // Country filter
  if (country) {
    query = query.eq("country", country);
  }

  // Type filter: public vs private vs fondation
  if (type === "public") {
    // Public grants: Aides-Territoires, FDVA, ministères
    query = query.in("source_name", [
      "Aides-Territoires",
      "FDVA",
      "Service Civique",
      "Ministère de la Culture",
      "Ministère Écologie",
    ]);
  } else if (type === "private" || type === "fondation") {
    // Private/foundation grants
    query = query.in("source_name", [
      "data.gouv.fr — FRUP",
      "data.gouv.fr — Fondations entreprises",
      "Fondations françaises",
      "Fondation de France",
    ]);
  } else if (type === "eu") {
    // EU grants
    query = query.eq("source_name", "EU Funding & Tenders");
  }

  // Text search
  if (search) {
    query = query.or(
      `title.ilike.%${search}%,funder.ilike.%${search}%,summary.ilike.%${search}%`
    );
  }

  // Territory filter (search in summary/raw_content for territory names)
  if (territory) {
    query = query.or(
      `summary.ilike.%${territory}%,raw_content.ilike.%${territory}%,title.ilike.%${territory}%,funder.ilike.%${territory}%`
    );
  }

  // Theme filter (search in thematic_areas array)
  if (theme) {
    query = query.contains("thematic_areas", [theme]);
  }

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    grants: data || [],
    total: count || 0,
    limit,
    offset,
    filters: { country, type, territory, theme, search, status },
  });
}
