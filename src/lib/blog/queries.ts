/**
 * Server-side blog queries — used by the public /blog pages, the sitemap,
 * and the admin views. We use a service-role client because the public
 * pages need to read drafts in admin previews and we still rely on the
 * `status` filter to keep drafts off the live site.
 */

import { createClient } from "@supabase/supabase-js";

export interface PublicBlogPost {
  id: string;
  slug: string;
  title: string;
  meta_title: string | null;
  meta_description: string | null;
  body_html: string;
  cta_block: string | null;
  faq_schema: unknown;
  cover_image_url: string | null;
  thematic_tag: string | null;
  keywords: string[] | null;
  status: string;
  published_at: string | null;
  word_count: number | null;
  view_count: number;
  cta_clicks: number;
  created_at: string;
  updated_at: string;
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function listPublishedPosts(opts: {
  page?: number;
  pageSize?: number;
}): Promise<{ posts: PublicBlogPost[]; total: number }> {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, opts.pageSize ?? 12));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = getServiceClient();
  const { data, count } = await supabase
    .from("blog_posts")
    .select("*", { count: "exact" })
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(from, to);

  return {
    posts: (data || []) as PublicBlogPost[],
    total: count ?? 0,
  };
}

export async function getPublishedPostBySlug(
  slug: string
): Promise<PublicBlogPost | null> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();
  return (data as PublicBlogPost | null) ?? null;
}

/**
 * Pull 3–5 published posts that share the thematic tag for the related-articles
 * sidebar. Falls back to the most recent posts if there's no overlap.
 */
export async function listRelatedPosts(args: {
  excludeId: string;
  thematicTag: string | null;
  limit?: number;
}): Promise<PublicBlogPost[]> {
  const limit = args.limit ?? 4;
  const supabase = getServiceClient();

  if (args.thematicTag) {
    const { data } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("status", "published")
      .eq("thematic_tag", args.thematicTag)
      .neq("id", args.excludeId)
      .order("published_at", { ascending: false })
      .limit(limit);
    if (data && data.length >= limit) return data as PublicBlogPost[];
    if (data && data.length > 0) {
      const have = new Set(data.map((p) => p.id));
      const fallback = await supabase
        .from("blog_posts")
        .select("*")
        .eq("status", "published")
        .neq("id", args.excludeId)
        .order("published_at", { ascending: false })
        .limit(limit);
      const merged = [
        ...(data as PublicBlogPost[]),
        ...((fallback.data || []) as PublicBlogPost[]).filter(
          (p) => !have.has(p.id)
        ),
      ].slice(0, limit);
      return merged;
    }
  }

  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .neq("id", args.excludeId)
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data || []) as PublicBlogPost[];
}

export async function listAllPublishedSlugs(): Promise<
  { slug: string; updated_at: string; published_at: string | null }[]
> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("slug, updated_at, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  return (data || []) as {
    slug: string;
    updated_at: string;
    published_at: string | null;
  }[];
}

export async function incrementViewCount(slug: string): Promise<void> {
  const supabase = getServiceClient();
  // Best-effort fire-and-forget. Use a lightweight RPC-style approach:
  // fetch the row, increment, write back. Not transactional but fine for
  // an analytics counter that doesn't need to be exact.
  const { data } = await supabase
    .from("blog_posts")
    .select("view_count")
    .eq("slug", slug)
    .maybeSingle();
  if (!data) return;
  await supabase
    .from("blog_posts")
    .update({ view_count: (data.view_count ?? 0) + 1 })
    .eq("slug", slug);
}

export async function incrementCtaClicks(slug: string): Promise<void> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("cta_clicks")
    .eq("slug", slug)
    .maybeSingle();
  if (!data) return;
  await supabase
    .from("blog_posts")
    .update({ cta_clicks: (data.cta_clicks ?? 0) + 1 })
    .eq("slug", slug);
}
