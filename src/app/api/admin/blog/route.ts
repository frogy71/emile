import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { getWritablePoolSize } from "@/lib/blog/selector";

/**
 * GET /api/admin/blog
 *   Query params:
 *     ?status=draft|published|scheduled|all (default: all)
 *     ?q=... (title/slug search)
 *     ?page=1
 *
 *   Returns the article list + headline KPIs (total, drafts, published,
 *   total views, avg CTR, writable-pool size).
 */

const PAGE_SIZE = 30;

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "all";
  const q = url.searchParams.get("q")?.trim() || "";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabaseAdmin
    .from("blog_posts")
    .select(
      "id, slug, title, status, thematic_tag, view_count, cta_clicks, word_count, published_at, created_at, updated_at, cover_image_url",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status !== "all") {
    query = query.eq("status", status);
  }
  if (q) {
    // Match either title or slug, ILIKE is the simplest portable option.
    query = query.or(`title.ilike.%${q}%,slug.ilike.%${q}%`);
  }

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Headline KPIs — one extra round-trip but the volume is small.
  const [
    { count: totalCount },
    { count: draftCount },
    { count: publishedCount },
    { data: viewSums },
    poolSize,
  ] = await Promise.all([
    supabaseAdmin.from("blog_posts").select("id", { count: "exact", head: true }),
    supabaseAdmin
      .from("blog_posts")
      .select("id", { count: "exact", head: true })
      .eq("status", "draft"),
    supabaseAdmin
      .from("blog_posts")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
    supabaseAdmin
      .from("blog_posts")
      .select("view_count, cta_clicks")
      .eq("status", "published"),
    getWritablePoolSize(supabaseAdmin),
  ]);

  const totalViews = (viewSums || []).reduce(
    (a, r) => a + (r.view_count || 0),
    0
  );
  const totalClicks = (viewSums || []).reduce(
    (a, r) => a + (r.cta_clicks || 0),
    0
  );
  const ctr = totalViews > 0 ? totalClicks / totalViews : 0;

  return NextResponse.json({
    posts: data || [],
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
    kpis: {
      total: totalCount ?? 0,
      drafts: draftCount ?? 0,
      published: publishedCount ?? 0,
      totalViews,
      totalClicks,
      ctr,
      writablePool: poolSize,
    },
  });
}
