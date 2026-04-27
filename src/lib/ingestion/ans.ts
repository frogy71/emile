/**
 * ANS — Agence Nationale du Sport
 *
 * L'ANS finance le sport en France via plusieurs dispositifs nationaux :
 * Projets Sportifs Fédéraux (PSF), Emploi, Apprentissage, J'apprends à nager,
 * équipements, Savoir rouler à vélo.
 *
 * Listing : https://www.agencedusport.fr/les-financements
 */

export interface ANSRaw {
  url: string;
  title: string;
  summary: string;
  themes: string[];
  minAmountEur?: number | null;
  maxAmountEur?: number | null;
}

const ANS_SCHEMES: ANSRaw[] = [
  {
    url: "https://www.agencedusport.fr/les-financements/le-projet-sportif-federal-psf",
    title: "Projets Sportifs Fédéraux (PSF)",
    summary:
      "Principal dispositif de soutien aux clubs et associations sportives (subvention de fonctionnement de 1 500 € à 25 000 € selon la fédération). Distribué par les fédérations selon leur stratégie nationale. Dépôt via Le Compte Asso, campagne printemps.",
    themes: ["Sport"],
    minAmountEur: 1500,
    maxAmountEur: 25000,
  },
  {
    url: "https://www.agencedusport.fr/les-financements/emploi",
    title: "ANS — Dispositif Emploi",
    summary:
      "Aide pluriannuelle au recrutement d'un emploi qualifié dans une association sportive (jusqu'à 12 000 €/an pendant 4 ans, soit 48 000 € total). Cible : clubs, comités, ligues.",
    themes: ["Sport", "Emploi"],
    maxAmountEur: 48000,
  },
  {
    url: "https://www.agencedusport.fr/les-financements/apprentissage",
    title: "ANS — Aide à l'apprentissage",
    summary:
      "Soutien à l'embauche d'un apprenti dans une association sportive employeuse (forfait jusqu'à 6 000 € pour les diplômes STAPS / BPJEPS / DEJEPS).",
    themes: ["Sport", "Emploi", "Éducation"],
    maxAmountEur: 6000,
  },
  {
    url: "https://www.agencedusport.fr/les-financements/japprends-a-nager",
    title: "J'apprends à nager / Savoir rouler à vélo",
    summary:
      "Soutien aux stages d'apprentissage de la natation (6-12 ans) et du vélo pour les enfants en milieu scolaire et périscolaire. Subvention forfaitaire jusqu'à 3 000 € par stage.",
    themes: ["Sport", "Jeunesse"],
    maxAmountEur: 3000,
  },
  {
    url: "https://www.agencedusport.fr/les-financements/equipements-sportifs",
    title: "ANS — Équipements sportifs",
    summary:
      "Subvention à l'investissement pour la construction, la rénovation ou la mise aux normes d'équipements sportifs structurants ou de proximité (jusqu'à 500 000 € pour un équipement structurant).",
    themes: ["Sport", "Équipements"],
    maxAmountEur: 500000,
  },
  {
    url: "https://www.agencedusport.fr/les-financements/plan-5000-equipements-sportifs-de-proximite",
    title: "Plan 5000 équipements sportifs de proximité",
    summary:
      "Plan national de financement de petits équipements sportifs (city-stades, skateparks, terrains multisports, padels, piscines mobiles) dans les territoires carencés. Subvention jusqu'à 80 % du coût (plafond ~200 000 €).",
    themes: ["Sport", "Équipements"],
    maxAmountEur: 200000,
  },
];

export async function fetchANS(): Promise<ANSRaw[]> {
  console.log(`[ANS] ${ANS_SCHEMES.length} curated schemes`);
  return ANS_SCHEMES;
}

export function transformANSToGrant(raw: ANSRaw) {
  return {
    sourceUrl: raw.url,
    sourceName: "ANS — Agence nationale du sport",
    title: raw.title,
    summary: raw.summary,
    rawContent: raw.summary,
    funder: "Agence nationale du Sport",
    country: "FR",
    thematicAreas: raw.themes,
    eligibleEntities: ["association", "collectivite", "club_sportif"],
    eligibleCountries: ["FR"],
    minAmountEur: raw.minAmountEur ?? null,
    maxAmountEur: raw.maxAmountEur ?? null,
    coFinancingRequired: false,
    deadline: null,
    grantType: "subvention",
    language: "fr",
    status: "active",
    aiSummary: null,
  };
}
