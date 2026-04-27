/**
 * Fondation de France — HTML scraping
 * https://www.fondationdefrance.org/fr/appels-a-projets
 *
 * FDF publishes ~40-60 calls/year across health, environment, solidarity,
 * research, culture. Listing page lists active calls with slugs.
 */

import { parseMaxAmountEur } from "./amount-parser";

const LISTING_URL = "https://www.fondationdefrance.org/fr/appels-a-projets";
const BASE_URL = "https://www.fondationdefrance.org";

export interface FDFRaw {
  url: string;
  title: string;
  summary: string | null;
  deadline: string | null;
  maxAmountEur: number | null;
  themes: string[];
}

function cleanText(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&eacute;/g, "é")
    .replace(/&egrave;/g, "è")
    .replace(/\s+/g, " ")
    .trim();
}

function extractDeadline(text: string): string | null {
  // Match formats: "avant le 15 septembre 2026", "jusqu'au 30/09/2026", "31 décembre 2026"
  const months: Record<string, string> = {
    janvier: "01",
    février: "02",
    mars: "03",
    avril: "04",
    mai: "05",
    juin: "06",
    juillet: "07",
    août: "08",
    septembre: "09",
    octobre: "10",
    novembre: "11",
    décembre: "12",
  };
  const lower = text.toLowerCase();

  // "15 septembre 2026"
  const m1 = lower.match(/(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(20\d{2})/);
  if (m1) {
    const day = m1[1].padStart(2, "0");
    return `${m1[3]}-${months[m1[2]]}-${day}`;
  }
  // "15/09/2026"
  const m2 = lower.match(/(\d{1,2})\/(\d{1,2})\/(20\d{2})/);
  if (m2) {
    return `${m2[3]}-${m2[2].padStart(2, "0")}-${m2[1].padStart(2, "0")}`;
  }
  return null;
}

function detectThemes(text: string): string[] {
  const themes: string[] = [];
  const keywords: Array<[RegExp, string]> = [
    [/santé|médical|hôpital|soin|maladie/i, "Santé"],
    [/environ|biodiversit|climat|écolog|nature/i, "Environnement"],
    [/recherche|scientif/i, "Recherche"],
    [/éducation|scolaire|école/i, "Éducation"],
    [/culture|art|musée|patrimoine/i, "Culture"],
    [/handicap|inclusion|accessibilit/i, "Handicap"],
    [/rural|territoir|campagne/i, "Ruralité"],
    [/pauvret|précarit|solidarit|social/i, "Solidarité"],
    [/jeune|enfant|famille/i, "Jeunesse"],
    [/sport|activité physique/i, "Sport"],
    [/eau|rivièr|marin|océan/i, "Eau"],
  ];
  for (const [re, theme] of keywords) {
    if (re.test(text)) themes.push(theme);
  }
  return themes.length ? themes : ["Solidarité"];
}

/**
 * Fetch active calls for projects from Fondation de France listing page
 */
export async function fetchFondationDeFrance(): Promise<FDFRaw[]> {
  console.log("[FDF] Fetching listing...");
  const res = await fetch(LISTING_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; EmileBot/1.0; +https://grant-finder-kappa.vercel.app)",
      Accept: "text/html",
    },
  });
  if (!res.ok) {
    throw new Error(`FDF listing error: ${res.status}`);
  }
  const html = await res.text();

  // Extract unique call slugs from /fr/appels-a-projets/<slug>
  const slugs = new Set<string>();
  const re = /href="(\/fr\/appels-a-projets\/[^"\/]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const path = m[1];
    // Exclude the listing page itself
    if (path !== "/fr/appels-a-projets") slugs.add(path);
  }

  console.log(`[FDF] Found ${slugs.size} active calls`);

  // Fetch each call page
  const calls: FDFRaw[] = [];
  for (const path of slugs) {
    try {
      const url = `${BASE_URL}${path}`;
      const detailRes = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; EmileBot/1.0; +https://grant-finder-kappa.vercel.app)",
        },
      });
      if (!detailRes.ok) continue;
      const detailHtml = await detailRes.text();

      // Title from <h1>
      const titleMatch = detailHtml.match(/<h1[^>]*>([^<]+)<\/h1>/);
      const title = titleMatch ? cleanText(titleMatch[1]) : path.split("/").pop()!;

      // Summary: og:description or first <p>
      const ogDesc = detailHtml.match(
        /<meta\s+(?:property|name)="og:description"\s+content="([^"]+)"/
      );
      let summary: string | null = ogDesc ? cleanText(ogDesc[1]) : null;
      if (!summary) {
        const pMatch = detailHtml.match(/<p[^>]*>([^<]{80,500})<\/p>/);
        summary = pMatch ? cleanText(pMatch[1]) : null;
      }

      // Deadline — look for keywords in the page
      const fullText = cleanText(detailHtml);
      const deadline = extractDeadline(fullText);

      // Try the meta description first (more curated, less false-positive
      // numbers like "5 000" referring to people), then the body.
      const maxAmountEur =
        parseMaxAmountEur(summary) || parseMaxAmountEur(fullText);

      calls.push({
        url,
        title,
        summary,
        deadline,
        maxAmountEur,
        themes: detectThemes(title + " " + (summary || "")),
      });

      // polite delay
      await new Promise((r) => setTimeout(r, 200));
    } catch (e) {
      console.error(`[FDF] Failed to fetch ${path}:`, e);
    }
  }

  console.log(`[FDF] Parsed ${calls.length} calls`);
  return calls;
}

/**
 * Transform to our Grant schema
 */
export function transformFDFToGrant(raw: FDFRaw) {
  return {
    sourceUrl: raw.url,
    sourceName: "Fondation de France",
    title: raw.title,
    summary: raw.summary,
    rawContent: raw.summary,
    funder: "Fondation de France",
    country: "FR",
    thematicAreas: raw.themes,
    eligibleEntities: ["association", "fondation", "ess"],
    eligibleCountries: ["FR"],
    minAmountEur: null,
    maxAmountEur: raw.maxAmountEur,
    coFinancingRequired: false,
    deadline: raw.deadline ? new Date(raw.deadline) : null,
    grantType: "appel_a_projets",
    language: "fr",
    status: "active",
    aiSummary: null,
  };
}
