/**
 * BPI France ingestion
 * https://www.bpifrance.fr/
 *
 * BPI France offers financing for innovation and social impact.
 * No public API — HTML scraping of the solutions page + creation portal.
 *
 * Strategy:
 * 1. Scrape https://www.bpifrance.fr/nos-solutions for grant listings
 * 2. Scrape https://bpifrance-creation.fr/encyclopedie/aides-financements
 * 3. Fallback to RSS if available
 */

const BPI_URLS = {
  solutions: "https://www.bpifrance.fr/nos-solutions",
  creation: "https://bpifrance-creation.fr/encyclopedie/aides-financements",
  rss: "https://www.bpifrance.fr/rss",
};

const USER_AGENT = "Emile-GrantFinder/1.0 (+https://emile.fr)";

export interface BpiGrantRaw {
  title: string;
  url: string;
  description: string;
  category: string;
  eligibility: string;
}

function cleanHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Scrape BPI France main solutions page
 */
async function scrapeSolutionsPage(): Promise<BpiGrantRaw[]> {
  console.log("[BPI France] Scraping nos-solutions...");
  const grants: BpiGrantRaw[] = [];

  try {
    const res = await fetch(BPI_URLS.solutions, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
    });
    if (!res.ok) {
      console.warn(`[BPI France] Solutions page returned ${res.status}`);
      return [];
    }

    const html = await res.text();

    // Extract links to individual solution pages
    const linkRegex = /<a[^>]*href="(\/nos-solutions\/[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    const seen = new Set<string>();

    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1];
      const text = cleanHtml(match[2]);
      if (seen.has(href) || !text || text.length < 5) continue;
      seen.add(href);

      grants.push({
        title: text.slice(0, 300),
        url: `https://www.bpifrance.fr${href}`,
        description: "",
        category: "financement",
        eligibility: "",
      });
    }

    // Also try card-style patterns
    const cardRegex = /<div[^>]*class="[^"]*card[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
    while ((match = cardRegex.exec(html)) !== null) {
      const card = match[1];
      const titleMatch = card.match(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/i);
      const linkMatch = card.match(/<a[^>]*href="([^"]*)"[^>]*>/i);
      const descMatch = card.match(/<p[^>]*>([\s\S]*?)<\/p>/i);

      if (titleMatch && linkMatch) {
        const title = cleanHtml(titleMatch[1]);
        const href = linkMatch[1];
        const fullUrl = href.startsWith("http") ? href : `https://www.bpifrance.fr${href}`;

        if (!seen.has(href) && title.length > 5) {
          seen.add(href);
          grants.push({
            title,
            url: fullUrl,
            description: descMatch ? cleanHtml(descMatch[1]).slice(0, 500) : "",
            category: "financement",
            eligibility: "",
          });
        }
      }
    }

    console.log(`[BPI France] Found ${grants.length} solutions`);
  } catch (error) {
    console.warn("[BPI France] Error scraping solutions:", error);
  }

  return grants;
}

/**
 * Scrape BPI France Création — aides & financements
 */
async function scrapeCreationPage(): Promise<BpiGrantRaw[]> {
  console.log("[BPI France] Scraping bpifrance-creation...");
  const grants: BpiGrantRaw[] = [];

  try {
    const res = await fetch(BPI_URLS.creation, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
    });
    if (!res.ok) {
      console.warn(`[BPI France] Creation page returned ${res.status}`);
      return [];
    }

    const html = await res.text();
    const seen = new Set<string>();

    // Extract aide links
    const linkRegex = /<a[^>]*href="((?:https?:\/\/bpifrance-creation\.fr)?\/encyclopedie\/[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1];
      const text = cleanHtml(match[2]);
      if (seen.has(href) || !text || text.length < 5) continue;
      seen.add(href);

      const fullUrl = href.startsWith("http") ? href : `https://bpifrance-creation.fr${href}`;

      grants.push({
        title: text.slice(0, 300),
        url: fullUrl,
        description: "",
        category: "création",
        eligibility: "",
      });
    }

    console.log(`[BPI France] Found ${grants.length} aides-création`);
  } catch (error) {
    console.warn("[BPI France] Error scraping creation:", error);
  }

  return grants;
}

/**
 * Fallback: parse RSS feed
 */
async function parseRssFeed(): Promise<BpiGrantRaw[]> {
  try {
    const res = await fetch(BPI_URLS.rss, {
      headers: { "User-Agent": USER_AGENT },
    });
    if (!res.ok) return [];

    const xml = await res.text();
    const items: BpiGrantRaw[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
      const item = match[1];
      const title = item.match(/<title>(.*?)<\/title>/)?.[1] || "";
      const link = item.match(/<link>(.*?)<\/link>/)?.[1] || "";
      const desc = item.match(/<description>(.*?)<\/description>/)?.[1] || "";

      if (title && link) {
        items.push({
          title: cleanHtml(title),
          url: link,
          description: cleanHtml(desc).slice(0, 500),
          category: "actualité",
          eligibility: "",
        });
      }
    }

    console.log(`[BPI France] Found ${items.length} RSS items`);
    return items;
  } catch {
    return [];
  }
}

/**
 * Fetch all BPI France grants from multiple sources
 */
export async function fetchBpiGrants(): Promise<BpiGrantRaw[]> {
  console.log("[BPI France] Starting ingestion...");

  const [solutions, creation, rss] = await Promise.all([
    scrapeSolutionsPage(),
    scrapeCreationPage(),
    parseRssFeed(),
  ]);

  // Merge and deduplicate by URL
  const seen = new Set<string>();
  const all: BpiGrantRaw[] = [];

  for (const grant of [...solutions, ...creation, ...rss]) {
    if (!seen.has(grant.url)) {
      seen.add(grant.url);
      all.push(grant);
    }
  }

  console.log(`[BPI France] Total unique: ${all.length}`);
  return all;
}

/**
 * Transform BPI grant to our schema
 */
export function transformBpiToGrant(raw: BpiGrantRaw) {
  return {
    sourceUrl: raw.url,
    sourceName: "BPI France",
    title: raw.title,
    summary: raw.description?.slice(0, 500) || null,
    rawContent: raw.description,
    funder: "BPI France",
    country: "FR",
    thematicAreas: ["Innovation", "Impact social"],
    eligibleEntities: ["association", "entreprise", "startup"],
    eligibleCountries: ["FR"],
    minAmountEur: null,
    maxAmountEur: null,
    coFinancingRequired: null,
    deadline: null,
    grantType: raw.category === "création" ? "aide_creation" : "subvention",
    language: "fr",
    status: "active",
    aiSummary: null,
  };
}
