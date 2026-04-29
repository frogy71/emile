/**
 * Région Occitanie — Aides et appels à projets (live OpenDataSoft API)
 *
 *   /api/explore/v2.1/catalog/datasets/aides-et-appels-a-projets-de-la-region-occitanie/records
 *
 * 222 records as of 2026-04. The dataset doesn't expose an explicit close
 * date — closed aids are tagged with " - Clos" or "(Clos)" in the title and
 * their description starts with "Cet appel à projets est clos". We filter
 * those out and emit the rest.
 */
import { parseMaxAmountEur } from "./amount-parser";

const DATASET_URL =
  "https://data.laregion.fr/api/explore/v2.1/catalog/datasets/aides-et-appels-a-projets-de-la-region-occitanie/records";

interface OccitanieRecord {
  titre?: string | null;
  type?: string | null;
  chapo?: string | null;
  introduction?: string | null;
  date_publication?: string | null;
  date_modification?: string | null;
  url?: string | null;
  thematiques?: string | null;
}

export interface OccitanieAide {
  title: string;
  summary: string | null;
  rawText: string;
  url: string;
  themes: string[];
  type: string;
  publishedAt: Date | null;
  maxAmountEur: number | null;
}

function stripHtml(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&euro;/gi, "€")
    .replace(/\s+/g, " ")
    .trim();
}

function isClosed(title: string, intro: string): boolean {
  if (/\bclos\b/i.test(title)) return true;
  if (/cet appel\s+(à|à)?\s*projets?\s+est\s+clos/i.test(intro)) return true;
  if (/d(é|e)pôt\s+des?\s+candidatures?\s+ferm/i.test(intro)) return true;
  return false;
}

export async function fetchOccitanieAides(): Promise<OccitanieAide[]> {
  console.log("[Occitanie Aides] Fetching from data.laregion.fr...");
  const all: OccitanieAide[] = [];
  const pageSize = 100;
  let offset = 0;
  let total = 0;

  while (offset === 0 || offset < total) {
    const url = `${DATASET_URL}?limit=${pageSize}&offset=${offset}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      throw new Error(`Occitanie HTTP ${res.status}: ${res.statusText}`);
    }
    const data = (await res.json()) as {
      total_count: number;
      results: OccitanieRecord[];
    };
    total = data.total_count;

    for (const r of data.results) {
      const title = (r.titre ?? "").trim();
      const intro = stripHtml(r.introduction);
      if (!title || !r.url) continue;
      if (isClosed(title, intro)) continue;

      const summary = stripHtml(r.chapo) || intro.slice(0, 500) || null;
      const themes = r.thematiques
        ? r.thematiques
            .split(/[;,/]/)
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      const publishedAtRaw = r.date_publication || r.date_modification;
      const publishedAt = publishedAtRaw ? new Date(publishedAtRaw) : null;

      const maxAmountEur =
        parseMaxAmountEur(intro) ||
        parseMaxAmountEur(stripHtml(r.chapo)) ||
        null;

      all.push({
        title: title.slice(0, 300),
        summary: summary ? summary.slice(0, 500) : null,
        rawText: intro || summary || "",
        url: r.url,
        themes,
        type: r.type || "Appel à projets",
        publishedAt: publishedAt && Number.isFinite(publishedAt.getTime()) ? publishedAt : null,
        maxAmountEur,
      });
    }

    offset += pageSize;
    if (data.results.length < pageSize) break;
    await new Promise((r) => setTimeout(r, 100));
  }

  console.log(
    `[Occitanie Aides] Done. Active: ${all.length} (out of ${total} total in dataset).`
  );
  return all;
}

export function transformOccitanieToGrant(a: OccitanieAide) {
  const isAap = /appel|amı|manifestation/i.test(a.type) || /appel|amı|manifestation/i.test(a.title);
  return {
    sourceUrl: a.url,
    sourceName: "Occitanie — Aides régionales",
    title: a.title,
    summary: a.summary,
    rawContent: a.rawText || a.summary || null,
    funder: "Région Occitanie",
    country: "FR",
    thematicAreas: a.themes.length > 0 ? a.themes : ["Territoires"],
    eligibleEntities: ["association", "collectivite", "entreprise"],
    eligibleCountries: ["FR"],
    targetRegions: ["Occitanie"],
    minAmountEur: null,
    maxAmountEur: a.maxAmountEur,
    coFinancingRequired: true,
    // Dataset doesn't carry a real deadline; leave null so the matcher
    // doesn't auto-expire these and so curated regions.ts behaviour holds.
    deadline: null,
    grantType: isAap ? "appel_a_projets" : "subvention",
    language: "fr",
    status: "active",
    aiSummary: null,
  };
}
