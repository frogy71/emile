/**
 * BPI France — Banque Publique d'Investissement
 *
 * Listings:
 *  - https://www.bpifrance.fr/nos-solutions (aides, prêts, garanties)
 *  - https://bpifrance-creation.fr/encyclopedie/aides-financements (aides création)
 *
 * BPI's public pages don't expose a clean API and their card markup changes
 * often. We therefore combine two layers:
 *
 *  1. A CURATED catalogue of the flagship programmes (stable, always
 *     returned so the user always sees BPI in the catalog).
 *  2. A best-effort HTML scrape that adds whatever we can extract on top.
 *
 * Curated entries are written so that fondations / associations / innovative
 * SMEs can find what applies to them.
 */

const BPI_URLS = {
  solutions: "https://www.bpifrance.fr/nos-solutions",
  creation: "https://bpifrance-creation.fr/encyclopedie/aides-financements",
};

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

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
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Flagship BPI programmes — always surfaced to the user.
 */
const BPI_CURATED: BpiGrantRaw[] = [
  {
    title: "Bourse French Tech Émergence",
    url: "https://www.bpifrance.fr/catalogue-offres/creation/bourse-french-tech-emergence",
    description:
      "Subvention jusqu'à 90 000 € pour les startups deep-tech et impact en phase de création, portées par des entrepreneurs à haut potentiel.",
    category: "innovation",
    eligibility: "startup, deep-tech, impact",
  },
  {
    title: "Aide pour la Faisabilité de l'Innovation",
    url: "https://www.bpifrance.fr/catalogue-offres/innovation/aide-pour-la-faisabilite-de-linnovation",
    description:
      "Subvention pour financer les dépenses amont (études, prototypage) d'un projet d'innovation technologique, produit ou service.",
    category: "innovation",
    eligibility: "pme, startup",
  },
  {
    title: "Aide au Développement Deep-Tech",
    url: "https://www.bpifrance.fr/catalogue-offres/innovation/aide-au-developpement-deeptech",
    description:
      "Subvention ou avance récupérable pour les projets deep-tech (IA, quantique, biotech, spatial, énergies).",
    category: "innovation",
    eligibility: "pme, eti, startup deep-tech",
  },
  {
    title: "Concours i-Nov (PIA)",
    url: "https://www.bpifrance.fr/catalogue-offres/innovation/concours-d-innovation-i-nov",
    description:
      "Concours national de l'innovation (Programme d'Investissements d'Avenir) avec subventions jusqu'à 5 M€ pour les PME.",
    category: "innovation",
    eligibility: "pme, startup",
  },
  {
    title: "Diag Action Climat",
    url: "https://www.bpifrance.fr/catalogue-offres/transition-ecologique-energetique/diag-action-climat",
    description:
      "Diagnostic climat co-financé par Bpifrance et l'ADEME pour identifier les actions de décarbonation prioritaires.",
    category: "transition",
    eligibility: "pme, eti",
  },
  {
    title: "Prêt Impact",
    url: "https://www.bpifrance.fr/catalogue-offres/transition-ecologique-energetique/pret-impact",
    description:
      "Prêt sans garantie (50 000 à 2 M€) pour financer les projets contribuant à la transition écologique et énergétique.",
    category: "transition",
    eligibility: "pme, eti",
  },
  {
    title: "Prêt d'Honneur Création (Initiative France)",
    url: "https://bpifrance-creation.fr/encyclopedie/aides-financements/prets-dhonneur",
    description:
      "Prêt à taux zéro sans garantie, en complément d'un financement bancaire, pour l'amorçage de la création d'entreprise.",
    category: "création",
    eligibility: "création entreprise, tpe",
  },
  {
    title: "NACRE — Nouvel Accompagnement pour la Création d'Entreprise",
    url: "https://bpifrance-creation.fr/encyclopedie/aides-financements/nacre",
    description:
      "Accompagnement régional au montage du projet + prêt à taux zéro jusqu'à 10 000 € pour les demandeurs d'emploi, minima sociaux, jeunes.",
    category: "création",
    eligibility: "création entreprise, demandeur emploi",
  },
  {
    title: "ARCE / ARE — Reprise d'entreprise pour demandeur d'emploi",
    url: "https://bpifrance-creation.fr/encyclopedie/aides-financements/arce-are",
    description:
      "Dispositifs France Travail : ARCE (versement en capital) ou maintien des ARE pendant la phase de démarrage.",
    category: "création",
    eligibility: "demandeur emploi",
  },
  {
    title: "ACRE — Exonération de charges sociales",
    url: "https://bpifrance-creation.fr/encyclopedie/aides-financements/acre",
    description:
      "Exonération partielle de charges sociales la première année d'activité pour les créateurs et repreneurs d'entreprise.",
    category: "création",
    eligibility: "création entreprise",
  },
];

