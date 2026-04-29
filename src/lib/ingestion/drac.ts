/**
 * DRAC — Directions Régionales des Affaires Culturelles
 *
 * Services déconcentrés du Ministère de la Culture (13 DRAC en métropole +
 * DAC outre-mer). Premier financeur public de la culture en région :
 * spectacle vivant, patrimoine, musées, archives, livre & lecture, arts
 * plastiques, cinéma, EAC.
 *
 * Les AAP DRAC sont publiés sur les portails régionaux culture.gouv.fr.
 * On référence ici les portails DRAC + les grands dispositifs récurrents.
 */

export interface DRACProgram {
  url: string;
  title: string;
  summary: string;
  themes: string[];
  funder: string;
  region?: string;
  eligibleEntities?: string[];
  minAmountEur?: number | null;
  maxAmountEur?: number | null;
}

const DRAC_PROGRAMS: DRACProgram[] = [
  // ─── 13 DRAC MÉTROPOLE + DAC OUTRE-MER ──────────────────────────
  {
    url: "https://www.culture.gouv.fr/Regions/DRAC-Auvergne-Rhone-Alpes",
    title: "DRAC Auvergne-Rhône-Alpes",
    summary:
      "Direction régionale des affaires culturelles AURA. Subventions aux associations culturelles, compagnies, festivals, lieux : spectacle vivant, patrimoine, musées, archives, livre, arts visuels, EAC.",
    themes: ["Culture", "Patrimoine", "Spectacle vivant"],
    funder: "DRAC Auvergne-Rhône-Alpes",
    region: "Auvergne-Rhône-Alpes",
    eligibleEntities: ["association", "collectivite", "entreprise"],
    maxAmountEur: 200000,
  },
  {
    url: "https://www.culture.gouv.fr/Regions/Drac-Bourgogne-Franche-Comte",
    title: "DRAC Bourgogne-Franche-Comté",
    summary:
      "Direction régionale des affaires culturelles BFC. Subventions, conventionnements et résidences pour les acteurs culturels régionaux.",
    themes: ["Culture", "Patrimoine"],
    funder: "DRAC Bourgogne-Franche-Comté",
    region: "Bourgogne-Franche-Comté",
    eligibleEntities: ["association", "collectivite"],
    maxAmountEur: 150000,
  },
  {
    url: "https://www.culture.gouv.fr/Regions/Drac-Bretagne",
    title: "DRAC Bretagne",
    summary:
      "Direction régionale des affaires culturelles Bretagne. Subventions aux acteurs culturels bretons : conventions, aides à la création, à la diffusion, au patrimoine, à l'EAC.",
    themes: ["Culture", "Patrimoine"],
    funder: "DRAC Bretagne",
    region: "Bretagne",
    eligibleEntities: ["association", "collectivite"],
    maxAmountEur: 200000,
  },
  {
    url: "https://www.culture.gouv.fr/Regions/Drac-Centre-Val-de-Loire",
    title: "DRAC Centre-Val de Loire",
    summary:
      "Direction régionale des affaires culturelles Centre-Val de Loire. Soutien aux opérateurs culturels du territoire : châteaux, festivals, scènes, EAC.",
    themes: ["Culture", "Patrimoine"],
    funder: "DRAC Centre-Val de Loire",
    region: "Centre-Val de Loire",
    eligibleEntities: ["association", "collectivite"],
    maxAmountEur: 150000,
  },
  {
    url: "https://www.culture.gouv.fr/Regions/Drac-Corse",
    title: "DRAC Corse",
    summary:
      "Direction régionale des affaires culturelles de Corse. Soutien aux acteurs culturels insulaires : patrimoine, langue corse, spectacle vivant.",
    themes: ["Culture", "Patrimoine", "Langues régionales"],
    funder: "DRAC Corse",
    region: "Corse",
    eligibleEntities: ["association", "collectivite"],
    maxAmountEur: 100000,
  },
  {
    url: "https://www.culture.gouv.fr/Regions/Drac-Grand-Est",
    title: "DRAC Grand Est",
    summary:
      "Direction régionale des affaires culturelles Grand Est. Subventions, conventionnement, résidences ; soutien aux acteurs culturels Alsace-Lorraine-Champagne-Ardenne.",
    themes: ["Culture", "Patrimoine"],
    funder: "DRAC Grand Est",
    region: "Grand Est",
    eligibleEntities: ["association", "collectivite"],
    maxAmountEur: 200000,
  },
  {
    url: "https://www.culture.gouv.fr/Regions/Drac-Hauts-de-France",
    title: "DRAC Hauts-de-France",
    summary:
      "Direction régionale des affaires culturelles Hauts-de-France. Soutien aux opérateurs culturels et associatifs du Nord-Pas-de-Calais et de Picardie.",
    themes: ["Culture", "Patrimoine"],
    funder: "DRAC Hauts-de-France",
    region: "Hauts-de-France",
    eligibleEntities: ["association", "collectivite"],
    maxAmountEur: 200000,
  },
  {
    url: "https://www.culture.gouv.fr/Regions/Drac-Ile-de-France",
    title: "DRAC Île-de-France",
    summary:
      "Direction régionale des affaires culturelles Île-de-France. Plus important budget DRAC. Subventions à la création, diffusion, patrimoine, livre, arts plastiques, EAC.",
    themes: ["Culture", "Patrimoine", "Spectacle vivant"],
    funder: "DRAC Île-de-France",
    region: "Île-de-France",
    eligibleEntities: ["association", "collectivite", "entreprise"],
    maxAmountEur: 500000,
  },
  {
    url: "https://www.culture.gouv.fr/Regions/Drac-Normandie",
    title: "DRAC Normandie",
    summary:
      "Direction régionale des affaires culturelles Normandie. Subventions aux acteurs culturels normands ; D-Day, patrimoine, festivals, scènes.",
    themes: ["Culture", "Patrimoine"],
    funder: "DRAC Normandie",
    region: "Normandie",
    eligibleEntities: ["association", "collectivite"],
    maxAmountEur: 150000,
  },
  {
    url: "https://www.culture.gouv.fr/Regions/Drac-Nouvelle-Aquitaine",
    title: "DRAC Nouvelle-Aquitaine",
    summary:
      "Direction régionale des affaires culturelles Nouvelle-Aquitaine. Plus grande région, soutien à un large éventail d'opérateurs culturels (Bordeaux, Limoges, Poitiers).",
    themes: ["Culture", "Patrimoine"],
    funder: "DRAC Nouvelle-Aquitaine",
    region: "Nouvelle-Aquitaine",
    eligibleEntities: ["association", "collectivite"],
    maxAmountEur: 250000,
  },
  {
    url: "https://www.culture.gouv.fr/Regions/Drac-Occitanie",
    title: "DRAC Occitanie",
    summary:
      "Direction régionale des affaires culturelles Occitanie. Soutien aux acteurs culturels (Toulouse, Montpellier) ; patrimoine cathare, occitan, festivals.",
    themes: ["Culture", "Patrimoine", "Langues régionales"],
    funder: "DRAC Occitanie",
    region: "Occitanie",
    eligibleEntities: ["association", "collectivite"],
    maxAmountEur: 200000,
  },
  {
    url: "https://www.culture.gouv.fr/Regions/Drac-Pays-de-la-Loire",
    title: "DRAC Pays de la Loire",
    summary:
      "Direction régionale des affaires culturelles Pays de la Loire. Subventions aux acteurs culturels (Nantes, Angers, Le Mans).",
    themes: ["Culture", "Patrimoine"],
    funder: "DRAC Pays de la Loire",
    region: "Pays de la Loire",
    eligibleEntities: ["association", "collectivite"],
    maxAmountEur: 150000,
  },
  {
    url: "https://www.culture.gouv.fr/Regions/Drac-Provence-Alpes-Cote-d-Azur",
    title: "DRAC Provence-Alpes-Côte d'Azur",
    summary:
      "Direction régionale des affaires culturelles PACA. Soutien aux acteurs culturels du Sud (Marseille, Nice, Avignon) ; festivals majeurs (Avignon, Aix).",
    themes: ["Culture", "Patrimoine"],
    funder: "DRAC PACA",
    region: "PACA",
    eligibleEntities: ["association", "collectivite"],
    maxAmountEur: 250000,
  },
  {
    url: "https://www.culture.gouv.fr/Regions/Dac-Guadeloupe",
    title: "DAC Guadeloupe",
    summary:
      "Direction des Affaires Culturelles de Guadeloupe. Soutien aux acteurs culturels antillais : patrimoine, créole, mémoire, spectacle vivant.",
    themes: ["Culture", "Patrimoine", "Outre-mer"],
    funder: "DAC Guadeloupe",
    region: "Guadeloupe",
    eligibleEntities: ["association", "collectivite"],
    maxAmountEur: 80000,
  },
  {
    url: "https://www.culture.gouv.fr/Regions/Dac-Martinique",
    title: "DAC Martinique",
    summary:
      "Direction des Affaires Culturelles de Martinique. Soutien aux acteurs culturels martiniquais.",
    themes: ["Culture", "Patrimoine", "Outre-mer"],
    funder: "DAC Martinique",
    region: "Martinique",
    eligibleEntities: ["association", "collectivite"],
    maxAmountEur: 80000,
  },
  {
    url: "https://www.culture.gouv.fr/Regions/Dac-Guyane",
    title: "DAC Guyane",
    summary:
      "Direction des Affaires Culturelles de Guyane. Soutien à la diversité culturelle (créole, amérindiens, bushinengués).",
    themes: ["Culture", "Patrimoine", "Outre-mer"],
    funder: "DAC Guyane",
    region: "Guyane",
    eligibleEntities: ["association", "collectivite"],
    maxAmountEur: 80000,
  },
  {
    url: "https://www.culture.gouv.fr/Regions/Dac-La-Reunion",
    title: "DAC La Réunion",
    summary:
      "Direction des Affaires Culturelles de La Réunion. Soutien aux acteurs culturels réunionnais : patrimoine, maloya, musique, théâtre.",
    themes: ["Culture", "Patrimoine", "Outre-mer"],
    funder: "DAC La Réunion",
    region: "La Réunion",
    eligibleEntities: ["association", "collectivite"],
    maxAmountEur: 80000,
  },
  {
    url: "https://www.culture.gouv.fr/Regions/Dac-Mayotte",
    title: "DAC Mayotte",
    summary:
      "Direction des Affaires Culturelles de Mayotte. Soutien à la culture mahoraise et au développement culturel insulaire.",
    themes: ["Culture", "Patrimoine", "Outre-mer"],
    funder: "DAC Mayotte",
    region: "Mayotte",
    eligibleEntities: ["association", "collectivite"],
    maxAmountEur: 50000,
  },

  // ─── DISPOSITIFS DRAC RÉCURRENTS (transversaux à toutes les DRAC) ──
  {
    url: "https://www.culture.gouv.fr/Aides-demarches/Aides-par-secteur/Spectacle-vivant",
    title: "DRAC — Aides au spectacle vivant (compagnies & lieux)",
    summary:
      "Aides DRAC à la création, à la diffusion et au conventionnement des compagnies et lieux de spectacle vivant : théâtre, danse, cirque, marionnettes, musiques, arts de la rue.",
    themes: ["Culture", "Spectacle vivant"],
    funder: "DRAC (toutes régions)",
    eligibleEntities: ["association", "entreprise"],
    minAmountEur: 5000,
    maxAmountEur: 200000,
  },
  {
    url: "https://www.culture.gouv.fr/Aides-demarches/Aides-par-secteur/Patrimoines",
    title: "DRAC — Aides au patrimoine (MH, archéologie, ethnologie)",
    summary:
      "Aides DRAC pour la restauration de monuments historiques, fouilles archéologiques préventives, projets d'inventaire et d'ethnologie régionale.",
    themes: ["Culture", "Patrimoine"],
    funder: "DRAC (toutes régions)",
    eligibleEntities: ["collectivite", "association", "entreprise"],
    minAmountEur: 10000,
    maxAmountEur: 500000,
  },
  {
    url: "https://www.culture.gouv.fr/Aides-demarches/Aides-par-secteur/Musees",
    title: "DRAC — Aides aux musées (acquisitions, restauration, programmation)",
    summary:
      "Soutien aux musées de France en région : acquisitions d'œuvres (FRAM/FRAR), restauration de collections, programmation, médiation, numérisation.",
    themes: ["Culture", "Musées", "Patrimoine"],
    funder: "DRAC (toutes régions)",
    eligibleEntities: ["association", "collectivite"],
    maxAmountEur: 200000,
  },
  {
    url: "https://www.culture.gouv.fr/Aides-demarches/Aides-par-secteur/Livre-et-lecture",
    title: "DRAC — Aides livre & lecture",
    summary:
      "Soutien aux librairies indépendantes, aux maisons d'édition régionales, aux bibliothèques (CTL — Contrats Territoire Lecture), résidences d'auteurs.",
    themes: ["Culture", "Livre", "Lecture"],
    funder: "DRAC (toutes régions)",
    eligibleEntities: ["association", "entreprise", "collectivite"],
    maxAmountEur: 100000,
  },
  {
    url: "https://www.culture.gouv.fr/Aides-demarches/Aides-par-secteur/Arts-plastiques",
    title: "DRAC — Aides arts plastiques & visuels",
    summary:
      "Aides DRAC aux artistes-auteurs, galeries associatives, FRAC (Fonds régionaux d'art contemporain), résidences, achats d'œuvres.",
    themes: ["Culture", "Arts plastiques", "Création"],
    funder: "DRAC (toutes régions)",
    eligibleEntities: ["association", "entreprise"],
    maxAmountEur: 80000,
  },
  {
    url: "https://www.culture.gouv.fr/Aides-demarches/Aides-par-secteur/Education-artistique-et-culturelle",
    title: "DRAC — Éducation artistique et culturelle (EAC)",
    summary:
      "Aides DRAC pour les projets d'éducation artistique et culturelle : résidences en milieu scolaire, parcours culturels, projets territoriaux d'EAC, contrats locaux d'éducation artistique.",
    themes: ["Culture", "Éducation"],
    funder: "DRAC (toutes régions)",
    eligibleEntities: ["association", "ecole", "collectivite"],
    maxAmountEur: 50000,
  },
  {
    url: "https://www.culture.gouv.fr/Aides-demarches/Aides-par-secteur/Action-culturelle-et-territoriale",
    title: "DRAC — Action culturelle et territoriale (Culture & ruralité, QPV)",
    summary:
      "Soutien aux projets culturels en zones rurales (Culture & Ruralité), QPV (politique de la ville), publics empêchés (hôpital, prison, handicap).",
    themes: ["Culture", "Solidarité", "Territoires"],
    funder: "DRAC (toutes régions)",
    eligibleEntities: ["association", "collectivite"],
    maxAmountEur: 50000,
  },
  {
    url: "https://www.culture.gouv.fr/Aides-demarches/Aides-par-secteur/Cinema-audiovisuel-multimedia",
    title: "DRAC — Cinéma, audiovisuel, multimédia (relais CNC)",
    summary:
      "Cofinancement DRAC/Région/CNC sur les conventions territoriales : aide à la création, diffusion, exploitation, éducation à l'image.",
    themes: ["Culture", "Audiovisuel", "Cinéma"],
    funder: "DRAC (toutes régions)",
    eligibleEntities: ["association", "entreprise"],
    maxAmountEur: 100000,
  },
];

export async function fetchDRACPrograms(): Promise<DRACProgram[]> {
  console.log(`[DRAC] ${DRAC_PROGRAMS.length} programmes curés`);
  return DRAC_PROGRAMS;
}

export function transformDRACToGrant(p: DRACProgram) {
  return {
    sourceUrl: p.url,
    sourceName: "DRAC — Directions Régionales des Affaires Culturelles",
    title: p.title,
    summary: p.summary,
    rawContent: p.summary,
    funder: p.funder,
    country: "FR",
    thematicAreas: p.themes,
    eligibleEntities: p.eligibleEntities ?? ["association", "collectivite"],
    eligibleCountries: ["FR"],
    targetRegions: p.region ? [p.region] : null,
    minAmountEur: p.minAmountEur ?? 2000,
    maxAmountEur: p.maxAmountEur ?? 100000,
    coFinancingRequired: true,
    deadline: null,
    grantType: "subvention",
    language: "fr",
    status: "active",
    aiSummary: null,
  };
}
