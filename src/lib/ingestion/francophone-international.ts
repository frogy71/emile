/**
 * Bailleurs francophones internationaux
 *
 * En complément des bailleurs nationaux et européens, beaucoup
 * d'organisations francophones (Canada, Luxembourg, Monaco, OIF, AUF,
 * Québec) financent des projets associatifs, culturels, scientifiques
 * ou de coopération impliquant des partenaires français ou des pays
 * francophones du Sud. Ces guichets sont peu connus et rarement
 * référencés dans les bases nationales — d'où l'intérêt d'une source
 * curée dédiée.
 *
 * Couverture :
 *  • CRDI/IDRC (Canada) — recherche pour le développement
 *  • LuxDev (Luxembourg) — coopération bilatérale
 *  • Monaco DCI — coopération internationale
 *  • OIF — Organisation Internationale de la Francophonie
 *  • AUF — Agence Universitaire de la Francophonie
 *  • Québec MRIF / Wallonie-Bruxelles International (rappel)
 *  • FFEM — Fonds Français pour l'Environnement Mondial
 */

export interface FrancophoneProgram {
  url: string;
  title: string;
  summary: string;
  themes: string[];
  funder: string;
  /** Pays ou organisation d'origine du bailleur. */
  origin: string;
  eligibleEntities?: string[];
  /** Cibles géographiques des projets. */
  eligibleCountries?: string[];
  minAmountEur?: number | null;
  maxAmountEur?: number | null;
  /** Langue dominante du dispositif. */
  language?: "fr" | "en";
}

