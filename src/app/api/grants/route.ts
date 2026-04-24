import { NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type GrantFilters = {
  country: string | null;
  search: string | null;
  type: string | null;
  territory: string | null;
  theme: string | null;
  status: string;
  limit: number;
  offset: number;
};

/**
 * Build a filtered grants query. `disabled` lists filter keys to skip — used
 * by the progressive relaxation strategy below to retry searches with fewer
 * filters until we can surface something useful to the user.
 */
function buildQuery(
  supabase: SupabaseClient,
  f: GrantFilters,
  disabled: Set<string> = new Set()
) {
  let query = supabase
    .from("grants")
    .select("*", { count: "exact" })
    .eq("status", f.status)
    .order("deadline", { ascending: true, nullsFirst: false })
    .range(f.offset, f.offset + f.limit - 1);

  if (f.country && !disabled.has("country")) {
    query = query.eq("country", f.country);
  }

  if (!disabled.has("type")) {
    if (f.type === "public") {
      query = query.in("source_name", [
        "Aides-Territoires",
        "FDVA",
        "Service Civique",
        "Ministère de la Culture",
        "Ministère Écologie",
        "ANS — Agence nationale du sport",
        "ADEME — Agir pour la transition",
      ]);
    } else if (f.type === "private" || f.type === "fondation") {
      query = query.in("source_name", [
        "data.gouv.fr — FRUP",
        "data.gouv.fr — Fondations entreprises",
        "Fondations françaises",
        "Fondation de France",
        "BPI France",
      ]);
    } else if (f.type === "eu") {
      query = query.eq("source_name", "EU Funding & Tenders");
    }
  }

  if (f.search && !disabled.has("search")) {
    query = query.or(
      `title.ilike.%${f.search}%,funder.ilike.%${f.search}%,summary.ilike.%${f.search}%`
    );
  }

  if (f.territory && !disabled.has("territory")) {
    query = query.or(
      `summary.ilike.%${f.territory}%,raw_content.ilike.%${f.territory}%,title.ilike.%${f.territory}%,funder.ilike.%${f.territory}%`
    );
  }

  if (f.theme && !disabled.has("theme")) {
    query = query.contains("thematic_areas", [f.theme]);
  }

  return query;
}

/**
 * Progressive filter relaxation — "never show zero grants" UX guarantee.
 *
 * When the user's strict query returns 0 matches, we don't leave them with
 * an empty page: we retry with the theme dropped first (it's the most
 * specific filter), then territory, then search, then type. The first
 * non-empty run wins and its dropped filter list is returned so the UI can
 * show a banner ("search broadened: removed theme").
 *
 * Country is never dropped — a French NGO shouldn't suddenly see US grants.
 */
const RELAXATION_LEVELS: { drop: string[]; labelFr: string }[] = [
  { drop: ["theme"], labelFr: "thème" },
  { drop: ["theme", "territory"], labelFr: "thème + territoire" },
  { drop: ["theme", "territory", "search"], labelFr: "thème + territoire + recherche" },
  { drop: ["theme", "territory", "search", "type"], labelFr: "tous filtres sauf pays" },
];

/**
 * GET /api/grants — list grants with filters
 *
 * Filters:
 * - q: search text (title, funder, summary)
 * - country: FR, EU
 * - type: public, private, fondation, eu
 * - territory: territory filter
 * - theme: thematic area filter
 * - status: active (default), expired, forthcoming
 * - limit, offset: pagination
 *
 * Response:
 * - grants, total: current page + count
 * - relaxed: boolean — true if we dropped filters to find results
 * - relaxedFilters: string[] — filter keys that were dropped (theme, territory…)
 * - relaxedLabel: human label ("thème", "thème + territoire", …)
 */
export async function GET(request: Request) {
  const supabase = getSupabase();
  const { searchParams } = new URL(request.url);

  const filters: GrantFilters = {
    country: searchParams.get("country"),
    search: searchParams.get("q"),
    type: searchParams.get("type"),
    territory: searchParams.get("territory"),
    theme: searchParams.get("theme"),
    status: searchParams.get("status") || "active",
    limit: parseInt(searchParams.get("limit") || "50"),
    offset: parseInt(searchParams.get("offset") || "0"),
  };

  // Attempt 1: strict query with all requested filters.
  const strict = await buildQuery(supabase, filters);
  const { data: strictData, count: strictCount, error: strictError } = strict;

  if (strictError) {
    return NextResponse.json({ error: strictError.message }, { status: 500 });
  }

  // Has at least one active filter beyond country+status? If not, nothing to relax.
  const hasNarrowingFilters =
    filters.search || filters.type || filters.territory || filters.theme;

  if ((strictCount || 0) > 0 || !hasNarrowingFilters) {
    return NextResponse.json({
      grants: strictData || [],
      total: strictCount || 0,
      limit: filters.limit,
      offset: filters.offset,
      filters: {
        country: filters.country,
        type: filters.type,
        territory: filters.territory,
        theme: filters.theme,
        search: filters.search,
        status: filters.status,
      },
      relaxed: false,
    });
  }

  // Attempt 2+: progressive relaxation — drop filters until we find something.
  // Only drop filters that are actually set (no point dropping an unset filter).
  for (const level of RELAXATION_LEVELS) {
    const disabled = new Set(
      level.drop.filter((key) => {
        const v = filters[key as keyof GrantFilters];
        return typeof v === "string" && v.length > 0;
      })
    );

    // If this level doesn't actually drop anything new, skip it.
    if (disabled.size === 0) continue;

    const relaxed = await buildQuery(supabase, filters, disabled);
    const { data, count, error } = relaxed;

    if (error) continue;
    if ((count || 0) === 0) continue;

    return NextResponse.json({
      grants: data || [],
      total: count || 0,
      limit: filters.limit,
      offset: filters.offset,
      filters: {
        country: filters.country,
        type: filters.type,
        territory: filters.territory,
        theme: filters.theme,
        search: filters.search,
        status: filters.status,
      },
      relaxed: true,
      relaxedFilters: Array.from(disabled),
      relaxedLabel: level.labelFr,
    });
  }

  // Genuinely nothing matches even at the loosest level → return empty honestly.
  return NextResponse.json({
    grants: [],
    total: 0,
    limit: filters.limit,
    offset: filters.offset,
    filters: {
      country: filters.country,
      type: filters.type,
      territory: filters.territory,
      theme: filters.theme,
      search: filters.search,
      status: filters.status,
    },
    relaxed: false,
  });
}
