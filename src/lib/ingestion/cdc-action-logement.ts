/**
 * Caisse des Dépôts (Banque des Territoires) & Action Logement
 *
 * Deux opérateurs financiers majeurs en France pour les territoires
 * et le logement social. Distribuent prêts, subventions et dotations.
 */

export interface CDCProgram {
  url: string;
  title: string;
  summary: string;
  themes: string[];
  funder: string;
  eligibleEntities?: string[];
  minAmountEur?: number | null;
  maxAmountEur?: number | null;
}

const CDC_PROGRAMS: CDCProgram[] = [
  // ─── BANQUE DES TERRITOIRES (Caisse des Dépôts) ──────────────────
  {
    url: "https://www.banquedesterritoires.fr/financement-aides",
    title: "Banque des Territoires — Catalogue des financements",
    summary:
      "Plateforme de financement de la Caisse des Dépôts pour les territoires : prêts long terme, subventions d'ingénierie, fonds propres. Cible collectivités, bailleurs, économie mixte.",
    themes: ["Territoires", "Logement", "Aménagement"],
    funder: "Caisse des Dépôts (Banque des Territoires)",
    eligibleEntities: ["collectivite", "bailleur", "entreprise"],
    maxAmountEur: 50000000,
  },
  {
    url: "https://www.banquedesterritoires.fr/programme-action-coeur-de-ville",
    title: "Banque des Territoires — Action Cœur de Ville",
    summary:
      "Cofinancement (prêts + ingénierie) du programme Action Cœur de Ville (245 villes moyennes). Habitat, commerce, mobilité, équipements publics.",
    themes: ["Territoires", "Logement", "Commerce"],
    funder: "Caisse des Dépôts",
    eligibleEntities: ["collectivite"],
    maxAmountEur: 5000000,
  },
  {
    url: "https://www.banquedesterritoires.fr/programme-petites-villes-de-demain",
    title: "Banque des Territoires — Petites Villes de Demain",
    summary:
      "Cofinancement et ingénierie pour les petites villes (<20 000 habitants) du programme Petites Villes de Demain. Subventions d'études + prêts d'investissement.",
    themes: ["Territoires", "Ruralité"],
    funder: "Caisse des Dépôts",
    eligibleEntities: ["collectivite"],
    maxAmountEur: 1000000,
  },
  {
    url: "https://www.banquedesterritoires.fr/territoires-numeriques",
    title: "Banque des Territoires — Territoires Numériques",
    summary:
      "Soutien à la transformation numérique des territoires : très haut débit, services publics numériques, datacenters, smart city, inclusion numérique.",
    themes: ["Numérique", "Territoires"],
    funder: "Caisse des Dépôts",
    eligibleEntities: ["collectivite", "entreprise"],
    maxAmountEur: 5000000,
  },
  {
    url: "https://www.banquedesterritoires.fr/transition-ecologique-et-energetique",
    title: "Banque des Territoires — Transition écologique et énergétique",
    summary:
      "Prêts et investissements long terme pour la transition (Edu'Rénov, Cube.S, IntraCting, Enjeux climat). Cible collectivités, bailleurs sociaux, opérateurs publics.",
    themes: ["Environnement", "Énergie", "Bâtiment"],
    funder: "Caisse des Dépôts",
    eligibleEntities: ["collectivite", "bailleur"],
    maxAmountEur: 50000000,
  },
  {
    url: "https://www.banquedesterritoires.fr/cohesion-sociale-et-territoriale",
    title: "Banque des Territoires — Cohésion sociale et territoriale",
    summary:
      "Financement et ingénierie pour la cohésion sociale : ESS, économie circulaire, NEET, inclusion numérique, lutte contre la précarité.",
    themes: ["Solidarité", "ESS", "Inclusion"],
    funder: "Caisse des Dépôts",
    eligibleEntities: ["collectivite", "association", "entreprise"],
    maxAmountEur: 1000000,
  },
  {
    url: "https://www.banquedesterritoires.fr/prets-au-secteur-public-local",
    title: "Banque des Territoires — Prêts au secteur public local",
    summary:
      "Prêts long terme (PHARE, Edu'Prêt, Aqua'Prêt, Prêt Énergie Bâtiment, Prêt Mobilité) pour les collectivités, syndicats et établissements publics.",
    themes: ["Territoires", "Aménagement"],
    funder: "Caisse des Dépôts",
    eligibleEntities: ["collectivite"],
    maxAmountEur: 100000000,
  },
  {
    url: "https://www.banquedesterritoires.fr/programme-territoires-dindustrie",
    title: "Banque des Territoires — Territoires d'Industrie",
    summary:
      "Soutien aux 184 Territoires d'Industrie : ingénierie, foncier, recrutement, transition énergétique, innovation. Cible collectivités, entreprises, partenaires.",
    themes: ["Territoires", "Industrie", "Emploi"],
    funder: "Caisse des Dépôts",
    eligibleEntities: ["collectivite", "entreprise"],
    maxAmountEur: 10000000,
  },
  {
    url: "https://www.caissedesdepots.fr/cdc-investissement-immobilier",
    title: "CDC Habitat — Logement intermédiaire",
    summary:
      "Filiale de la Caisse des Dépôts dédiée au logement intermédiaire et social. Acquisition / construction de logements pour salariés des classes moyennes.",
    themes: ["Logement"],
    funder: "CDC Habitat",
    eligibleEntities: ["entreprise", "collectivite"],
    maxAmountEur: 100000000,
  },

  // ─── ACTION LOGEMENT ─────────────────────────────────────────────
  {
    url: "https://www.actionlogement.fr/",
    title: "Action Logement — Aides au logement des salariés",
    summary:
      "Organisme national finançant le logement des salariés du privé : aides à l'accession, mobilité, location, prêts travaux, garanties Visale.",
    themes: ["Logement", "Emploi"],
    funder: "Action Logement",
    eligibleEntities: ["entreprise", "association"],
    maxAmountEur: 50000,
  },
  {
    url: "https://groupe.actionlogement.fr/fondation-action-logement",
    title: "Fondation Action Logement",
    summary:
      "Fondation d'entreprise du groupe Action Logement. Soutient les associations qui œuvrent pour le logement, l'hébergement d'urgence et l'inclusion par le logement.",
    themes: ["Logement", "Solidarité", "Précarité"],
    funder: "Fondation Action Logement",
    eligibleEntities: ["association"],
    maxAmountEur: 100000,
  },
  {
    url: "https://groupe.actionlogement.fr/plan-investissement-volontaire",
    title: "Action Logement — Plan d'Investissement Volontaire",
    summary:
      "9 Md€ engagés (2019-2024) pour la rénovation de quartiers, l'accession sociale, la transformation de bureaux en logements. Cible collectivités, bailleurs.",
    themes: ["Logement", "Aménagement"],
    funder: "Action Logement",
    eligibleEntities: ["collectivite", "bailleur"],
    maxAmountEur: 5000000,
  },

  // ─── ANRU (rénovation urbaine) ───────────────────────────────────
  {
    url: "https://www.anru.fr/",
    title: "ANRU — Agence Nationale pour la Rénovation Urbaine",
    summary:
      "Subventions et prêts bonifiés pour la transformation des quartiers prioritaires (NPNRU, ANRU+, Quartiers Résilients, Quartiers Fertiles). 12 Md€ engagés.",
    themes: ["Politique de la ville", "Logement", "Aménagement"],
    funder: "ANRU",
    eligibleEntities: ["collectivite", "bailleur"],
    maxAmountEur: 50000000,
  },
  {
    url: "https://www.anru.fr/quartiers-fertiles",
    title: "ANRU — Quartiers Fertiles (agriculture urbaine)",
    summary:
      "AAP soutenant l'agriculture urbaine dans les quartiers en rénovation : jardins, maraîchage, fermes urbaines, légumeries, tiers-lieux nourriciers.",
    themes: ["Agriculture", "Politique de la ville", "Alimentation"],
    funder: "ANRU",
    eligibleEntities: ["association", "collectivite", "entreprise"],
    maxAmountEur: 1500000,
  },
  {
    url: "https://www.anru.fr/quartiers-resilients",
    title: "ANRU — Quartiers Résilients",
    summary:
      "AAP soutenant la transition écologique et l'adaptation climatique des quartiers prioritaires : renaturation, énergie, mobilité.",
    themes: ["Politique de la ville", "Environnement", "Climat"],
    funder: "ANRU",
    eligibleEntities: ["collectivite", "bailleur", "association"],
    maxAmountEur: 2000000,
  },

  // ─── BPI / FRANCE 2030 (entrées portail) ─────────────────────────
  {
    url: "https://www.bpifrance.fr/nos-actualites/france-2030-decouvrez-tous-les-appels-a-projets-en-cours",
    title: "France 2030 — Appels à projets",
    summary:
      "Plan national d'investissement (54 Md€) géré par le SGPI / Bpifrance / ADEME / ANR. AAP sur l'innovation, la souveraineté, la décarbonation, la santé.",
    themes: ["Innovation", "Industrie", "Recherche"],
    funder: "État / Bpifrance / ANR / ADEME",
    eligibleEntities: ["entreprise", "recherche", "pme"],
    maxAmountEur: 50000000,
  },
  {
    url: "https://www.economie.gouv.fr/territoires-d-innovation",
    title: "France 2030 — Territoires d'innovation",
    summary:
      "Volet territorial de France 2030 : appels à projets pour démontrer des solutions innovantes à l'échelle d'un territoire (mobilité, santé, alimentation, énergie).",
    themes: ["Innovation", "Territoires"],
    funder: "État / Bpifrance",
    eligibleEntities: ["collectivite", "entreprise", "association"],
    maxAmountEur: 10000000,
  },
];

export async function fetchCDCPrograms(): Promise<CDCProgram[]> {
  console.log(`[CDC / Action Logement / ANRU] ${CDC_PROGRAMS.length} programmes curés`);
  return CDC_PROGRAMS;
}

export function transformCDCToGrant(p: CDCProgram) {
  return {
    sourceUrl: p.url,
    sourceName: "Caisse des Dépôts / Action Logement / ANRU",
    title: p.title,
    summary: p.summary,
    rawContent: p.summary,
    funder: p.funder,
    country: "FR",
    thematicAreas: p.themes,
    eligibleEntities: p.eligibleEntities ?? ["collectivite", "association"],
    eligibleCountries: ["FR"],
    minAmountEur: p.minAmountEur ?? 50000,
    maxAmountEur: p.maxAmountEur ?? 1000000,
    coFinancingRequired: true,
    deadline: null,
    grantType: "subvention",
    language: "fr",
    status: "active",
    aiSummary: null,
  };
}
