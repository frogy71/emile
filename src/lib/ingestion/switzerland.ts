/**
 * Sources suisses — coopération internationale & fondations
 *
 * La Suisse est un bailleur historique de la solidarité internationale
 * (DDC) et abrite un écosystème exceptionnellement dense de fondations
 * privées (~13 000 fondations, 100 Md CHF d'actifs).
 *
 * On référence ici :
 *  - DDC (Direction du Développement et de la Coopération) — bailleur public
 *  - Pro Helvetia — culture
 *  - SNF / Innosuisse — recherche & innovation
 *  - Grandes fondations privées (Drosos, Gebert Rüf, Mercator Suisse,
 *    Oak, MAVA legacy, Schmidheiny…)
 */

export interface SwissProgram {
  url: string;
  title: string;
  summary: string;
  themes: string[];
  funder: string;
  eligibleEntities?: string[];
  eligibleCountries?: string[];
  minAmountEur?: number | null;
  maxAmountEur?: number | null;
}

const SWISS_PROGRAMS: SwissProgram[] = [
  // ─── DDC — COOPÉRATION SUISSE ────────────────────────────────────
  {
    url: "https://www.eda.admin.ch/deza/fr/home.html",
    title: "DDC — Direction du Développement et de la Coopération",
    summary:
      "Agence suisse de coopération internationale (DFAE). Coopération bilatérale, multilatérale, aide humanitaire, coopération avec l'Europe de l'Est. Budget annuel ~3 Md CHF.",
    themes: ["Solidarité internationale", "Coopération", "Humanitaire"],
    funder: "DDC / DFAE Suisse",
    eligibleEntities: ["ong", "association"],
    eligibleCountries: ["CH", "EU"],
    maxAmountEur: 5000000,
  },
  {
    url: "https://www.eda.admin.ch/deza/fr/home/partenariats-mandats/partenariats-organisations-suisses.html",
    title: "DDC — Partenariats avec les ONG suisses",
    summary:
      "Contributions de programme DDC aux ONG suisses (~30 ONG partenaires) et soutien aux fédérations (Alliance Sud, Unité). Cofinancement de programmes pluriannuels.",
    themes: ["Solidarité internationale", "Coopération"],
    funder: "DDC",
    eligibleEntities: ["ong", "association"],
    eligibleCountries: ["CH"],
    maxAmountEur: 10000000,
  },
  {
    url: "https://www.eda.admin.ch/deza/fr/home/aide-humanitaire-csa/aide-humanitaire-suisse.html",
    title: "DDC — Aide humanitaire suisse",
    summary:
      "Volet aide humanitaire de la DDC : urgences, réhabilitation, prévention, Corps Suisse d'Aide Humanitaire (CSA). Partenariats avec ONG, organisations multilatérales et CICR.",
    themes: ["Humanitaire", "Solidarité internationale"],
    funder: "DDC — Aide humanitaire",
    eligibleEntities: ["ong"],
    eligibleCountries: ["CH"],
    maxAmountEur: 5000000,
  },
  {
    url: "https://www.seco-cooperation.admin.ch/secocoop/fr/home.html",
    title: "SECO — Coopération économique au développement",
    summary:
      "Volet coopération économique au développement du Secrétariat d'État à l'Économie. Soutien à la croissance durable et à l'intégration aux marchés des pays partenaires.",
    themes: ["Solidarité internationale", "Économie", "Coopération"],
    funder: "SECO Suisse",
    eligibleEntities: ["ong", "entreprise", "recherche"],
    eligibleCountries: ["CH"],
    maxAmountEur: 5000000,
  },

  // ─── PRO HELVETIA ────────────────────────────────────────────────
  {
    url: "https://prohelvetia.ch/fr/encouragement/",
    title: "Pro Helvetia — Fondation suisse pour la culture",
    summary:
      "Fondation suisse pour la culture (~50 M CHF/an). Soutien à la création artistique suisse et à la mobilité internationale : arts visuels, musique, théâtre, danse, littérature, design, médiation culturelle.",
    themes: ["Culture", "Création", "International"],
    funder: "Pro Helvetia",
    eligibleEntities: ["association", "entreprise"],
    eligibleCountries: ["CH"],
    maxAmountEur: 200000,
  },

  // ─── RECHERCHE & INNOVATION ─────────────────────────────────────
  {
    url: "https://www.snf.ch/fr/9o5ezhlSV3y0bAEK/page/encouragement",
    title: "FNS — Fonds National Suisse de la Recherche Scientifique",
    summary:
      "Principal organisme suisse de financement de la recherche fondamentale. Bourses individuelles, projets, programmes nationaux de recherche (PNR), pôles de recherche nationaux (PRN).",
    themes: ["Recherche", "Innovation"],
    funder: "FNS Suisse",
    eligibleEntities: ["recherche", "universite"],
    eligibleCountries: ["CH"],
    maxAmountEur: 5000000,
  },
  {
    url: "https://www.innosuisse.ch/inno/fr/home.html",
    title: "Innosuisse — Agence suisse pour l'encouragement de l'innovation",
    summary:
      "Agence fédérale pour l'innovation : projets d'innovation collaboratifs (start-up + recherche), programmes de mentorat, labels Swiss Startup, internationalisation.",
    themes: ["Innovation", "Entreprises", "Recherche"],
    funder: "Innosuisse",
    eligibleEntities: ["entreprise", "recherche"],
    eligibleCountries: ["CH"],
    maxAmountEur: 5000000,
  },

  // ─── FONDATIONS PRIVÉES MAJEURES ─────────────────────────────────
  {
    url: "https://drosos.org/fr/",
    title: "Fondation Drosos",
    summary:
      "Fondation suisse opérationnelle (Zurich). Soutient des projets dans 4 régions : Allemagne, Égypte, Tunisie, Suisse, et thématiques : innovation sociale et culturelle pour les jeunes vulnérables.",
    themes: ["Jeunesse", "Innovation sociale", "Culture", "Solidarité"],
    funder: "Fondation Drosos",
    eligibleEntities: ["association", "ong"],
    eligibleCountries: ["EU"],
    maxAmountEur: 500000,
  },
  {
    url: "https://www.grstiftung.ch/fr/projects/funding-opportunities.html",
    title: "Fondation Gebert Rüf",
    summary:
      "Fondation suisse soutenant la science et l'innovation au service de la société. Programmes phares : InnoBooster, Pioneer Fellowships, BREF (impact sciences sociales), First Ventures.",
    themes: ["Recherche", "Innovation", "Sciences"],
    funder: "Fondation Gebert Rüf",
    eligibleEntities: ["recherche", "universite", "entreprise"],
    eligibleCountries: ["CH"],
    maxAmountEur: 1000000,
  },
  {
    url: "https://www.stiftung-mercator.ch/fr/",
    title: "Fondation Mercator Suisse",
    summary:
      "Branche suisse de Mercator. Soutient des projets en faveur des jeunes (engagement, formation, internationalisation), de l'éducation à l'environnement et à la science.",
    themes: ["Jeunesse", "Éducation", "Environnement"],
    funder: "Fondation Mercator Suisse",
    eligibleEntities: ["association", "recherche"],
    eligibleCountries: ["CH"],
    maxAmountEur: 300000,
  },
  {
    url: "https://oakfnd.org/funding/",
    title: "Oak Foundation (Genève)",
    summary:
      "Fondation philanthropique internationale basée à Genève. Cible : droits humains, environnement, problèmes liés à la maltraitance des enfants, logement, droits internationaux des LGBTQI+.",
    themes: ["Droits humains", "Environnement", "Enfance", "International"],
    funder: "Oak Foundation",
    eligibleEntities: ["ong", "association", "recherche"],
    eligibleCountries: ["CH", "EU"],
    maxAmountEur: 2000000,
  },
  {
    url: "https://www.fondation-leenaards.ch/appels-a-projets/",
    title: "Fondation Leenaards (Lausanne)",
    summary:
      "Fondation lausannoise active dans la culture, le bien vieillir et la science (santé). AAP transversaux Bourses Culture, Qualité de vie 65+, Recherche médicale translationnelle.",
    themes: ["Culture", "Santé", "Vieillissement"],
    funder: "Fondation Leenaards",
    eligibleEntities: ["association", "recherche"],
    eligibleCountries: ["CH"],
    maxAmountEur: 500000,
  },
  {
    url: "https://www.fondation-philanthropia.org/fr",
    title: "Fondation Philanthropia (Lombard Odier)",
    summary:
      "Fondation faîtière abritante à Genève (Lombard Odier). 100+ fondations abritées avec philanthropes individuels. Subventions sur tous secteurs.",
    themes: ["Philanthropie", "Solidarité"],
    funder: "Fondation Philanthropia",
    eligibleEntities: ["association", "ong"],
    eligibleCountries: ["CH", "EU"],
    maxAmountEur: 500000,
  },
  {
    url: "https://www.swissphilanthropy.ch/",
    title: "Fondation suisse de la philanthropie (Swiss Philanthropy Foundation)",
    summary:
      "Fondation faîtière abritante (Genève). Permet à des particuliers et entreprises d'exercer leur philanthropie de manière structurée. Subventions à des projets dans tous secteurs.",
    themes: ["Philanthropie", "Solidarité"],
    funder: "Swiss Philanthropy Foundation",
    eligibleEntities: ["association", "ong"],
    eligibleCountries: ["CH", "EU"],
    maxAmountEur: 200000,
  },
  {
    url: "https://www.fondationschmidheiny.ch/fr/",
    title: "Fondation Stephan Schmidheiny / Avina",
    summary:
      "Fondations Schmidheiny / Avina : développement durable, leadership en Amérique latine, biodiversité. Soutien à des projets de transformation sociale et environnementale.",
    themes: ["Environnement", "Développement durable", "Leadership"],
    funder: "Fondation Avina / Schmidheiny",
    eligibleEntities: ["ong", "association"],
    eligibleCountries: ["CH"],
    maxAmountEur: 500000,
  },
  {
    url: "https://www.botnar.org/funding/",
    title: "Fondation Botnar (Bâle)",
    summary:
      "Fondation suisse dédiée à la santé et au bien-être des jeunes (12-24 ans) dans les villes des pays à revenu intermédiaire. Approche tech for good et communautés.",
    themes: ["Jeunesse", "Santé", "Numérique", "International"],
    funder: "Fondation Botnar",
    eligibleEntities: ["ong", "association", "recherche"],
    eligibleCountries: ["CH", "EU"],
    maxAmountEur: 1000000,
  },
  {
    url: "https://www.fondation-juvene.org/",
    title: "Fondation Juvene (Genève)",
    summary:
      "Fondation genevoise dédiée aux enfants et jeunes en situation de vulnérabilité (Genève + International). Subventions aux associations partenaires.",
    themes: ["Enfance", "Jeunesse", "Solidarité"],
    funder: "Fondation Juvene",
    eligibleEntities: ["association", "ong"],
    eligibleCountries: ["CH"],
    maxAmountEur: 100000,
  },
  {
    url: "https://www.partage.ch/fondations/",
    title: "Fondation Partage Genève",
    summary:
      "Plateforme genevoise réunissant des fondations partenaires soutenant la lutte contre la précarité, l'aide alimentaire et l'insertion sociale en Suisse romande.",
    themes: ["Solidarité", "Précarité", "Aide alimentaire"],
    funder: "Fondation Partage",
    eligibleEntities: ["association"],
    eligibleCountries: ["CH"],
    maxAmountEur: 100000,
  },
  {
    url: "https://www.fondationhans-wilsdorf.ch/",
    title: "Fondation Hans Wilsdorf (Genève)",
    summary:
      "Importante fondation genevoise (~CHF 500 M de dotations). Soutien à des projets d'intérêt général : sciences, recherche, culture, social, formation, en particulier dans le canton de Genève.",
    themes: ["Recherche", "Culture", "Solidarité"],
    funder: "Fondation Hans Wilsdorf",
    eligibleEntities: ["association", "ong", "recherche"],
    eligibleCountries: ["CH"],
    maxAmountEur: 1000000,
  },
  {
    url: "https://www.swissfoundations.ch/",
    title: "SwissFoundations — Réseau des fondations suisses donatrices",
    summary:
      "Association faîtière des fondations donatrices suisses (~190 membres). Outil de découverte et de mise en relation. Standards de bonne pratique du secteur philanthropique.",
    themes: ["Philanthropie"],
    funder: "SwissFoundations",
    eligibleEntities: ["association", "ong"],
    eligibleCountries: ["CH"],
    maxAmountEur: 0,
  },
];

export async function fetchSwissPrograms(): Promise<SwissProgram[]> {
  console.log(`[Suisse] ${SWISS_PROGRAMS.length} programmes curés`);
  return SWISS_PROGRAMS;
}

export function transformSwissToGrant(p: SwissProgram) {
  return {
    sourceUrl: p.url,
    sourceName: "Suisse (DDC + fondations)",
    title: p.title,
    summary: p.summary,
    rawContent: p.summary,
    funder: p.funder,
    country: "CH",
    thematicAreas: p.themes,
    eligibleEntities: p.eligibleEntities ?? ["association", "ong"],
    eligibleCountries: p.eligibleCountries ?? ["CH"],
    minAmountEur: p.minAmountEur ?? 10000,
    maxAmountEur: p.maxAmountEur ?? 500000,
    coFinancingRequired: false,
    deadline: null,
    grantType: "fondation",
    language: "fr",
    status: "active",
    aiSummary: null,
  };
}
