/**
 * Île-de-France — Aides et appels à projets (live OpenDataSoft API)
 *
 * The Région Île-de-France publishes its full aides catalogue as an open
 * dataset on data.iledefrance.fr (OpenDataSoft v2.1):
 *   /api/explore/v2.1/catalog/datasets/aides-appels-a-projets/records
 *
 * 343 records as of 2026-04. Many entries are historical (date_cloture in
 * the past) — we filter those out and only emit aids that are still open
 * (date_cloture >= today OR date_cloture is null).
 *
 * Aides-Territoires already covers some of these, but Aides-Territoires is
 * a meta-aggregator with curation lag; this dataset is the authoritative
 * regional source and surfaces ~150 active aids that AT often misses.
 */
import { parseMaxAmountEur } from "./amount-parser";

const DATASET_URL =
  "https://data.iledefrance.fr/api/explore/v2.1/catalog/datasets/aides-appels-a-projets/records";

interface IdfRecord {
  reference_administrative?: number;
  id_aide?: string;
  nom_de_l_aide_de_la_demarche?: string | null;
  titre_alternatif_de_l_aide?: string | null;
  porteur_aide?: string | null;
  theme?: string[] | null;
  qui_peut_en_beneficier?: string[] | null;
  publicsbeneficiaireprecision?: string | null;
  entete?: string | null;
  chapo_txt?: string | null;
  objectif?: string | null;
  objectif_txt?: string | null;
  modalite?: string | null;
  modalite_txt?: string | null;
  date_ouverture?: string | null;
  date_cloture?: string | null;
  url_descriptif?: string | null;
  contact?: string | null;
}

export interface IdfAide {
  id: string;
  title: string;
  summary: string | null;
  rawText: string;
  url: string;
  themes: string[];
  audiences: string[];
  deadline: Date | null;
  startDate: Date | null;
  maxAmountEur: number | null;
}

function cleanHtml(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x27;|&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&euro;/gi, "€")
    .replace(/\s+/g, " ")
    .trim();
}

function parseDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? d : null;
}

/** Map IDF audience labels onto our schema's eligible_entities tags. */
function mapAudiences(raw: string[] | null | undefined): string[] {
  if (!raw) return [];
  const out = new Set<string>();
  for (const r of raw) {
    const t = r.toLowerCase();
    if (/associ/.test(t)) out.add("association");
    if (/professionnel|entreprise|pme|eti|tpe|ge\b/.test(t)) out.add("entreprise");
    if (/collectivit/.test(t)) out.add("collectivite");
    if (/particulier|individu/.test(t)) out.add("particulier");
    if (/recherche|universit|laborat/.test(t)) out.add("recherche");
  }
  return Array.from(out);
}

export async function fetchIdfAides(): Promise<IdfAide[]> {
  console.log("[IDF Aides] Fetching from data.iledefrance.fr...");
  const all: IdfAide[] = [];
  const pageSize = 100;
  let offset = 0;
  let total = 0;

  // OpenDataSoft caps offset at 10000 anyway and we only have ~350 records.
  while (offset === 0 || offset < total) {
    const url = `${DATASET_URL}?limit=${pageSize}&offset=${offset}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      throw new Error(`IDF Aides HTTP ${res.status}: ${res.statusText}`);
    }
    const data = (await res.json()) as {
      total_count: number;
      results: IdfRecord[];
    };
    total = data.total_count;

    const now = Date.now();
    for (const r of data.results) {
      const close = parseDate(r.date_cloture);
      // Filter out aids whose deadline is already past — Région IDF leaves
      // historical aides in the dataset (cleanup is irregular).
      if (close && close.getTime() < now) continue;

      const id = r.id_aide || String(r.reference_administrative ?? "");
      if (!id) continue;

      const title =
        r.titre_alternatif_de_l_aide ||
        r.nom_de_l_aide_de_la_demarche ||
        `Aide IDF #${id}`;

      const summary = cleanHtml(r.chapo_txt || r.entete).slice(0, 500) || null;
      const rawText = [
        r.entete,
        r.objectif_txt || r.objectif,
        r.modalite_txt || r.modalite,
        r.publicsbeneficiaireprecision,
      ]
        .map(cleanHtml)
        .filter(Boolean)
        .join("\n\n");

      const url =
        r.url_descriptif ||
        `https://www.iledefrance.fr/aides-et-appels-a-projets/${
          r.reference_administrative ?? id
        }`;

      const themes = (r.theme ?? []).filter((t): t is string => !!t);
      const audiences = mapAudiences(r.qui_peut_en_beneficier);
      const maxAmountEur =
        parseMaxAmountEur(r.modalite_txt) ||
        parseMaxAmountEur(r.objectif_txt) ||
        parseMaxAmountEur(r.entete) ||
        null;

      all.push({
        id,
        title: cleanHtml(title).slice(0, 300),
        summary,
        rawText: rawText || (summary ?? ""),
        url,
        themes,
        audiences,
        deadline: close,
        startDate: parseDate(r.date_ouverture),
        maxAmountEur,
      });
    }

    offset += pageSize;
    if (data.results.length < pageSize) break;
    await new Promise((r) => setTimeout(r, 100));
  }

  console.log(
    `[IDF Aides] Done. Active: ${all.length} (out of ${total} total in dataset).`
  );
  return all;
}

export function transformIdfAideToGrant(a: IdfAide) {
  return {
    sourceUrl: a.url,
    sourceName: "Île-de-France — Aides régionales",
    title: a.title,
    summary: a.summary,
    rawContent: a.rawText || a.summary || null,
    funder: "Région Île-de-France",
    country: "FR",
    thematicAreas: a.themes.length > 0 ? a.themes : ["Territoires"],
    eligibleEntities:
      a.audiences.length > 0
        ? a.audiences
        : ["association", "collectivite", "entreprise"],
    eligibleCountries: ["FR"],
    targetRegions: ["Île-de-France"],
    minAmountEur: null,
    maxAmountEur: a.maxAmountEur,
    coFinancingRequired: true,
    deadline: a.deadline,
    grantType: /appel|manifestation/i.test(a.title)
      ? "appel_a_projets"
      : "subvention",
    language: "fr",
    status: "active",
    aiSummary: null,
  };
}
