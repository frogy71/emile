import type { MetadataRoute } from "next";
import { listAllPublishedSlugs } from "@/lib/blog/queries";

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://grant-finder-kappa.vercel.app";

/**
 * Public sitemap. Only exposes anonymous-accessible routes so Google doesn't
 * try to crawl authenticated app paths.
 *
 * Blog articles are appended dynamically; the page is regenerated on every
 * request (Next caches at the edge), so a freshly published article shows
 * up within minutes.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const blogPosts = await listAllPublishedSlugs().catch(() => []);

  const blogEntries: MetadataRoute.Sitemap = blogPosts.map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastModified: new Date(p.updated_at || p.published_at || lastModified),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/pricing`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/login`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/signup`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/legal/cgu`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/legal/privacy`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/legal/mentions`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/legal/contact`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.8,
    },
    ...blogEntries,
  ];
}
