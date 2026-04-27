/**
 * BPIfrance — Appels à Projets & Concours (live HTML scrape)
 *
 * Listing page: https://www.bpifrance.fr/nos-appels-a-projets-concours
 *
 * BPI doesn't expose a JSON API for its AAP listing, but the page is
 * server-rendered Drupal (no JS required) so we can extract each card.
 * ~24 active calls across 3 pages as of 2026-04. The page also contains
 * a "Derniers jours" highlights section that duplicates calls from the
 * main list — we dedupe by source URL.
 *
 * NB: this complements the existing bpifrance.ts source (which covers
 * the *flagship dispositifs* on /nos-solutions). This file specifically
 * adds the time-bound AAP/concours listings, which is where most of the
 * France 2030 calls operated by BPI surface.
 */
import { parseMaxAmountEur } from "./amount-parser";

const LISTING_URL = "https://www.bpifrance.fr/nos-appels-a-projets-concours";
const BASE = "https://www.bpifrance.fr";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export interface BpiAap {
  url: string;
  title: string;
  summary: string;
  applicationUrl: string | null;
  startDate: Date | null;
  deadline: Date | null;
  themes: string[];
  maxAmountEur: number | null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#039;/g, "'")
    .replace(/&nbsp;/gi, " ")
    .replace(/&euro;/gi, "€");
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

/** Parse "DD/MM/YYYY" → Date (midnight Europe/Paris). */
function parseFrDate(s: string): Date | null {
  const m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return null;
  const [_, dd, mm, yyyy] = m;
  void _;
  const d = new Date(`${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}T23:59:00+02:00`);
  return Number.isFinite(d.getTime()) ? d : null;
}

function detectThemes(text: string): string[] {
  const t = text.toLowerCase();
  const themes: string[] = [];
  const tags: Array<[RegExp, string]> = [
    [/innov|deep[- ]?tech|tech|i-nov|i-phd|i-lab/i, "Innovation"],
    [/climat|carbone|d(é|e)carbon|énergie|environn/i, "Environnement"],
    [/sant(é|e)|biot(h|p)|m(é|e)dic|pharma/i, "Santé"],
    [/ia|intelligence artificielle|num(é|e)rique|data|cyber/i, "Numérique"],
    [/agric|alimentaire|agro/i, "Agriculture"],
    [/industr|production|usine/i, "Industrie"],
    [/cultur|cr(é|e)ati/i, "Culture"],
    [/auto|v(é|e)hicule|mobilit(é|e)/i, "Mobilité"],
    [/spatial|espace/i, "Spatial"],
    [/quantique/i, "Quantique"],
    [/d(é|e)fense|s(é|e)curit(é|e)/i, "Défense"],
    [/export|international/i, "International"],
  ];
  for (const [re, theme] of tags) if (re.test(t)) themes.push(theme);
  return themes.length > 0 ? themes : ["Innovation"];
}

/** Pull all card blocks out of a listing page. */
function parseCards(html: string): BpiAap[] {
  const results: BpiAap[] = [];

  // Cards open with a <div ... class="...article-card card-our-project md-card..."> and
  // close at the matching </div>. Parsing nested divs with regex isn't reliable, so we
  // anchor on the predictable inner structure: card-date + h3 a + (optional) see-more a.
  // Each card is roughly 2KB; we use a non-greedy slice between consecutive openings.
  const cardRe = /class="[^"]*article-card[^"]*md-card[^"]*"/g;
  const indices: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = cardRe.exec(html)) !== null) indices.push(m.index);
  indices.push(html.length);

  for (let i = 0; i < indices.length - 1; i++) {
    const block = html.slice(indices[i], indices[i + 1]);

    const dateMatch = block.match(
      /<span[^>]*class="[^"]*card-date[^"]*"[^>]*>\s*([^<]+?)\s*<\/span>/i
    );
    const titleMatch = block.match(
      /<h3[^>]*>[\s\S]*?<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h3>/i
    );
    if (!titleMatch) continue;

    const href = decodeEntities(titleMatch[1]);
    const url = href.startsWith("http") ? href : `${BASE}${href}`;
    const title = stripTags(titleMatch[2]);
    if (!title) continue;

    const summaryMatch = block.match(/<p>\s*<a[^>]*>([\s\S]*?)<\/a>\s*<\/p>/i);
    const summary = summaryMatch ? stripTags(summaryMatch[1]) : "";

    const applyMatch = block.match(
      /<a[^>]+class="[^"]*see-more[^"]*"[^>]+href="([^"]+)"/i
    );
    const applicationUrl = applyMatch ? decodeEntities(applyMatch[1]) : null;

    let startDate: Date | null = null;
    let deadline: Date | null = null;
    if (dateMatch) {
      // Format examples:
      //   "15/04/2025 au 28/04/2026"  → start=15/04/2025, end=28/04/2026
      //   "Jusqu'au 30/04/2026"       → end only
      //   "23/03/2026 au 30/04/2026"
      const dates = decodeEntities(dateMatch[1]).match(/\d{1,2}\/\d{1,2}\/\d{4}/g) || [];
      if (dates.length === 2) {
        startDate = parseFrDate(dates[0]);
        deadline = parseFrDate(dates[1]);
      } else if (dates.length === 1) {
        deadline = parseFrDate(dates[0]);
      }
    }

    const themes = detectThemes(`${title} ${summary}`);
    const maxAmountEur = parseMaxAmountEur(summary);

    results.push({
      url,
      title,
      summary,
      applicationUrl,
      startDate,
      deadline,
      themes,
      maxAmountEur,
    });
  }

  return results;
}

