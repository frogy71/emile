/**
 * France 2030 — plan d'investissement national (54 Md€)
 *
 * Pilotage : Secrétariat Général Pour l'Investissement (SGPI), Bpifrance,
 * ADEME, ANR, Caisse des Dépôts en opérateurs. Couvre 10 objectifs
 * stratégiques : décarbonation, hydrogène, nucléaire, électronique, santé,
 * spatial, agro, culturel & créatif, formation.
 *
 * Une partie des AAP est déjà captée par Aides-Territoires et Bpifrance —
 * on liste ici les portails et grandes briques pour garantir la
 * découvrabilité même quand un AAP spécifique n'est pas (encore) ouvert.
 */

export interface France2030Program {
  url: string;
  title: string;
  summary: string;
  themes: string[];
  funder: string;
  eligibleEntities?: string[];
  minAmountEur?: number | null;
  maxAmountEur?: number | null;
}

const FRANCE_2030_PROGRAMS: France2030Program[] = [
  // ─── PORTAILS ────────────────────────────────────────────────────
  {
    url: "https://www.gouvernement.fr/france-2030",
    title: "France 2030 — Portail national",
    summary:
      "Plan d'investissement de 54 Md€ sur 5 ans pour transformer durablement l'économie française. 10 objectifs : décarbonation, hydrogène, nucléaire, transports, agro-alimentaire durable, santé, électronique, spatial, fonds marins, culture & contenus créatifs.",
    themes: ["Innovation", "Industrie", "Transition écologique", "Souveraineté"],
    funder: "SGPI / Premier ministre",
    eligibleEntities: ["entreprise", "recherche", "association", "collectivite"],
    maxAmountEur: 50000000,
  },
  {
    url: "https://www.entreprises.gouv.fr/fr/france-2030",
    title: "France 2030 — Volet entreprises (DGE)",
    summary:
      "Direction générale des entreprises — point d'entrée des aides France 2030 pour les entreprises : start-ups deeptech, PME industrielles, ETI, filières prioritaires.",
    themes: ["Innovation", "Industrie", "Entreprises"],
    funder: "DGE / Ministère de l'Économie",
    eligibleEntities: ["entreprise"],
    maxAmountEur: 30000000,
  },
  {
    url: "https://www.bpifrance.fr/nos-actualites/france-2030",
    title: "France 2030 — Bpifrance (opérateur)",
    summary:
      "Bpifrance opère plus de la moitié des budgets France 2030 (subventions, avances, prêts, fonds propres). Concours i-Nov, i-Démo, i-Lab, i-PhD, AAP filières, French Tech 2030.",
    themes: ["Innovation", "Industrie", "Deeptech"],
    funder: "Bpifrance / SGPI",
    eligibleEntities: ["entreprise"],
    maxAmountEur: 30000000,
  },
  {
    url: "https://anr.fr/fr/france-2030/",
    title: "France 2030 — ANR (volet recherche)",
    summary:
      "L'Agence Nationale de la Recherche opère le volet recherche de France 2030 : PEPR (programmes & équipements prioritaires), CMA (contrats de marché aval), équipements structurants, recherche en santé.",
    themes: ["Recherche", "Innovation"],
    funder: "ANR / SGPI",
    eligibleEntities: ["recherche", "universite"],
    maxAmountEur: 80000000,
  },
  {
    url: "https://agirpourlatransition.ademe.fr/entreprises/france-2030",
    title: "France 2030 — ADEME (volet transition écologique)",
    summary:
      "L'ADEME opère les briques décarbonation industrie, hydrogène, recyclage, alimentation durable, écosystèmes territoriaux d'innovation.",
    themes: ["Transition écologique", "Décarbonation", "Industrie"],
    funder: "ADEME / SGPI",
    eligibleEntities: ["entreprise", "association", "collectivite"],
    maxAmountEur: 30000000,
  },

  // ─── GRANDS AAP / DISPOSITIFS PHARES ────────────────────────────
  {
    url: "https://www.bpifrance.fr/catalogue-offres/innovation/concours-i-nov",
    title: "France 2030 — Concours i-Nov",
    summary:
      "Concours d'innovation pour PME et start-ups jusqu'à 2 000 salariés. Subventions et avances récupérables jusqu'à 5 M€. Vagues annuelles, plusieurs thématiques (santé, énergie, numérique, mobilité, agro).",
    themes: ["Innovation", "Deeptech"],
    funder: "Bpifrance / SGPI",
    eligibleEntities: ["entreprise"],
    minAmountEur: 600000,
    maxAmountEur: 5000000,
  },
  {
    url: "https://www.bpifrance.fr/catalogue-offres/innovation/aide-au-developpement-deeptech-i-demo",
    title: "France 2030 — Aide au développement Deeptech (i-Démo)",
    summary:
      "Soutien aux projets de R&D collaboratifs ou individuels d'envergure (3 à 5 ans) portés par les entreprises deeptech. Subvention + avance récupérable, 1 à 20 M€.",
    themes: ["Innovation", "Deeptech", "Recherche"],
    funder: "Bpifrance",
    eligibleEntities: ["entreprise"],
    minAmountEur: 1000000,
    maxAmountEur: 20000000,
  },
  {
    url: "https://www.bpifrance.fr/catalogue-offres/innovation/concours-i-lab",
    title: "France 2030 — Concours i-Lab (création d'entreprise deeptech)",
    summary:
      "Concours national d'aide à la création d'entreprises de technologies innovantes. Subvention jusqu'à 600 k€ pour porteurs de projet et jeunes start-ups deeptech.",
    themes: ["Création d'entreprise", "Deeptech", "Innovation"],
    funder: "Bpifrance / Ministère de l'Enseignement supérieur et de la Recherche",
    eligibleEntities: ["entreprise"],
    minAmountEur: 100000,
    maxAmountEur: 600000,
  },
  {
    url: "https://www.bpifrance.fr/catalogue-offres/innovation/concours-i-phd",
    title: "France 2030 — Concours i-PhD",
    summary:
      "Concours pour doctorants et jeunes docteurs souhaitant valoriser leurs travaux par la création d'une start-up deeptech. Accompagnement + financement de l'incubation.",
    themes: ["Recherche", "Deeptech", "Création d'entreprise"],
    funder: "Bpifrance / MESR",
    eligibleEntities: ["recherche", "universite"],
    maxAmountEur: 10000,
  },
  {
    url: "https://www.bpifrance.fr/nos-actualites/french-tech-2030",
    title: "France 2030 — French Tech 2030 (sélection 125 start-ups)",
    summary:
      "Programme d'accompagnement de 125 start-ups françaises répondant aux 10 objectifs de France 2030. Accès facilité aux financements, mise en relation grands comptes, soutien à l'export.",
    themes: ["Innovation", "Deeptech", "Souveraineté"],
    funder: "Mission French Tech / SGPI",
    eligibleEntities: ["entreprise"],
    maxAmountEur: 30000000,
  },
  {
    url: "https://anr.fr/fr/france-2030/pepr/",
    title: "France 2030 — PEPR (Programmes & Équipements Prioritaires de Recherche)",
    summary:
      "PEPR : programmes structurants de recherche sur 5-10 ans (10-80 M€ par PEPR) sur les enjeux scientifiques et technologiques de France 2030. Coordonnés par les organismes de recherche.",
    themes: ["Recherche", "Innovation"],
    funder: "ANR / SGPI",
    eligibleEntities: ["recherche", "universite"],
    minAmountEur: 10000000,
    maxAmountEur: 80000000,
  },
  {
    url: "https://www.banquedesterritoires.fr/territoires-dinnovation",
    title: "France 2030 — Territoires d'Innovation (volet 2)",
    summary:
      "Démonstrateurs territoriaux d'innovations à grande échelle. Mobilité durable, santé, alimentation, énergie. AAP pluriannuels pilotés par la Banque des Territoires.",
    themes: ["Territoires", "Innovation", "Transition"],
    funder: "Banque des Territoires / SGPI",
    eligibleEntities: ["collectivite", "entreprise", "association"],
    minAmountEur: 1000000,
    maxAmountEur: 20000000,
  },
  {
    url: "https://agirpourlatransition.ademe.fr/entreprises/dispositif-aide/decarbon-action",
    title: "France 2030 — Décarbonation de l'industrie (DECARB)",
    summary:
      "Soutien aux investissements de décarbonation des sites industriels (efficacité énergétique, électrification des procédés, biomasse, captage de CO2). Subvention 30-65 % de l'écart au coût de référence.",
    themes: ["Industrie", "Climat", "Décarbonation"],
    funder: "ADEME / SGPI",
    eligibleEntities: ["entreprise"],
    minAmountEur: 3000000,
    maxAmountEur: 30000000,
  },
  {
    url: "https://www.gouvernement.fr/france-2030/strategie/hydrogene-decarbone",
    title: "France 2030 — Stratégie Hydrogène décarboné (9 Md€)",
    summary:
      "Plan hydrogène 2030 : production électrolyseurs, infrastructures, mobilité lourde, applications industrielles. AAP H2 Innovation, H2 hubs territoriaux.",
    themes: ["Énergie", "Hydrogène", "Industrie"],
    funder: "ADEME / SGPI",
    eligibleEntities: ["entreprise", "collectivite", "recherche"],
    minAmountEur: 1000000,
    maxAmountEur: 50000000,
  },
  {
    url: "https://www.gouvernement.fr/france-2030/strategie/sante-france-2030",
    title: "France 2030 — Innovation Santé 2030 (7,5 Md€)",
    summary:
      "Stratégie d'accélération santé : biothérapies, santé numérique, maladies infectieuses émergentes, biomédicaments. AAP recherche hospitalo-universitaire (RHU), équipements structurants, jumeaux numériques.",
    themes: ["Santé", "Recherche", "Biotechnologie"],
    funder: "ANR / SGPI",
    eligibleEntities: ["recherche", "universite", "entreprise"],
    minAmountEur: 500000,
    maxAmountEur: 10000000,
  },
  {
    url: "https://www.gouvernement.fr/france-2030/strategie/culture-contenus-creatifs",
    title: "France 2030 — La Grande Fabrique de l'Image (350 M€)",
    summary:
      "Soutien aux studios de production cinéma, audiovisuel, animation, jeu vidéo, effets spéciaux. Création de campus de formation aux métiers de l'image et de l'industrie créative.",
    themes: ["Culture", "Cinéma", "Audiovisuel", "Numérique"],
    funder: "CNC / SGPI",
    eligibleEntities: ["entreprise", "association"],
    maxAmountEur: 20000000,
  },
  {
    url: "https://www.gouvernement.fr/france-2030/strategie/agriculture-alimentation",
    title: "France 2030 — Stratégie Alimentation durable & favorable à la santé",
    summary:
      "Soutien à la transition agro-écologique et à l'innovation alimentaire : protéines végétales, robotique agricole, agriculture cellulaire, AAP territoires d'innovation alimentaire.",
    themes: ["Agriculture", "Alimentation", "Transition écologique"],
    funder: "FranceAgriMer / ADEME / SGPI",
    eligibleEntities: ["entreprise", "association", "collectivite", "recherche"],
    minAmountEur: 100000,
    maxAmountEur: 5000000,
  },
  {
    url: "https://www.gouvernement.fr/france-2030/strategie/competences-metiers-davenir",
    title: "France 2030 — Compétences et Métiers d'Avenir (2,5 Md€)",
    summary:
      "AAP pour développer les formations sur les métiers d'avenir liés aux 10 objectifs France 2030. Cofinancement de dispositifs de formation portés par OPCO, écoles, universités, branches.",
    themes: ["Formation", "Emploi", "Industrie"],
    funder: "Caisse des Dépôts / ANR / SGPI",
    eligibleEntities: ["universite", "ecole", "association", "entreprise"],
    minAmountEur: 500000,
    maxAmountEur: 30000000,
  },
];

export async function fetchFrance2030Programs(): Promise<France2030Program[]> {
  console.log(`[France 2030] ${FRANCE_2030_PROGRAMS.length} programmes curés`);
  return FRANCE_2030_PROGRAMS;
}

export function transformFrance2030ToGrant(p: France2030Program) {
  return {
    sourceUrl: p.url,
    sourceName: "France 2030",
    title: p.title,
    summary: p.summary,
    rawContent: p.summary,
    funder: p.funder,
    country: "FR",
    thematicAreas: p.themes,
    eligibleEntities: p.eligibleEntities ?? ["entreprise", "recherche"],
    eligibleCountries: ["FR"],
    minAmountEur: p.minAmountEur ?? 50000,
    maxAmountEur: p.maxAmountEur ?? 5000000,
    coFinancingRequired: true,
    deadline: null,
    grantType: "subvention",
    language: "fr",
    status: "active",
    aiSummary: null,
  };
}
