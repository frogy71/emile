/**
 * Prix et concours pour associations & innovateurs sociaux
 *
 * Les prix et concours sont une source de financement particulière :
 * sélection compétitive, dotation parfois très significative, mais aussi
 * notoriété, accompagnement et mise en réseau. Beaucoup d'associations
 * jeunes ou ESS structurent leur stratégie de financement autour de ces
 * concours emblématiques.
 *
 * Les prix nominaux (Prix Nobel, Prix de la Fondation X) ne sont pas
 * inclus s'ils sont déjà couverts dans `fondations-curated.ts` — on liste
 * ici les concours destinés aux associations / projets / innovateurs
 * sociaux et environnementaux.
 */

export interface PrixProgram {
  url: string;
  title: string;
  summary: string;
  themes: string[];
  funder: string;
  eligibleEntities?: string[];
  minAmountEur?: number | null;
  maxAmountEur?: number | null;
}

const PRIX_PROGRAMS: PrixProgram[] = [
  // ─── INNOVATION SOCIALE GÉNÉRALISTE ─────────────────────────────
  {
    url: "https://fondationlafrancesengage.org/laureats/",
    title: "Prix La France s'engage",
    summary:
      "Prix annuel de la Fondation La France s'engage : récompense les associations et entreprises sociales innovantes pour leur impact social. Dotation 30-100 k€ + accompagnement de 3 ans.",
    themes: ["Innovation sociale", "Solidarité"],
    funder: "Fondation La France s'engage",
    eligibleEntities: ["association", "entreprise"],
    minAmountEur: 30000,
    maxAmountEur: 100000,
  },
  {
    url: "https://www.google.org/intl/fr/our-work/social-good/",
    title: "Google.org Impact Challenge (France & Europe)",
    summary:
      "Concours mondial de Google.org soutenant des organisations à but non lucratif et entrepreneurs sociaux utilisant la technologie pour résoudre des défis humanitaires.",
    themes: ["Innovation sociale", "Numérique", "Solidarité"],
    funder: "Google.org",
    eligibleEntities: ["association", "ong"],
    minAmountEur: 100000,
    maxAmountEur: 1000000,
  },
  {
    url: "https://www.economie.gouv.fr/economie-sociale-solidaire/concours-prix-de-l-innovation-sociale",
    title: "Concours Prix de l'Innovation Sociale (Avise / DGCS)",
    summary:
      "Concours national porté par l'Avise et la DGCS pour récompenser les projets d'innovation sociale en phase d'amorçage ou de changement d'échelle. Dotation + accompagnement.",
    themes: ["Innovation sociale", "ESS"],
    funder: "Avise / DGCS",
    eligibleEntities: ["association", "entreprise"],
    minAmountEur: 10000,
    maxAmountEur: 50000,
  },
  {
    url: "https://www.ashoka.org/fr/programme/fellow-ashoka",
    title: "Programme Fellows Ashoka",
    summary:
      "Plus grand réseau mondial d'entrepreneurs sociaux. Sélection annuelle de fellows : bourse à vie + accompagnement + accès au réseau international Ashoka (3 800+ fellows).",
    themes: ["Innovation sociale", "Entrepreneuriat", "International"],
    funder: "Ashoka",
    eligibleEntities: ["association", "entreprise"],
    minAmountEur: 50000,
    maxAmountEur: 100000,
  },
  {
    url: "https://www.skollworldforum.org/awards/",
    title: "Skoll Award for Social Entrepreneurship",
    summary:
      "Prix mondial décerné par la Fondation Skoll aux entrepreneurs sociaux à fort impact systémique. 1,5 M USD par lauréat + visibilité au Skoll World Forum (Oxford).",
    themes: ["Innovation sociale", "Entrepreneuriat"],
    funder: "Fondation Skoll",
    eligibleEntities: ["association", "ong", "entreprise"],
    maxAmountEur: 1400000,
  },
  {
    url: "https://wise-qatar.org/wise-prize/",
    title: "WISE Prize for Education",
    summary:
      "Prix mondial annuel pour l'éducation décerné par la Fondation Qatar (WISE). 500 k USD au lauréat. WISE Awards en parallèle pour les projets innovants en éducation (6 lauréats × 20 k USD).",
    themes: ["Éducation", "Innovation"],
    funder: "WISE / Fondation Qatar",
    eligibleEntities: ["association", "ong", "ecole"],
    maxAmountEur: 500000,
  },

  // ─── CLIMAT / ENVIRONNEMENT ─────────────────────────────────────
  {
    url: "https://earthshotprize.org/",
    title: "Earthshot Prize",
    summary:
      "Prix créé par le Prince William : 5 lauréats par an reçoivent 1 M £ pour des solutions à fort impact sur 5 défis : nature, qualité de l'air, océans, déchets, climat.",
    themes: ["Climat", "Environnement", "Innovation"],
    funder: "Earthshot Prize Foundation",
    eligibleEntities: ["association", "ong", "entreprise"],
    maxAmountEur: 1100000,
  },
  {
    url: "https://www.ashden.org/awards/",
    title: "Ashden Awards (climat & énergie)",
    summary:
      "Prix Ashden internationaux : récompense les solutions climat et énergie durable les plus innovantes. Plusieurs catégories (cooler cities, clean cooking, energy access, schools, businesses).",
    themes: ["Climat", "Énergie", "Innovation"],
    funder: "Ashden",
    eligibleEntities: ["association", "ong", "entreprise"],
    minAmountEur: 20000,
    maxAmountEur: 75000,
  },
  {
    url: "https://www.equatorinitiative.org/equator-prize/",
    title: "Equator Prize (PNUD)",
    summary:
      "Prix du Programme des Nations Unies pour le Développement : récompense les communautés autochtones et locales pour leurs actions exemplaires de développement durable et de conservation.",
    themes: ["Environnement", "Communautés", "Climat"],
    funder: "PNUD — Equator Initiative",
    eligibleEntities: ["association", "ong"],
    maxAmountEur: 10000,
  },
  {
    url: "https://www.fondation-nature-homme.org/prix-nicolas-hulot/",
    title: "Prix Nicolas Hulot pour la Nature et l'Homme",
    summary:
      "Prix annuel de la Fondation pour la Nature et l'Homme (FNH) : soutient les acteurs de la transition écologique en France. Plusieurs catégories.",
    themes: ["Environnement", "Climat", "Transition écologique"],
    funder: "Fondation pour la Nature et l'Homme",
    eligibleEntities: ["association"],
    maxAmountEur: 30000,
  },
  {
    url: "https://www.foundationyveschouinard.org/",
    title: "Patagonia — Environmental Grants & Action Works",
    summary:
      "Programme mondial de subventions environnementales de Patagonia (1 % for the Planet). Cible les associations grass-roots de protection de l'environnement.",
    themes: ["Environnement", "Climat", "Engagement"],
    funder: "Patagonia",
    eligibleEntities: ["association", "ong"],
    minAmountEur: 5000,
    maxAmountEur: 25000,
  },

  // ─── SANTÉ / SOCIAL ─────────────────────────────────────────────
  {
    url: "https://gulbenkian.pt/prize/",
    title: "Prix Calouste Gulbenkian pour l'Humanité",
    summary:
      "Prix annuel de 1 M € de la Fondation Calouste Gulbenkian (Portugal) pour des contributions exceptionnelles à l'atténuation du changement climatique.",
    themes: ["Climat", "Humanitaire"],
    funder: "Fondation Calouste Gulbenkian",
    eligibleEntities: ["association", "ong", "recherche"],
    maxAmountEur: 1000000,
  },
  {
    url: "https://www.aurorahumanitarian.org/aurora-prize/",
    title: "Aurora Prize for Awakening Humanity",
    summary:
      "Prix international annuel récompensant un humanitaire risquant sa vie pour les autres. 1 M USD répartis entre le lauréat et 3 organisations désignées par lui/elle.",
    themes: ["Humanitaire", "Droits humains"],
    funder: "Aurora Humanitarian Initiative",
    eligibleEntities: ["ong", "association"],
    maxAmountEur: 1000000,
  },
  {
    url: "https://www.fondation-pierremariecurie.org/prix-curie/",
    title: "Prix Pierre & Marie Curie",
    summary:
      "Prix de la Fondation Pierre & Marie Curie pour des actions sociales et humanitaires emblématiques en France et à l'international.",
    themes: ["Solidarité", "Humanitaire"],
    funder: "Fondation Pierre & Marie Curie",
    eligibleEntities: ["association", "ong"],
    maxAmountEur: 50000,
  },

  // ─── ENTREPRENEURIAT SOCIAL & ESS ───────────────────────────────
  {
    url: "https://makesense.org/programmes/",
    title: "Programme Boost — makesense (entrepreneurs sociaux)",
    summary:
      "Programmes d'accompagnement et concours pour entrepreneurs à impact (Pré-Boost, Boost, Re_action). Sélection par appel à candidatures, financement + accompagnement.",
    themes: ["Innovation sociale", "Entrepreneuriat"],
    funder: "makesense",
    eligibleEntities: ["entreprise", "association"],
    minAmountEur: 5000,
    maxAmountEur: 50000,
  },
  {
    url: "https://www.lalouve.coop/concours-tremplin",
    title: "Concours Tremplin pour l'ESS — La Louve",
    summary:
      "Concours national de l'ESS lancé par la Louve pour soutenir les projets coopératifs et solidaires en phase d'amorçage.",
    themes: ["ESS", "Coopératives"],
    funder: "La Louve",
    eligibleEntities: ["association", "entreprise"],
    maxAmountEur: 20000,
  },
  {
    url: "https://www.pulse.org/programs",
    title: "Programmes Pulse (Schwab Foundation, Davos)",
    summary:
      "Programmes de la Schwab Foundation for Social Entrepreneurship (groupe Forum économique mondial) : Social Entrepreneur of the Year, Social Innovator, Awards.",
    themes: ["Innovation sociale", "International"],
    funder: "Schwab Foundation / WEF",
    eligibleEntities: ["entreprise", "association", "ong"],
    maxAmountEur: 100000,
  },
  {
    url: "https://www.youthentrepreneurship.org/",
    title: "Prix UNESCO de l'Entrepreneuriat des Jeunes",
    summary:
      "Récompense les jeunes entrepreneurs sociaux innovants à l'échelle mondiale. Dotation + visibilité ONU.",
    themes: ["Jeunesse", "Entrepreneuriat", "International"],
    funder: "UNESCO",
    eligibleEntities: ["entreprise", "association"],
    maxAmountEur: 30000,
  },

  // ─── CULTURE & ARTS ─────────────────────────────────────────────
  {
    url: "https://www.audi-talents.fr/",
    title: "Audi Talents (audace artistique)",
    summary:
      "Programme Audi Talents : soutien à l'audace créative dans 4 catégories (cinéma, musique, art contemporain, écriture). Dotation + accompagnement médiatique.",
    themes: ["Culture", "Création"],
    funder: "Audi France",
    eligibleEntities: ["association", "entreprise"],
    maxAmountEur: 50000,
  },
  {
    url: "https://www.bmw-stiftung.de/en/",
    title: "BMW Foundation — Responsible Leaders",
    summary:
      "Réseau mondial des Responsible Leaders soutenu par la BMW Foundation : leaders engagés sur les ODD (économie inclusive, climat). Bourses, retraites, projets.",
    themes: ["Leadership", "ODD", "Engagement"],
    funder: "BMW Foundation Herbert Quandt",
    eligibleEntities: ["association", "entreprise"],
    maxAmountEur: 50000,
  },
  {
    url: "https://www.princeclausfund.org/awards",
    title: "Prince Claus Awards (culture & développement)",
    summary:
      "Prix annuels du Prince Claus Fund (Pays-Bas) : récompensent des artistes et acteurs culturels d'Afrique, Asie, Amérique latine et Caraïbes pour leur impact sociétal.",
    themes: ["Culture", "Solidarité internationale"],
    funder: "Prince Claus Fund",
    eligibleEntities: ["association", "entreprise"],
    minAmountEur: 25000,
    maxAmountEur: 100000,
  },

  // ─── INNOVATION TECHNOLOGIQUE / TECH FOR GOOD ───────────────────
  {
    url: "https://www.frenchimpact.fr/",
    title: "French Impact (label & accélération)",
    summary:
      "Label French Impact (initiative gouvernementale) : récompense les pionniers de l'innovation sociale et environnementale en France. Accompagnement + visibilité + accès aux financements.",
    themes: ["Innovation sociale", "ESS"],
    funder: "French Impact",
    eligibleEntities: ["association", "entreprise"],
    maxAmountEur: 100000,
  },
  {
    url: "https://www.thefemalefactor.com/awards",
    title: "Female Founders / Entrepreneurs Awards (Europe)",
    summary:
      "Concours européen pour les femmes entrepreneures à impact. Plusieurs catégories : technologie, climat, social, deeptech. Dotation + accompagnement.",
    themes: ["Femmes", "Entrepreneuriat", "Innovation"],
    funder: "EIC Women Innovators / variants",
    eligibleEntities: ["entreprise"],
    maxAmountEur: 100000,
  },
  {
    url: "https://www.unesco.org/fr/prizes/intl-prize-for-girls-women-education",
    title: "Prix UNESCO pour l'éducation des filles et des femmes",
    summary:
      "Prix annuel de l'UNESCO récompensant les contributions exceptionnelles à l'éducation des filles et des femmes. 50 k USD à 2 lauréats.",
    themes: ["Éducation", "Femmes", "Égalité"],
    funder: "UNESCO",
    eligibleEntities: ["association", "ong"],
    maxAmountEur: 50000,
  },
  {
    url: "https://www.teamworkforchange.com/laureats",
    title: "Trophées Initiative France (créateurs d'entreprise)",
    summary:
      "Concours annuel d'Initiative France récompensant des créateurs d'entreprise accompagnés (initiatives locales). Plusieurs catégories : innovation, agro, jeunes.",
    themes: ["Entrepreneuriat", "Territoires"],
    funder: "Initiative France",
    eligibleEntities: ["entreprise"],
    maxAmountEur: 20000,
  },

  // ─── JEUNESSE / ENGAGEMENT ──────────────────────────────────────
  {
    url: "https://www.lesgracques.fr/projets/",
    title: "Concours Les Gracques (engagement public)",
    summary:
      "Think tank Les Gracques : soutien et primes à des projets d'innovation publique, d'engagement citoyen, de jeunes émergents.",
    themes: ["Démocratie", "Engagement"],
    funder: "Les Gracques",
    eligibleEntities: ["association"],
    maxAmountEur: 30000,
  },
  {
    url: "https://www.fondation-veolia.com/concours-fonds-jeunes-talents-solidaires",
    title: "Veolia — Concours Jeunes Talents Solidaires",
    summary:
      "Concours annuel de la Fondation Veolia destiné aux jeunes (18-30 ans) porteurs de projets à impact social ou environnemental. Dotation + parrainage.",
    themes: ["Jeunesse", "Innovation sociale"],
    funder: "Fondation Veolia",
    eligibleEntities: ["association"],
    maxAmountEur: 10000,
  },
  {
    url: "https://www.unicef.fr/dossier/initiative-2030/",
    title: "UNICEF — Concours Génération 2030",
    summary:
      "Concours UNICEF France pour les jeunes (15-25 ans) engagés sur les ODD : santé, éducation, égalité, climat. Soutien à des projets locaux et internationaux.",
    themes: ["Jeunesse", "ODD", "Solidarité"],
    funder: "UNICEF France",
    eligibleEntities: ["association"],
    maxAmountEur: 5000,
  },

  // ─── PRIX NATIONAUX FRANÇAIS ────────────────────────────────────
  {
    url: "https://www.legifrance.gouv.fr/loda/id/JORFTEXT000045389066/",
    title: "Médailles Trophées de l'Engagement (CESE)",
    summary:
      "Trophées du Conseil Économique, Social et Environnemental (CESE) reconnaissant l'engagement associatif et bénévole exemplaire en France.",
    themes: ["Engagement", "Solidarité"],
    funder: "CESE",
    eligibleEntities: ["association"],
    maxAmountEur: 5000,
  },
  {
    url: "https://www.fondationpouralenfance.org/prix-fondation/",
    title: "Prix Fondation pour l'Enfance",
    summary:
      "Prix annuel de la Fondation pour l'Enfance : récompense les projets innovants en faveur des enfants et adolescents en France (protection, éducation, santé).",
    themes: ["Enfance", "Solidarité"],
    funder: "Fondation pour l'Enfance",
    eligibleEntities: ["association"],
    maxAmountEur: 30000,
  },
  {
    url: "https://www.croixrouge.fr/Nos-engagements/Notre-engagement-international/Prix-de-la-Croix-Rouge",
    title: "Prix de la Croix-Rouge française",
    summary:
      "Prix annuel récompensant des innovations humanitaires françaises ou soutenues par la Croix-Rouge française.",
    themes: ["Humanitaire", "Solidarité", "Innovation"],
    funder: "Croix-Rouge française",
    eligibleEntities: ["association", "ong"],
    maxAmountEur: 20000,
  },
  {
    url: "https://www.fondationdefrance.org/fr/grands-prix-fondation-de-france",
    title: "Grands Prix de la Fondation de France",
    summary:
      "Grands Prix annuels de la Fondation de France : recherche médicale, environnement, philanthropie, action humanitaire. Dotations significatives.",
    themes: ["Recherche", "Solidarité", "Environnement"],
    funder: "Fondation de France",
    eligibleEntities: ["association", "ong", "recherche"],
    maxAmountEur: 200000,
  },
];

export async function fetchPrixPrograms(): Promise<PrixProgram[]> {
  console.log(`[Prix et concours] ${PRIX_PROGRAMS.length} prix curés`);
  return PRIX_PROGRAMS;
}

export function transformPrixToGrant(p: PrixProgram) {
  return {
    sourceUrl: p.url,
    sourceName: "Prix et concours",
    title: p.title,
    summary: p.summary,
    rawContent: p.summary,
    funder: p.funder,
    country: "FR",
    thematicAreas: p.themes,
    eligibleEntities: p.eligibleEntities ?? ["association", "ong"],
    eligibleCountries: ["FR"],
    minAmountEur: p.minAmountEur ?? 5000,
    maxAmountEur: p.maxAmountEur ?? 100000,
    coFinancingRequired: false,
    deadline: null,
    grantType: "prix",
    language: "fr",
    status: "active",
    aiSummary: null,
  };
}