const FRANCOPHONE_PROGRAMS: FrancophoneProgram[] = [
  // ─── CANADA — CRDI / IDRC ────────────────────────────────────────
  {
    url: "https://www.idrc.ca/fr/financement",
    title: "CRDI Canada — Centre de recherches pour le développement international",
    summary:
      "Société d'État canadienne (260 M$ CAD/an) qui finance la recherche pour le développement dans les pays du Sud. Subventions à des chercheurs, instituts et ONG (en partenariat avec des universités du Sud). Champs : changement climatique, santé, alimentation, démocratie, économies inclusives.",
    themes: ["Recherche", "Développement", "Climat", "Santé"],
    funder: "Centre de recherches pour le développement international (CRDI)",
    origin: "Canada",
    eligibleEntities: ["recherche", "ong", "association"],
    eligibleCountries: ["FR", "CA", "ALL"],
    minAmountEur: 50000,
    maxAmountEur: 1500000,
  },
  {
    url: "https://www.idrc.ca/fr/financement/possibilites-financement",
    title: "CRDI — Possibilités de financement (AAP)",
    summary:
      "Catalogue des appels à propositions ouverts du CRDI. Programmes phares : CLARE (climat & résilience), Initiative pour les biens climatiques mondiaux, FCRSAI (sécurité alimentaire), Cultiver l'avenir de l'Afrique. Cofinancement avec FCDO (UK), Sida (Suède), AFD souvent.",
    themes: ["Recherche", "Climat", "Alimentation", "Développement"],
    funder: "CRDI",
    origin: "Canada",
    eligibleEntities: ["recherche", "ong", "association"],
    eligibleCountries: ["FR", "ALL"],
    minAmountEur: 100000,
    maxAmountEur: 2000000,
  },
  {
    url: "https://www.idrc.ca/fr/financement/bourses-de-recherche-et-bourses-detudes-superieures",
    title: "CRDI — Bourses de recherche et d'études supérieures",
    summary:
      "Bourses individuelles du CRDI pour chercheurs en début de carrière, doctorants et postdoctorants travaillant sur le développement international. Plusieurs programmes : Bourses de recherche, Bourses doctorales, Programmes thématiques.",
    themes: ["Recherche", "Bourses", "Développement"],
    funder: "CRDI",
    origin: "Canada",
    eligibleEntities: ["recherche", "etudiant"],
    eligibleCountries: ["FR", "ALL"],
    minAmountEur: 15000,
    maxAmountEur: 50000,
  },

  // ─── LUXEMBOURG — LUXDEV / MAEE ──────────────────────────────────
  {
    url: "https://luxdev.lu/fr",
    title: "LuxDev — Agence luxembourgeoise pour la Coopération au développement",
    summary:
      "Agence d'exécution de la coopération bilatérale du Luxembourg (~430 M€ APD/an, l'un des taux APD/PIB les plus élevés au monde). Pays partenaires : Burkina, Mali, Niger, Sénégal, Cabo Verde, Laos, Vietnam, Salvador, Nicaragua. Mise en œuvre : ONG, opérateurs publics.",
    themes: ["Solidarité internationale", "Coopération", "Développement"],
    funder: "LuxDev / MAEE Luxembourg",
    origin: "Luxembourg",
    eligibleEntities: ["ong", "association", "entreprise"],
    eligibleCountries: ["LU", "EU"],
    maxAmountEur: 5000000,
  },
  {
    url: "https://cooperation.gouvernement.lu/fr/financement.html",
    title: "Luxembourg — Cofinancement ONG par le MAEE",
    summary:
      "Dispositif de cofinancement luxembourgeois des ONG (jusqu'à 80 % de cofinancement). Accords-cadres pluriannuels avec les ONG agréées, AAP réguliers pour la sensibilisation, l'éducation au développement et l'aide humanitaire. Ouvert aux ONG luxembourgeoises et leurs partenaires (souvent franco-belges).",
    themes: ["Solidarité internationale", "Humanitaire", "Éducation au développement"],
    funder: "MAEE Luxembourg — Direction de la coopération",
    origin: "Luxembourg",
    eligibleEntities: ["ong", "association"],
    eligibleCountries: ["LU"],
    maxAmountEur: 1500000,
  },
  {
    url: "https://cooperation.gouvernement.lu/fr/financement/aide-humanitaire.html",
    title: "Luxembourg — Aide humanitaire",
    summary:
      "Volet humanitaire de la coopération luxembourgeoise. Soutien aux ONG humanitaires luxembourgeoises (Médecins Sans Frontières-Lux, Caritas, Croix-Rouge…) pour les urgences, la prévention et la réhabilitation. Fonds discrétionnaire pour réponses rapides.",
    themes: ["Humanitaire", "Solidarité internationale"],
    funder: "MAEE Luxembourg",
    origin: "Luxembourg",
    eligibleEntities: ["ong"],
    eligibleCountries: ["LU"],
    maxAmountEur: 1000000,
  },

  // ─── MONACO — DIRECTION COOPÉRATION INTERNATIONALE ───────────────
  {
    url: "https://cooperation-monaco.gouv.mc/",
    title: "Monaco — Direction de la Coopération Internationale (DCI)",
    summary:
      "Coopération bilatérale de la Principauté de Monaco. ~25 M€/an, concentrés sur 12 pays partenaires (Maroc, Tunisie, Madagascar, Mali, Sénégal, Burkina, Liban, Mongolie…). Cofinance ONG monégasques et internationales : santé, éducation, environnement.",
    themes: ["Solidarité internationale", "Santé", "Éducation"],
    funder: "Direction de la Coopération Internationale — Monaco",
    origin: "Monaco",
    eligibleEntities: ["ong", "association"],
    eligibleCountries: ["MC", "FR"],
    maxAmountEur: 500000,
  },
  {
    url: "https://cooperation-monaco.gouv.mc/Aide-d-urgence-aide-post-urgence-et-actions-humanitaires",
    title: "Monaco DCI — Aide d'urgence et action humanitaire",
    summary:
      "Volet humanitaire de la coopération monégasque : aide d'urgence, post-urgence, soutien aux populations déplacées et aux victimes de catastrophes. Réponse rapide via partenariats avec ONG humanitaires francophones.",
    themes: ["Humanitaire", "Urgence"],
    funder: "DCI Monaco",
    origin: "Monaco",
    eligibleEntities: ["ong"],
    eligibleCountries: ["MC", "FR"],
    maxAmountEur: 200000,
  },
  {
    url: "https://www.fpa2.org/aides-fr",
    title: "Fondation Prince Albert II de Monaco",
    summary:
      "Fondation environnementale du Prince Albert II. Soutient les projets sur le climat, la biodiversité, l'eau, particulièrement en Méditerranée, en Arctique et dans les pays en développement. AAP réguliers + soutiens directs.",
    themes: ["Environnement", "Climat", "Biodiversité", "Mer"],
    funder: "Fondation Prince Albert II",
    origin: "Monaco",
    eligibleEntities: ["association", "ong", "recherche"],
    eligibleCountries: ["MC", "FR", "EU", "ALL"],
    maxAmountEur: 500000,
  },

  // ─── OIF — ORGANISATION INTERNATIONALE DE LA FRANCOPHONIE ────────
  {
    url: "https://www.francophonie.org/appels-projets",
    title: "OIF — Appels à projets de la Francophonie",
    summary:
      "L'OIF (88 États, ~88 M€/an de programmes) finance des projets dans 5 axes : langue française, paix et démocratie, éducation et formation, développement durable, jeunesse et sport. AAP ouverts aux structures francophones du Nord et du Sud.",
    themes: ["Francophonie", "Culture", "Éducation", "Développement durable"],
    funder: "Organisation Internationale de la Francophonie (OIF)",
    origin: "OIF",
    eligibleEntities: ["association", "ong", "recherche", "ecole"],
    eligibleCountries: ["FR", "EU", "ALL"],
    maxAmountEur: 200000,
  },
  {
    url: "https://www.francophonie.org/programmation-jeunesse-1370",
    title: "OIF — Programmation Jeunesse & Volontariat international",
    summary:
      "Programmes OIF dédiés à la jeunesse francophone : Volontariat international de la Francophonie, AAP jeunesse, soutien aux entrepreneurs sociaux, mobilité, leadership citoyen. Réservé aux 21-34 ans et aux structures qui les accompagnent.",
    themes: ["Jeunesse", "Engagement", "Francophonie"],
    funder: "OIF",
    origin: "OIF",
    eligibleEntities: ["association", "ong"],
    eligibleCountries: ["FR", "EU", "ALL"],
    maxAmountEur: 100000,
  },
  {
    url: "https://www.francophonie.org/culture-1331",
    title: "OIF — Soutien à la création et aux industries culturelles",
    summary:
      "Volet culture de l'OIF : Fonds Image de la Francophonie (cinéma, audiovisuel, musique), aide à la circulation des artistes du Sud, soutien aux festivals et marchés francophones. Cofinance des structures francophones partout dans le monde.",
    themes: ["Culture", "Cinéma", "Musique", "Francophonie"],
    funder: "OIF",
    origin: "OIF",
    eligibleEntities: ["association", "entreprise"],
    eligibleCountries: ["FR", "EU", "ALL"],
    maxAmountEur: 200000,
  },
  {
    url: "https://www.francophonie.org/langue-francaise-1366",
    title: "OIF — Initiative francophone pour la formation à distance des maîtres (IFADEM)",
    summary:
      "Programme conjoint OIF / AUF de formation continue des enseignants du primaire dans les pays francophones du Sud. AAP pour des opérateurs locaux, structures de formation, plateformes pédagogiques.",
    themes: ["Éducation", "Formation", "Francophonie"],
    funder: "OIF / AUF",
    origin: "OIF",
    eligibleEntities: ["ecole", "association", "ong"],
    eligibleCountries: ["FR", "ALL"],
    maxAmountEur: 200000,
  },

  // ─── AUF — AGENCE UNIVERSITAIRE DE LA FRANCOPHONIE ───────────────
  {
    url: "https://www.auf.org/nos-actions/appels-doffres/",
    title: "AUF — Appels à projets et bourses",
    summary:
      "Réseau de plus de 1 000 universités francophones (130 pays). AAP réguliers : bourses de mobilité, soutien à la recherche partenariale, soutien à l'innovation pédagogique, projets structurants Nord-Sud, perfectionnement des enseignants-chercheurs.",
    themes: ["Recherche", "Enseignement supérieur", "Francophonie"],
    funder: "Agence Universitaire de la Francophonie (AUF)",
    origin: "AUF",
    eligibleEntities: ["universite", "recherche", "etudiant"],
    eligibleCountries: ["FR", "EU", "ALL"],
    minAmountEur: 5000,
    maxAmountEur: 100000,
  },
  {
    url: "https://www.auf.org/nouvelles/appels-a-candidatures/",
    title: "AUF — Appels à candidatures (mobilité, bourses)",
    summary:
      "Page de référence des appels à candidatures AUF : bourses de mobilité Sud-Nord et Nord-Sud, perfectionnement à la recherche, master, doctorat. Calendrier semestriel.",
    themes: ["Mobilité", "Bourses", "Recherche"],
    funder: "AUF",
    origin: "AUF",
    eligibleEntities: ["etudiant", "recherche"],
    eligibleCountries: ["FR", "ALL"],
    minAmountEur: 1000,
    maxAmountEur: 30000,
  },

  // ─── QUÉBEC ──────────────────────────────────────────────────────
  {
    url: "https://www.mrif.gouv.qc.ca/fr/relations-du-quebec/europe/france/programmes-de-cooperation",
    title: "Québec — MRIF, programmes de coopération France-Québec",
    summary:
      "Ministère des Relations internationales et de la Francophonie (Québec). Programmes de coopération France-Québec (Commission permanente France-Québec) sur la recherche, la jeunesse, la culture, l'environnement. Cofinancement bilatéral.",
    themes: ["Coopération", "Recherche", "Jeunesse", "Culture"],
    funder: "MRIF Québec",
    origin: "Québec",
    eligibleEntities: ["association", "recherche", "universite", "entreprise"],
    eligibleCountries: ["FR", "CA"],
    maxAmountEur: 100000,
  },
  {
    url: "https://www.lojiq.org/",
    title: "LOJIQ — Les Offices Jeunesse Internationaux du Québec",
    summary:
      "Organisme québécois de soutien à la mobilité internationale des jeunes (18-35 ans). Bourses pour stages, missions exploratoires, projets entrepreneuriaux et culturels. Programme phare avec la France via l'OFQJ (Office franco-québécois pour la jeunesse).",
    themes: ["Jeunesse", "Mobilité", "Francophonie"],
    funder: "LOJIQ / OFQJ",
    origin: "Québec",
    eligibleEntities: ["association", "etudiant"],
    eligibleCountries: ["FR", "CA"],
    minAmountEur: 500,
    maxAmountEur: 10000,
  },
  {
    url: "https://www.ofqj.org/programmes/",
    title: "OFQJ — Office franco-québécois pour la jeunesse",
    summary:
      "Pendant français de LOJIQ. Bourses de mobilité pour les 18-35 ans (stages, missions professionnelles, formations, projets culturels) entre la France et le Québec. Cofinancé par la France et le Québec.",
    themes: ["Jeunesse", "Mobilité", "Francophonie"],
    funder: "OFQJ",
    origin: "France-Québec",
    eligibleEntities: ["association", "etudiant", "entreprise"],
    eligibleCountries: ["FR"],
    minAmountEur: 500,
    maxAmountEur: 5000,
  },

  // ─── FFEM ────────────────────────────────────────────────────────
  {
    url: "https://www.ffem.fr/fr/appel-projets-ouverts",
    title: "FFEM — Fonds Français pour l'Environnement Mondial",
    summary:
      "Fonds bilatéral français cogéré par AFD, MEAE, MTECT, MASA, MESR. ~24 M€/an pour des projets environnementaux pilotes dans les pays en développement : biodiversité, climat, eaux internationales, dégradation des sols, polluants, couche d'ozone.",
    themes: ["Environnement", "Climat", "Biodiversité"],
    funder: "Fonds Français pour l'Environnement Mondial (FFEM)",
    origin: "France (multibailleur)",
    eligibleEntities: ["association", "ong", "recherche", "entreprise"],
    eligibleCountries: ["FR"],
    minAmountEur: 500000,
    maxAmountEur: 4000000,
  },
  {
    url: "https://www.ffem.fr/fr/programme-petites-initiatives",
    title: "FFEM — Programme Petites Initiatives (PPI)",
    summary:
      "Volet société civile du FFEM : ~3 M€/an pour des AAP ouverts aux ONG du Sud (avec partenaires français possibles). Biodiversité, climat, désertification. Subvention 30 k€ – 75 k€. Cible petits acteurs locaux.",
    themes: ["Environnement", "Biodiversité", "Climat"],
    funder: "FFEM (PPI)",
    origin: "France (multibailleur)",
    eligibleEntities: ["association", "ong"],
    eligibleCountries: ["FR", "ALL"],
    minAmountEur: 30000,
    maxAmountEur: 75000,
  },

  // ─── BELGIQUE — DGD (rappel ; détaillé dans belgium.ts) ─────────
  {
    url: "https://diplomatie.belgium.be/fr/politique/cooperation-au-developpement-et-aide-humanitaire",
    title: "Belgique — Coopération belge au développement (DGD)",
    summary:
      "Direction générale de la coopération au développement belge. ~470 M€/an de coopération bilatérale et multilatérale. Cofinance ONG belges (souvent francophones) et leurs partenaires Sud. Programmes thématiques : santé, agriculture, droits humains, environnement.",
    themes: ["Solidarité internationale", "Coopération", "Développement"],
    funder: "DGD Belgique",
    origin: "Belgique",
    eligibleEntities: ["ong", "association"],
    eligibleCountries: ["BE", "EU"],
    maxAmountEur: 5000000,
  },

  // ─── COFINANCEMENTS MULTI-FRANCOPHONIE ──────────────────────────
  {
    url: "https://www.francophonie.org/promotion-egalite-femmes-hommes",
    title: "OIF — Promotion de l'égalité femmes-hommes",
    summary:
      "Programme transversal OIF dédié à l'égalité de genre et aux droits des femmes dans l'espace francophone. AAP pour les associations féministes, recherches sur les violences de genre, programmes d'autonomisation économique.",
    themes: ["Égalité", "Droits humains", "Genre"],
    funder: "OIF",
    origin: "OIF",
    eligibleEntities: ["association", "ong", "recherche"],
    eligibleCountries: ["FR", "EU", "ALL"],
    maxAmountEur: 100000,
  },
  {
    url: "https://www.francophonie.org/economie-et-numerique-1339",
    title: "OIF — Économie & numérique francophones",
    summary:
      "Volet économie et numérique de l'OIF : soutien à l'entrepreneuriat féminin, aux jeunes entrepreneurs, aux startups numériques en Afrique francophone. Programmes D-CLIC (formation aux métiers du numérique), Objectif Mers et Océans.",
    themes: ["Économie", "Numérique", "Francophonie", "Entrepreneuriat"],
    funder: "OIF",
    origin: "OIF",
    eligibleEntities: ["association", "entreprise"],
    eligibleCountries: ["FR", "ALL"],
    maxAmountEur: 150000,
  },
];

