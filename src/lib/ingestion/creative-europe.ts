/**
 * Creative Europe (Europe Créative) — programme arts/culture/médias
 *
 * 2,4 Md€ (2021-2027). 3 volets : Culture, MEDIA (audiovisuel),
 * Cross-sectoriel (innovation médias, médias d'information).
 *
 * Géré par EACEA (Agence exécutive Éducation, Audiovisuel & Culture).
 * Le portail SEDIA capte les topics individuels — on liste ici les
 * sous-programmes structurants pour la découvrabilité par filière.
 */

export interface CreativeEuropeProgram {
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

const CREATIVE_EUROPE_PROGRAMS: CreativeEuropeProgram[] = [
  // ─── PORTAIL ─────────────────────────────────────────────────────
  {
    url: "https://culture.ec.europa.eu/creative-europe",
    title: "Europe Créative — Portail officiel",
    summary:
      "Programme de la Commission européenne pour les secteurs culturel, créatif et audiovisuel (2,4 Md€ 2021-2027). Trois volets : Culture, MEDIA, Cross-sectoriel.",
    themes: ["Culture", "Audiovisuel", "Médias"],
    funder: "EACEA / Commission Européenne",
    eligibleEntities: ["association", "entreprise"],
    eligibleCountries: ["EU"],
    maxAmountEur: 2000000,
  },
  {
    url: "https://www.europecreative.fr/",
    title: "Europe Créative — Bureau France",
    summary:
      "Bureau Europe Créative France : information, conseil et accompagnement des candidats français dans tous les volets du programme. Co-piloté par le Ministère de la Culture et le CNC.",
    themes: ["Culture", "Audiovisuel", "Médias"],
    funder: "Bureau Europe Créative France",
    eligibleEntities: ["association", "entreprise"],
    eligibleCountries: ["FR"],
    maxAmountEur: 0,
  },

  // ─── VOLET CULTURE ───────────────────────────────────────────────
  {
    url: "https://culture.ec.europa.eu/creative-europe/creative-europe-culture-strand",
    title: "Europe Créative — Volet Culture",
    summary:
      "Volet Culture (~33 % du budget) : projets de coopération culturelle européenne, plateformes, réseaux européens, traductions littéraires, mobilité des artistes.",
    themes: ["Culture", "Coopération"],
    funder: "EACEA",
    eligibleEntities: ["association", "entreprise", "collectivite"],
    eligibleCountries: ["EU"],
    minAmountEur: 200000,
    maxAmountEur: 2000000,
  },
  {
    url: "https://culture.ec.europa.eu/creative-europe/calls-for-proposals/cooperation-projects",
    title: "Europe Créative — Projets de coopération culturelle",
    summary:
      "AAP annuel pour des projets de coopération transnationale entre opérateurs culturels (3 catégories : Small Scale, Medium Scale, Large Scale) sur 3 à 4 ans.",
    themes: ["Culture", "Coopération"],
    funder: "EACEA",
    eligibleEntities: ["association", "entreprise", "collectivite"],
    eligibleCountries: ["EU"],
    minAmountEur: 200000,
    maxAmountEur: 2000000,
  },
  {
    url: "https://culture.ec.europa.eu/creative-europe/calls-for-proposals/european-platforms",
    title: "Europe Créative — Plateformes européennes",
    summary:
      "Soutien aux plateformes européennes promouvant la création émergente et la mobilité (artistes en début de carrière, programmation européenne).",
    themes: ["Culture", "Création émergente"],
    funder: "EACEA",
    eligibleEntities: ["association", "entreprise"],
    eligibleCountries: ["EU"],
    maxAmountEur: 2100000,
  },
  {
    url: "https://culture.ec.europa.eu/creative-europe/calls-for-proposals/european-networks",
    title: "Europe Créative — Réseaux européens (operating grants)",
    summary:
      "Soutien aux réseaux européens du secteur culturel (opérationnel pluriannuel) : structuration, plaidoyer, professionnalisation des acteurs culturels.",
    themes: ["Culture", "Coopération"],
    funder: "EACEA",
    eligibleEntities: ["association"],
    eligibleCountries: ["EU"],
    maxAmountEur: 1000000,
  },
  {
    url: "https://culture.ec.europa.eu/creative-europe/calls-for-proposals/circulation-of-european-literary-works",
    title: "Europe Créative — Circulation des œuvres littéraires",
    summary:
      "Soutien à la traduction, publication, distribution et promotion d'œuvres de fiction d'auteurs européens vers d'autres langues européennes.",
    themes: ["Culture", "Édition", "Traduction"],
    funder: "EACEA",
    eligibleEntities: ["entreprise", "association"],
    eligibleCountries: ["EU"],
    maxAmountEur: 300000,
  },
  {
    url: "https://music-moves-europe.eu/",
    title: "Europe Créative — Music Moves Europe",
    summary:
      "Initiative dédiée au secteur musical européen : aide à la mobilité des artistes, à l'export musical, aux modèles d'affaires durables.",
    themes: ["Culture", "Musique"],
    funder: "EACEA",
    eligibleEntities: ["entreprise", "association"],
    eligibleCountries: ["EU"],
    maxAmountEur: 500000,
  },
  {
    url: "https://culture.ec.europa.eu/creative-europe/calls-for-proposals/perform-europe",
    title: "Europe Créative — Perform Europe (spectacle vivant)",
    summary:
      "Soutien à la circulation transfrontalière des artistes et productions du spectacle vivant en Europe (théâtre, danse, cirque, marionnettes, arts de la rue).",
    themes: ["Culture", "Spectacle vivant"],
    funder: "EACEA / Perform Europe consortium",
    eligibleEntities: ["association", "entreprise"],
    eligibleCountries: ["EU"],
    maxAmountEur: 100000,
  },
  {
    url: "https://culture.ec.europa.eu/creative-europe/calls-for-proposals/i-portunus",
    title: "Europe Créative — i-Portunus (mobilité artistes)",
    summary:
      "Programme de mobilité internationale pour artistes et professionnels de la culture (15-85 jours à l'étranger). Bourses individuelles ou en petits groupes.",
    themes: ["Culture", "Mobilité"],
    funder: "EACEA",
    eligibleEntities: ["association"],
    eligibleCountries: ["EU"],
    maxAmountEur: 5000,
  },

  // ─── VOLET MEDIA (AUDIOVISUEL) ───────────────────────────────────
  {
    url: "https://culture.ec.europa.eu/creative-europe/creative-europe-media-strand",
    title: "Europe Créative — Volet MEDIA",
    summary:
      "Volet MEDIA (~58 % du budget) : soutien à l'industrie audiovisuelle européenne — développement, production, distribution, exposition de films, séries, jeux vidéo, formations, marchés.",
    themes: ["Audiovisuel", "Cinéma", "Jeux vidéo"],
    funder: "EACEA",
    eligibleEntities: ["entreprise", "association"],
    eligibleCountries: ["EU"],
    minAmountEur: 50000,
    maxAmountEur: 1500000,
  },
  {
    url: "https://culture.ec.europa.eu/creative-europe/calls-for-proposals/development-of-european-content",
    title: "Europe Créative MEDIA — Développement (projets unitaires & slate funding)",
    summary:
      "Soutien au développement d'œuvres audiovisuelles européennes (longs métrages, séries, animation, documentaires, contenus immersifs, jeux vidéo).",
    themes: ["Audiovisuel", "Cinéma", "Jeux vidéo"],
    funder: "EACEA",
    eligibleEntities: ["entreprise"],
    eligibleCountries: ["EU"],
    minAmountEur: 25000,
    maxAmountEur: 510000,
  },
  {
    url: "https://culture.ec.europa.eu/creative-europe/calls-for-proposals/co-development",
    title: "Europe Créative MEDIA — Co-développement",
    summary:
      "Soutien au co-développement d'œuvres audiovisuelles entre 2 sociétés de production européennes (longs métrages, séries, animation, documentaires).",
    themes: ["Audiovisuel"],
    funder: "EACEA",
    eligibleEntities: ["entreprise"],
    eligibleCountries: ["EU"],
    maxAmountEur: 200000,
  },
  {
    url: "https://culture.ec.europa.eu/creative-europe/calls-for-proposals/european-mini-slate-development",
    title: "Europe Créative MEDIA — Mini-Slate Development",
    summary:
      "Soutien au développement d'un portefeuille de 2 à 4 projets audiovisuels par une même société de production.",
    themes: ["Audiovisuel"],
    funder: "EACEA",
    eligibleEntities: ["entreprise"],
    eligibleCountries: ["EU"],
    maxAmountEur: 510000,
  },
  {
    url: "https://culture.ec.europa.eu/creative-europe/calls-for-proposals/tv-and-online-content",
    title: "Europe Créative MEDIA — TV & Online Content",
    summary:
      "Soutien à la production de contenus TV et en ligne européens à fort potentiel de circulation : séries dramatiques, animation, documentaires.",
    themes: ["Audiovisuel"],
    funder: "EACEA",
    eligibleEntities: ["entreprise"],
    eligibleCountries: ["EU"],
    maxAmountEur: 2000000,
  },
  {
    url: "https://culture.ec.europa.eu/creative-europe/calls-for-proposals/european-film-distribution",
    title: "Europe Créative MEDIA — Distribution films européens",
    summary:
      "Soutien à la distribution de films européens hors-pays d'origine. Aide automatique aux distributeurs et aide sélective aux ventes internationales.",
    themes: ["Audiovisuel", "Cinéma"],
    funder: "EACEA",
    eligibleEntities: ["entreprise"],
    eligibleCountries: ["EU"],
    maxAmountEur: 1500000,
  },
  {
    url: "https://culture.ec.europa.eu/creative-europe/calls-for-proposals/networks-of-european-festivals",
    title: "Europe Créative MEDIA — Réseaux de festivals européens",
    summary:
      "Soutien aux festivals de cinéma européens et à leurs réseaux. Programmation européenne, animation des publics, dialogue interculturel.",
    themes: ["Audiovisuel", "Cinéma", "Festivals"],
    funder: "EACEA",
    eligibleEntities: ["association", "entreprise"],
    eligibleCountries: ["EU"],
    maxAmountEur: 700000,
  },
  {
    url: "https://culture.ec.europa.eu/creative-europe/calls-for-proposals/audience-development-and-film-education",
    title: "Europe Créative MEDIA — Développement des publics & éducation à l'image",
    summary:
      "Soutien aux projets d'éducation à l'image et de développement des publics du cinéma européen, en particulier pour les jeunes.",
    themes: ["Audiovisuel", "Éducation"],
    funder: "EACEA",
    eligibleEntities: ["association", "entreprise", "ecole"],
    eligibleCountries: ["EU"],
    maxAmountEur: 1500000,
  },
  {
    url: "https://culture.ec.europa.eu/creative-europe/calls-for-proposals/innovative-tools-and-business-models",
    title: "Europe Créative MEDIA — Innovative Tools & Business Models",
    summary:
      "Soutien aux outils numériques innovants et aux modèles d'affaires émergents dans l'audiovisuel européen (data, IA, distribution numérique).",
    themes: ["Audiovisuel", "Numérique", "Innovation"],
    funder: "EACEA",
    eligibleEntities: ["entreprise"],
    eligibleCountries: ["EU"],
    maxAmountEur: 1000000,
  },
  {
    url: "https://culture.ec.europa.eu/creative-europe/calls-for-proposals/european-video-game-development",
    title: "Europe Créative MEDIA — Développement de jeux vidéo européens",
    summary:
      "Soutien au développement de jeux vidéo narratifs européens à fort potentiel culturel et international.",
    themes: ["Jeux vidéo", "Numérique"],
    funder: "EACEA",
    eligibleEntities: ["entreprise"],
    eligibleCountries: ["EU"],
    maxAmountEur: 150000,
  },

  // ─── VOLET CROSS-SECTORIEL ───────────────────────────────────────
  {
    url: "https://culture.ec.europa.eu/creative-europe/cross-sectoral-strand",
    title: "Europe Créative — Volet Cross-sectoriel",
    summary:
      "Volet transversal : innovation aux frontières des secteurs culturels, créatifs et audiovisuels. Soutien aux médias d'information indépendants, lutte contre la désinformation.",
    themes: ["Médias", "Innovation", "Culture"],
    funder: "EACEA",
    eligibleEntities: ["association", "entreprise", "recherche"],
    eligibleCountries: ["EU"],
    minAmountEur: 100000,
    maxAmountEur: 2000000,
  },
  {
    url: "https://culture.ec.europa.eu/creative-europe/calls-for-proposals/journalism-partnerships",
    title: "Europe Créative — Journalism Partnerships",
    summary:
      "Soutien aux partenariats transeuropéens entre médias d'information : collaborations rédactionnelles, transformation numérique, durabilité économique du journalisme.",
    themes: ["Médias", "Journalisme"],
    funder: "EACEA",
    eligibleEntities: ["association", "entreprise"],
    eligibleCountries: ["EU"],
    maxAmountEur: 2000000,
  },
  {
    url: "https://culture.ec.europa.eu/creative-europe/calls-for-proposals/news-media-pluralism",
    title: "Europe Créative — Pluralisme & Liberté des médias",
    summary:
      "Soutien à la liberté de la presse, au pluralisme et à la sécurité des journalistes en Europe (formation, monitoring, protection juridique).",
    themes: ["Médias", "Démocratie", "Droits humains"],
    funder: "EACEA",
    eligibleEntities: ["association", "ong", "recherche"],
    eligibleCountries: ["EU"],
    maxAmountEur: 1000000,
  },
  {
    url: "https://culture.ec.europa.eu/creative-europe/calls-for-proposals/innovation-lab",
    title: "Europe Créative — Creative Innovation Lab",
    summary:
      "Laboratoire d'innovation créative : soutien aux projets innovants à l'intersection entre culture, créativité et audiovisuel (technologies, modèles d'affaires, formats).",
    themes: ["Innovation", "Culture", "Numérique"],
    funder: "EACEA",
    eligibleEntities: ["entreprise", "association", "recherche"],
    eligibleCountries: ["EU"],
    maxAmountEur: 1000000,
  },
];

export async function fetchCreativeEuropePrograms(): Promise<CreativeEuropeProgram[]> {
  console.log(`[Creative Europe] ${CREATIVE_EUROPE_PROGRAMS.length} programmes curés`);
  return CREATIVE_EUROPE_PROGRAMS;
}

export function transformCreativeEuropeToGrant(p: CreativeEuropeProgram) {
  return {
    sourceUrl: p.url,
    sourceName: "Creative Europe",
    title: p.title,
    summary: p.summary,
    rawContent: p.summary,
    funder: p.funder,
    country: "EU",
    thematicAreas: p.themes,
    eligibleEntities: p.eligibleEntities ?? ["association", "entreprise"],
    eligibleCountries: p.eligibleCountries ?? ["EU"],
    minAmountEur: p.minAmountEur ?? 50000,
    maxAmountEur: p.maxAmountEur ?? 1000000,
    coFinancingRequired: true,
    deadline: null,
    grantType: "subvention",
    language: "en",
    status: "active",
    aiSummary: null,
  };
}
