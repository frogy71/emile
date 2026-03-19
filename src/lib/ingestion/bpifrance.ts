/**
 * BPI France ingestion
 * https://www.bpifrance.fr/
 *
 * BPI France offers financing for innovation and social impact.
 * No public API — scraping required.
 *
 * Key pages:
 * - https://www.bpifrance.fr/nos-solutions — all solutions
 * - https://bpifrance-creation.fr/encyclopedie/aides-financements — grants listing
 *
 * Strategy: Scrape the solutions page and extract grant opportunities.
 * For now, we use their RSS/sitemap + manual curation.
 */

const BPI_URLS = {
  solutions: "https://www.bpifrance.fr/nos-solutions",
  aides: "https://bpifrance-creation.fr/encyclopedie/aides-financements",
  rss: "https://www.bpifrance.fr/rss",
};

export interface BpiGrantRaw {
  title: string;
  url: string;
  description: string;
  category: string;
  eligibility: string;
}

/**
 * Fetch BPI France grants (basic scraper)
 * In production, use Apify or Puppeteer for full scraping
 */
export async function fetchBpiGrants(): Promise<BpiGrantRaw[]> {
  console.log("[BPI France] Starting ingestion...");

  try {
    // Attempt RSS feed first
    const response = await fetch(BPI_URLS.rss);
    if (response.ok) {
      const text = await response.text();
      return parseBpiRss(text);
    }
  } catch (error) {
    console.warn("[BPI France] RSS not available, will need Apify scraper");
  }

  // Fallback: return empty — will be populated via Apify actor
  console.log(
    "[BPI France] No RSS available. Set up Apify actor for full scraping."
  );
  return [];
}

function parseBpiRss(xml: string): BpiGrantRaw[] {
  // Basic XML parsing for RSS items
  const items: BpiGrantRaw[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    const title = item.match(/<title>(.*?)<\/title>/)?.[1] || "";
    const link = item.match(/<link>(.*?)<\/link>/)?.[1] || "";
    const desc =
      item.match(/<description>(.*?)<\/description>/)?.[1] || "";

    if (title && link) {
      items.push({
        title: title.replace(/<!\[CDATA\[|\]\]>/g, ""),
        url: link,
        description: desc.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]*>/g, ""),
        category: "innovation",
        eligibility: "",
      });
    }
  }

  return items;
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
    grantType: "subvention",
    language: "fr",
    status: "active",
    aiSummary: null,
  };
}