export async function fetchFrancophonePrograms(): Promise<FrancophoneProgram[]> {
  console.log(
    `[Bailleurs francophones internationaux] ${FRANCOPHONE_PROGRAMS.length} programmes curés`
  );
  return FRANCOPHONE_PROGRAMS;
}

export function transformFrancophoneToGrant(p: FrancophoneProgram) {
  const themes = [...p.themes];
  if (!themes.includes("Francophonie") && p.origin === "OIF") {
    themes.push("Francophonie");
  }

  // country = pays de l'autorité (origine du financement) en code ISO-2 quand simple,
  // sinon "INT" pour les multi-bailleurs / multilatéraux.
  const countryByOrigin: Record<string, string> = {
    Canada: "CA",
    Luxembourg: "LU",
    Monaco: "MC",
    Belgique: "BE",
    Québec: "CA",
    "France-Québec": "FR",
  };
  const country = countryByOrigin[p.origin] ?? "INT";

  return {
    sourceUrl: p.url,
    sourceName: "Bailleurs francophones internationaux",
    title: p.title,
    summary: p.summary,
    rawContent: p.summary,
    funder: p.funder,
    country,
    thematicAreas: themes,
    eligibleEntities: p.eligibleEntities ?? ["association", "ong"],
    eligibleCountries: p.eligibleCountries ?? ["FR"],
    minAmountEur: p.minAmountEur ?? 10000,
    maxAmountEur: p.maxAmountEur ?? 500000,
    coFinancingRequired: true,
    deadline: null,
    grantType: "subvention",
    language: p.language ?? "fr",
    status: "active",
    aiSummary: null,
  };
}