/**
 * Best-effort scrape of the "Nos solutions" catalogue.
 */
async function scrapeSolutionsPage(): Promise<BpiGrantRaw[]> {
  const grants: BpiGrantRaw[] = [];
  try {
    const res = await fetch(BPI_URLS.solutions, {
      headers: { "User-Agent": BROWSER_UA, Accept: "text/html" },
    });
    if (!res.ok) {
      console.warn(`[BPI] Solutions page ${res.status}`);
      return [];
    }
    const html = await res.text();

    // Offer cards link to /catalogue-offres/<segment>/<slug>
    const seen = new Set<string>();
    const re = /href="(\/catalogue-offres\/[^"\/?#]+\/[^"\/?#]+)"/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      const href = m[1];
      if (seen.has(href)) continue;
      seen.add(href);

      const title = href
        .split("/")
        .pop()!
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      grants.push({
        title,
        url: `https://www.bpifrance.fr${href}`,
        description: "",
        category: "financement",
        eligibility: "",
      });
    }
    console.log(`[BPI] Solutions: ${grants.length} offers discovered`);
  } catch (e) {
    console.warn("[BPI] Solutions scrape failed:", e);
  }
  return grants;
}

/**
 * Best-effort scrape of BPI Création — encyclopédie/aides-financements.
 */
async function scrapeCreationPage(): Promise<BpiGrantRaw[]> {
  const grants: BpiGrantRaw[] = [];
  try {
    const res = await fetch(BPI_URLS.creation, {
      headers: { "User-Agent": BROWSER_UA, Accept: "text/html" },
    });
    if (!res.ok) {
      console.warn(`[BPI Creation] ${res.status}`);
      return [];
    }
    const html = await res.text();
    const seen = new Set<string>();

    // article cards link to /encyclopedie/<rubrique>/<slug> (typ. 2+ segments)
    const re =
      /<a[^>]*href="(\/encyclopedie\/[^"\/?#]+\/[^"\/?#]+)"[^>]*>\s*(?:<[^>]*>\s*)*([^<]{6,200})/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      const href = m[1];
      const title = cleanHtml(m[2]);
      if (seen.has(href) || !title) continue;
      seen.add(href);
      grants.push({
        title: title.slice(0, 200),
        url: `https://bpifrance-creation.fr${href}`,
        description: "",
        category: "création",
        eligibility: "",
      });
    }
    console.log(`[BPI Creation] ${grants.length} aides scraped`);
  } catch (e) {
    console.warn("[BPI Creation] scrape failed:", e);
  }
  return grants;
}

/** Merge curated + scraped and dedupe by URL. */
export async function fetchBpiGrants(): Promise<BpiGrantRaw[]> {
  console.log("[BPI France] Starting ingestion...");
  const [solutions, creation] = await Promise.all([
    scrapeSolutionsPage(),
    scrapeCreationPage(),
  ]);

  const seen = new Set<string>();
  const out: BpiGrantRaw[] = [];
  for (const grant of [...BPI_CURATED, ...solutions, ...creation]) {
    if (!seen.has(grant.url)) {
      seen.add(grant.url);
      out.push(grant);
    }
  }
  console.log(
    `[BPI France] Total ${out.length} (curated=${BPI_CURATED.length}, scraped=${out.length - BPI_CURATED.length})`
  );
  return out;
}

/** Transform BPI raw record to our Grant schema. */
export function transformBpiToGrant(raw: BpiGrantRaw) {
  const entities =
    raw.category === "création"
      ? ["entreprise", "startup", "tpe"]
      : ["pme", "eti", "startup", "entreprise"];

  const themes =
    raw.category === "transition"
      ? ["Innovation", "Environnement", "Énergie"]
      : raw.category === "création"
        ? ["Création d'entreprise"]
        : ["Innovation", "Impact social"];

  return {
    sourceUrl: raw.url,
    sourceName: "BPI France",
    title: raw.title,
    summary: raw.description?.slice(0, 500) || null,
    rawContent: raw.description || null,
    funder: "BPI France",
    country: "FR",
    thematicAreas: themes,
    eligibleEntities: entities,
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
