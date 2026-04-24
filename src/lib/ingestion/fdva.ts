/**
 * FDVA — Fonds pour le Développement de la Vie Associative
 *
 * Le FDVA est le fonds d'État pour la vie associative. Il se décline en
 * plusieurs volets lancés annuellement au niveau régional (DRAJES).
 *
 * - FDVA 1 — Formation des bénévoles
 * - FDVA 2 — Fonctionnement / innovation
 * - FDVA Sport — Sport associatif (compte individuel Avance)
 *
 * Les appels sont ouverts à toutes les associations loi 1901. Les deadlines
 * varient par région (avril-juin en général). Nous listons les 3 volets
 * nationaux (les dates régionales sont mises à jour par la DRAJES).
 */

export interface FDVARaw {
  url: string;
  title: string;
  summary: string;
  themes: string[];
  deadline: string | null;
}

const FDVA_SOURCES: FDVARaw[] = [
  {
    url: "https://www.associations.gouv.fr/fdva-fonctionnement-et-innovation.html",
    title: "FDVA 2 — Fonctionnement et nouveaux projets innovants",
    summary:
      "Subvention de l'État aux associations pour le fonctionnement global ou la mise en œuvre de projets innovants. Campagne annuelle lancée par les DRAJES en mars, clôture avril-mai selon les régions. Subventions de 1 000 € à 15 000 € en moyenne.",
    themes: ["Vie associative", "Social"],
    deadline: null,
  },
  {
    url: "https://www.associations.gouv.fr/fdva-formation-des-benevoles.html",
    title: "FDVA 1 — Formation des bénévoles",
    summary:
      "Soutien de l'État à la formation des bénévoles élus associatifs. Campagne annuelle lancée par les DRAJES (dépôt via Le Compte Asso). Prise en charge de formations techniques, juridiques, comptables, numériques, etc.",
    themes: ["Vie associative", "Éducation"],
    deadline: null,
  },
  {
    url: "https://www.associations.gouv.fr/fdva-sport.html",
    title: "FDVA Sport — Appel à projets",
    summary:
      "Volet sportif du FDVA, co-piloté avec l'Agence nationale du Sport. Soutien aux associations sportives locales (équipements, événements, formation des encadrants).",
    themes: ["Sport", "Vie associative"],
    deadline: null,
  },
  {
    url: "https://lecompteasso.associations.gouv.fr/",
    title: "Le Compte Asso — Portail national des subventions associatives",
    summary:
      "Plateforme officielle de dépôt des demandes de subventions auprès des administrations publiques (FDVA, ministères, préfectures). Obligatoire pour la plupart des subventions d'État aux associations.",
    themes: ["Vie associative"],
    deadline: null,
  },
];

export async function fetchFDVA(): Promise<FDVARaw[]> {
  console.log(`[FDVA] ${FDVA_SOURCES.length} national schemes`);
  return FDVA_SOURCES;
}

export function transformFDVAToGrant(raw: FDVARaw) {
  return {
    sourceUrl: raw.url,
    sourceName: "FDVA — Vie associative",
    title: raw.title,
    summary: raw.summary,
    rawContent: raw.summary,
    funder: "État / DRAJES",
    country: "FR",
    thematicAreas: raw.themes,
    eligibleEntities: ["association"],
    eligibleCountries: ["FR"],
    minAmountEur: 1000,
    maxAmountEur: 20000,
    coFinancingRequired: false,
    deadline: raw.deadline ? new Date(raw.deadline) : null,
    grantType: "subvention",
    language: "fr",
    status: "active",
    aiSummary: null,
  };
}