async function fetchListingPage(page: number): Promise<{
  cards: BpiAap[];
  hasMore: boolean;
}> {
  const url = page === 0 ? LISTING_URL : `${LISTING_URL}?page=${page}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "fr-FR,fr;q=0.9",
    },
  });
  if (!res.ok) {
    throw new Error(`BPI AAP HTTP ${res.status} on page ${page}`);
  }
  const html = await res.text();
  const cards = parseCards(html);
  // Pagination: if we got a full-looking page with a `?page=N+1` link, there's more.
  const hasMore = new RegExp(`href="\\?page=${page + 1}"`).test(html);
  return { cards, hasMore };
}

export async function fetchBpifranceAaps(): Promise<BpiAap[]> {
  console.log("[BPI AAP] Scraping bpifrance.fr listing...");
  const seen = new Map<string, BpiAap>();

  // Hard cap at 10 pages — at the BPI cadence the listing rarely exceeds 4.
  for (let page = 0; page < 10; page++) {
    const { cards, hasMore } = await fetchListingPage(page);
    for (const c of cards) {
      // Drop closed calls (deadline in the past).
      if (c.deadline && c.deadline.getTime() < Date.now()) continue;
      if (!seen.has(c.url)) seen.set(c.url, c);
    }
    if (!hasMore) break;
    await new Promise((r) => setTimeout(r, 500));
  }

  const list = Array.from(seen.values());
  console.log(`[BPI AAP] Done. ${list.length} active AAPs / concours.`);
  return list;
}

export function transformBpifranceAapToGrant(a: BpiAap) {
  return {
    sourceUrl: a.url,
    sourceName: "BPIfrance — Appels à projets",
    title: a.title,
    summary: a.summary || null,
    rawContent: a.summary || null,
    funder: "BPIfrance",
    country: "FR",
    thematicAreas: a.themes,
    eligibleEntities: ["entreprise", "pme", "startup", "recherche"],
    eligibleCountries: ["FR"],
    minAmountEur: null,
    maxAmountEur: a.maxAmountEur,
    coFinancingRequired: true,
    deadline: a.deadline,
    grantType: /concours/i.test(a.title) ? "concours" : "appel_a_projets",
    language: "fr",
    status: "active",
    aiSummary: null,
  };
}
