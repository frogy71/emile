/**
 * ADEME — Agir pour la transition écologique
 *
 * Listing: https://agirpourlatransition.ademe.fr/entreprises/aides-financieres/dispositifs-aides
 *
 * ADEME's listing requires a browser-like UA (default fetch UA gets 403). We
 * curate the flagship dispositifs here and enrich via the listing when
 * reachable. Curated entries are always returned as a safety net so we still
 * surface ADEME to users even if scraping breaks.
 */

const LISTING_URL =
  "https://agirpourlatransition.ademe.fr/entreprises/aides-financieres/dispositifs-aides";

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export interface ADEMERaw {
  url: string;
  title: string;
  summary: string | null;
  themes: string[];
  deadline: string | null;
  minAmountEur: number | null;
  maxAmountEur: number | null;
}

/**
 * Flagship ADEME dispositifs (curated from the official site).
 *
 * These are structurally recurring programmes that rarely disappear. URLs
 * point directly to the corresponding dispositif page.
 */
const ADEME_CURATED: ADEMERaw[] = [
  {
    url: "https://agirpourlatransition.ademe.fr/entreprises/dispositif-aide/tremplin-transition-ecologique-pme",
    title: "Tremplin pour la transition écologique des PME",
    summary:
      "Dispositif forfaitaire pour aider les TPE/PME à financer des actions concrètes en faveur de la transition écologique (éco-conception, mobilité, énergie, gestion des déchets, biodiversité).",
    themes: ["Environnement", "Énergie"],
    deadline: null,
    minAmountEur: 5000,
    maxAmountEur: 200000,
  },
  {
    url: "https://agirpourlatransition.ademe.fr/entreprises/dispositif-aide/diag-eco-flux",
    title: "Diag Éco-Flux",
    summary:
      "Audit des flux (eau, énergie, matières, déchets) dans l'entreprise pour réduire les pertes et les coûts. Prise en charge ADEME/Bpifrance.",
    themes: ["Environnement", "Énergie"],
    deadline: null,
    minAmountEur: null,
    maxAmountEur: null,
  },
  {
    url: "https://agirpourlatransition.ademe.fr/entreprises/dispositif-aide/diag-decarbonaction",
    title: "Diag Décarbon'Action",
    summary:
      "Bilan GES complet de l'entreprise + plan d'actions de décarbonation, co-financé par Bpifrance et l'ADEME.",
    themes: ["Environnement", "Énergie"],
    deadline: null,
    minAmountEur: null,
    maxAmountEur: null,
  },
  {
    url: "https://agirpourlatransition.ademe.fr/entreprises/dispositif-aide/objectif-eco-energie-tertiaire",
    title: "Objectif Éco-Énergie Tertiaire",
    summary:
      "Aide au financement d'audits énergétiques et de plans d'actions pour les bâtiments tertiaires soumis au décret éco-énergie.",
    themes: ["Énergie"],
    deadline: null,
    minAmountEur: null,
    maxAmountEur: null,
  },
  {
    url: "https://agirpourlatransition.ademe.fr/entreprises/dispositif-aide/fonds-chaleur",
    title: "Fonds Chaleur",
    summary:
      "Soutien aux projets de production de chaleur et de froid à partir de sources renouvelables (solaire thermique, biomasse, géothermie, récupération).",
    themes: ["Énergie"],
    deadline: null,
    minAmountEur: null,
    maxAmountEur: null,
  },
  {
    url: "https://agirpourlatransition.ademe.fr/entreprises/dispositif-aide/fonds-economie-circulaire",
    title: "Fonds Économie circulaire",
    summary:
      "Soutien aux projets de réduction, réutilisation, réparation, recyclage et valorisation des déchets.",
    themes: ["Environnement"],
    deadline: null,
    minAmountEur: null,
    maxAmountEur: null,
  },
  {
    url: "https://agirpourlatransition.ademe.fr/entreprises/dispositif-aide/etudes-aide-decision",
    title: "Études à la décision (ADEME)",
    summary:
      "Financement d'études (diagnostic, faisabilité, schéma directeur) visant à préparer la mise en œuvre d'actions de transition écologique.",
    themes: ["Environnement"],
    deadline: null,
    minAmountEur: null,
    maxAmountEur: null,
  },
];

/** Light scraper of the public listing page (best-effort). */
async function scrapeListing(): Promise<ADEMERaw[]> {
  try {
    const res = await fetch(LISTING_URL, {
      headers: { "User-Agent": BROWSER_UA, Accept: "text/html" },
    });
    if (!res.ok) {
      console.warn(`[ADEME] Listing returned ${res.status} — using curated set only`);
      return [];
    }
    const html = await res.text();

    // Dispositif URLs follow /entreprises/dispositif-aide/<slug>
    const slugs = new Set<string>();
    const re = /href="(\/entreprises\/dispositif-aide\/[^"\/?#]+)"/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) slugs.add(m[1]);

    console.log(`[ADEME] Listing: ${slugs.size} dispositifs found`);

    // Merge with curated — curated entries keep their rich metadata
    const out: ADEMERaw[] = [];
    const curatedByUrl = new Map(ADEME_CURATED.map((c) => [c.url, c]));
    for (const slug of slugs) {
      const url = `https://agirpourlatransition.ademe.fr${slug}`;
      if (curatedByUrl.has(url)) continue; // will be added from curated set
      // Derive a title from the slug
      const title = slug
        .split("/")
        .pop()!
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      out.push({
        url,
        title,
        summary: null,
        themes: ["Environnement", "Énergie"],
        deadline: null,
        minAmountEur: null,
        maxAmountEur: null,
      });
    }
    return out;
  } catch (e) {
    console.warn("[ADEME] Listing scrape failed:", e);
    return [];
  }
}

export async function fetchADEME(): Promise<ADEMERaw[]> {
  console.log("[ADEME] Fetching dispositifs...");
  const scraped = await scrapeListing();
  const all = [...ADEME_CURATED, ...scraped];
  console.log(
    `[ADEME] Total: ${all.length} (${ADEME_CURATED.length} curated + ${scraped.length} scraped)`
  );
  return all;
}

export function transformADEMEToGrant(raw: ADEMERaw) {
  return {
    sourceUrl: raw.url,
    sourceName: "ADEME",
    title: raw.title,
    summary: raw.summary,
    rawContent: raw.summary,
    funder: "ADEME",
    country: "FR",
    thematicAreas: raw.themes,
    eligibleEntities: ["entreprise", "association", "collectivite", "pme"],
    eligibleCountries: ["FR"],
    minAmountEur: raw.minAmountEur,
    maxAmountEur: raw.maxAmountEur,
    coFinancingRequired: true,
    deadline: raw.deadline ? new Date(raw.deadline) : null,
    grantType: "subvention",
    language: "fr",
    status: "active",
    aiSummary: null,
  };
}
