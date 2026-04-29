import { listAllPublishedSlugs } from "@/lib/blog/queries";

export const revalidate = 3600;

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://grant-finder-kappa.vercel.app";

/**
 * Dedicated blog sitemap at /blog/sitemap.xml. Mirrors the entries already
 * present in the root sitemap but lets us hand a focused URL to Bing /
 * IndexNow / GSC for fast re-crawl after each daily publication.
 */
export async function GET() {
  const slugs = await listAllPublishedSlugs().catch(() => []);

  const indexEntry = `<url>
  <loc>${SITE_URL}/blog</loc>
  <changefreq>daily</changefreq>
  <priority>0.8</priority>
</url>`;

  const articleEntries = slugs
    .map(
      (s) => `<url>
  <loc>${SITE_URL}/blog/${s.slug}</loc>
  <lastmod>${new Date(s.updated_at || s.published_at || Date.now()).toISOString()}</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.7</priority>
</url>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexEntry}
${articleEntries}
</urlset>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
