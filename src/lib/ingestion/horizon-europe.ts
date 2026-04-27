/**
 * Horizon Europe — programme cadre européen pour la recherche
 *
 * 95,5 Md€ (2021-2027), le plus grand programme de recherche au monde.
 * 3 piliers : Excellence Scientifique (ERC, MSCA), Problèmes Mondiaux &
 * Compétitivité Industrielle (clusters thématiques), Europe Innovante (EIC).
 *
 * Les topics individuels sont déjà ingérés via SEDIA (eu-funding.ts) — on
 * ajoute ici les portails et programmes-cadres pour la découvrabilité,
 * complétés par CORDIS (la base des projets financés) pour l'inspiration
 * et la recherche de partenaires.
 */

export interface HorizonProgram {
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

const HORIZON_PROGRAMS: HorizonProgram[] = [
  // ─── PORTAILS ────────────────────────────────────────────────────
  {
    url: "https://research-and-innovation.ec.europa.eu/funding/funding-opportunities/funding-programmes-and-open-calls/horizon-europe_en",
    title: "Horizon Europe — Programme cadre Recherche & Innovation",
    summary:
      "Programme cadre européen pour la recherche et l'innovation 2021-2027 (95,5 Md€). Trois piliers : excellence scientifique, défis mondiaux, Europe innovante. Géré par la Commission européenne et ses agences exécutives (ERCEA, REA, EISMEA, CINEA, HaDEA, CLINEA).",
    themes: ["Recherche", "Innovation"],
    funder: "Commission Européenne",
    eligibleEntities: ["recherche", "universite", "entreprise", "association"],
    eligibleCountries: ["EU"],
    maxAmountEur: 25000000,
  },
  {
    url: "https://cordis.europa.eu/",
    title: "CORDIS — Service d'information sur les projets européens",
    summary:
      "Base de données officielle des projets de recherche financés par l'UE depuis 1990 (Horizon Europe, H2020, FP7). Outil de référence pour identifier des partenaires, repérer les thématiques financées, faire de la veille concurrentielle.",
    themes: ["Recherche", "Innovation", "Veille"],
    funder: "OPOCE / Commission Européenne",
    eligibleEntities: ["recherche", "universite", "entreprise"],
    eligibleCountries: ["EU"],
    maxAmountEur: 0,
  },
  {
    url: "https://www.horizon-europe.gouv.fr/",
    title: "Horizon Europe — Point de Contact National (France)",
    summary:
      "Portail français Horizon Europe (PCN). Information, accompagnement, mise en réseau pour les chercheurs, entreprises et établissements français candidats à Horizon Europe. Coordonné par le MESR.",
    themes: ["Recherche", "Innovation"],
    funder: "MESR / France",
    eligibleEntities: ["recherche", "universite", "entreprise"],
    eligibleCountries: ["FR"],
    maxAmountEur: 0,
  },

  // ─── PILIER 1 — EXCELLENCE SCIENTIFIQUE ──────────────────────────
  {
    url: "https://erc.europa.eu/funding",
    title: "Horizon Europe — ERC (European Research Council)",
    summary:
      "Conseil Européen de la Recherche : bourses individuelles d'excellence pour chercheurs (Starting, Consolidator, Advanced, Synergy, Proof of Concept). Subventions 1,5 à 10 M€ sur 5 ans. Critère unique : excellence scientifique.",
    themes: ["Recherche", "Excellence"],
    funder: "ERC / Commission Européenne",
    eligibleEntities: ["recherche", "universite"],
    eligibleCountries: ["EU"],
    minAmountEur: 1500000,
    maxAmountEur: 10000000,
  },
  {
    url: "https://erc.europa.eu/apply-grant/starting-grant",
    title: "ERC Starting Grant",
    summary:
      "Bourse ERC pour jeunes chercheurs (2 à 7 ans après le doctorat). Jusqu'à 1,5 M€ sur 5 ans pour constituer une équipe et lancer une ligne de recherche indépendante.",
    themes: ["Recherche", "Jeunes chercheurs"],
    funder: "ERC",
    eligibleEntities: ["recherche", "universite"],
    eligibleCountries: ["EU"],
    maxAmountEur: 1500000,
  },
  {
    url: "https://erc.europa.eu/apply-grant/consolidator-grant",
    title: "ERC Consolidator Grant",
    summary:
      "Bourse ERC pour chercheurs en milieu de carrière (7 à 12 ans après le doctorat). Jusqu'à 2 M€ sur 5 ans pour consolider une équipe de recherche d'excellence.",
    themes: ["Recherche"],
    funder: "ERC",
    eligibleEntities: ["recherche", "universite"],
    eligibleCountries: ["EU"],
    maxAmountEur: 2000000,
  },
  {
    url: "https://erc.europa.eu/apply-grant/advanced-grant",
    title: "ERC Advanced Grant",
    summary:
      "Bourse ERC pour chercheurs confirmés ayant un palmarès de réalisations significatives ces 10 dernières années. Jusqu'à 2,5 M€ sur 5 ans pour des projets de recherche aux frontières.",
    themes: ["Recherche", "Excellence"],
    funder: "ERC",
    eligibleEntities: ["recherche", "universite"],
    eligibleCountries: ["EU"],
    maxAmountEur: 2500000,
  },
  {
    url: "https://erc.europa.eu/apply-grant/synergy-grant",
    title: "ERC Synergy Grant",
    summary:
      "Bourse ERC pour des groupes de 2 à 4 chercheurs collaborant sur un projet commun ambitieux. Jusqu'à 10 M€ sur 6 ans.",
    themes: ["Recherche", "Excellence"],
    funder: "ERC",
    eligibleEntities: ["recherche", "universite"],
    eligibleCountries: ["EU"],
    maxAmountEur: 10000000,
  },
  {
    url: "https://marie-sklodowska-curie-actions.ec.europa.eu/",
    title: "Horizon Europe — MSCA (Marie Skłodowska-Curie Actions)",
    summary:
      "Actions Marie Skłodowska-Curie : mobilité et formation des chercheurs à tous les stades de carrière. Postdoctoral Fellowships, Doctoral Networks, Staff Exchanges, COFUND. 6,6 Md€ sur 2021-2027.",
    themes: ["Recherche", "Mobilité", "Formation"],
    funder: "REA / Commission Européenne",
    eligibleEntities: ["recherche", "universite", "entreprise"],
    eligibleCountries: ["EU"],
    minAmountEur: 100000,
    maxAmountEur: 5000000,
  },
  {
    url: "https://research-and-innovation.ec.europa.eu/funding/funding-opportunities/funding-programmes-and-open-calls/horizon-europe/research-infrastructures_en",
    title: "Horizon Europe — Infrastructures de Recherche",
    summary:
      "Soutien au développement, à l'intégration européenne et à l'accès aux infrastructures de recherche d'envergure (sciences du vivant, sciences sociales, environnement, énergie, physique).",
    themes: ["Recherche", "Infrastructures"],
    funder: "Commission Européenne",
    eligibleEntities: ["recherche", "universite"],
    eligibleCountries: ["EU"],
    maxAmountEur: 10000000,
  },

  // ─── PILIER 2 — CLUSTERS THÉMATIQUES ─────────────────────────────
  {
    url: "https://research-and-innovation.ec.europa.eu/funding/funding-opportunities/funding-programmes-and-open-calls/horizon-europe/cluster-1-health_en",
    title: "Horizon Europe — Cluster 1 Santé",
    summary:
      "Cluster Santé d'Horizon Europe (8,2 Md€). Projets collaboratifs sur la santé tout au long de la vie, systèmes de santé, environnement & santé, données de santé, maladies infectieuses, cancer.",
    themes: ["Santé", "Recherche"],
    funder: "HaDEA / Commission Européenne",
    eligibleEntities: ["recherche", "universite", "entreprise", "association"],
    eligibleCountries: ["EU"],
    minAmountEur: 1000000,
    maxAmountEur: 25000000,
  },
  {
    url: "https://research-and-innovation.ec.europa.eu/funding/funding-opportunities/funding-programmes-and-open-calls/horizon-europe/cluster-2-culture-creativity-and-inclusive-society_en",
    title: "Horizon Europe — Cluster 2 Culture, Créativité, Société Inclusive",
    summary:
      "Cluster 2 (2,3 Md€) sur la démocratie et gouvernance, l'héritage culturel et les industries créatives, les transformations sociales et économiques. Projets SHS, innovation sociale.",
    themes: ["Culture", "Société", "Démocratie", "Recherche"],
    funder: "REA / Commission Européenne",
    eligibleEntities: ["recherche", "association", "collectivite", "entreprise"],
    eligibleCountries: ["EU"],
    minAmountEur: 1000000,
    maxAmountEur: 10000000,
  },
  {
    url: "https://research-and-innovation.ec.europa.eu/funding/funding-opportunities/funding-programmes-and-open-calls/horizon-europe/cluster-3-civil-security-society_en",
    title: "Horizon Europe — Cluster 3 Sécurité civile pour la société",
    summary:
      "Cluster 3 (1,6 Md€) : sécurité civile, lutte contre la criminalité, gestion des frontières, cybersécurité, résilience aux catastrophes.",
    themes: ["Sécurité", "Recherche"],
    funder: "HaDEA / Commission Européenne",
    eligibleEntities: ["recherche", "entreprise", "collectivite"],
    eligibleCountries: ["EU"],
    minAmountEur: 1000000,
    maxAmountEur: 10000000,
  },
  {
    url: "https://research-and-innovation.ec.europa.eu/funding/funding-opportunities/funding-programmes-and-open-calls/horizon-europe/cluster-4-digital-industry-and-space_en",
    title: "Horizon Europe — Cluster 4 Numérique, Industrie & Espace",
    summary:
      "Cluster 4 (15 Md€) : numérique, industrie compétitive, technologies clés (IA, photonique, robotique, microélectronique), matériaux avancés, espace.",
    themes: ["Numérique", "Industrie", "Spatial", "Recherche"],
    funder: "REA / EISMEA / Commission Européenne",
    eligibleEntities: ["recherche", "entreprise"],
    eligibleCountries: ["EU"],
    minAmountEur: 2000000,
    maxAmountEur: 25000000,
  },
  {
    url: "https://research-and-innovation.ec.europa.eu/funding/funding-opportunities/funding-programmes-and-open-calls/horizon-europe/cluster-5-climate-energy-and-mobility_en",
    title: "Horizon Europe — Cluster 5 Climat, Énergie & Mobilité",
    summary:
      "Cluster 5 (15 Md€) : transition climatique, systèmes énergétiques décarbonés, mobilité propre et intelligente, communautés énergétiques.",
    themes: ["Climat", "Énergie", "Mobilité", "Recherche"],
    funder: "CINEA / Commission Européenne",
    eligibleEntities: ["recherche", "entreprise", "collectivite"],
    eligibleCountries: ["EU"],
    minAmountEur: 1000000,
    maxAmountEur: 25000000,
  },
  {
    url: "https://research-and-innovation.ec.europa.eu/funding/funding-opportunities/funding-programmes-and-open-calls/horizon-europe/cluster-6-food-bioeconomy-natural-resources-agriculture-and-environment_en",
    title: "Horizon Europe — Cluster 6 Alimentation, Bioéconomie, Ressources",
    summary:
      "Cluster 6 (8,9 Md€) : agriculture & sylviculture durables, biodiversité, économie circulaire, océans, alimentation. Lien fort avec le pacte vert.",
    themes: ["Alimentation", "Agriculture", "Biodiversité", "Recherche"],
    funder: "REA / Commission Européenne",
    eligibleEntities: ["recherche", "entreprise", "association"],
    eligibleCountries: ["EU"],
    minAmountEur: 1000000,
    maxAmountEur: 15000000,
  },

  // ─── PILIER 3 — EUROPE INNOVANTE ─────────────────────────────────
  {
    url: "https://eic.ec.europa.eu/eic-funding-opportunities/eic-pathfinder_en",
    title: "Horizon Europe — EIC Pathfinder",
    summary:
      "Conseil Européen de l'Innovation. Soutien aux recherches exploratoires deeptech aux frontières des sciences (TRL 1-4). Pathfinder Open + Pathfinder Challenges. Subventions jusqu'à 4 M€.",
    themes: ["Innovation", "Deeptech", "Recherche"],
    funder: "EIC / EISMEA",
    eligibleEntities: ["recherche", "entreprise"],
    eligibleCountries: ["EU"],
    maxAmountEur: 4000000,
  },
  {
    url: "https://eic.ec.europa.eu/eic-funding-opportunities/eic-transition_en",
    title: "Horizon Europe — EIC Transition",
    summary:
      "EIC Transition : soutien à la maturation des deeptech (TRL 4-5 vers TRL 5-6) pour préparer la commercialisation. Subventions jusqu'à 2,5 M€.",
    themes: ["Innovation", "Deeptech"],
    funder: "EIC / EISMEA",
    eligibleEntities: ["recherche", "entreprise"],
    eligibleCountries: ["EU"],
    maxAmountEur: 2500000,
  },
  {
    url: "https://eic.ec.europa.eu/eic-funding-opportunities/eic-accelerator_en",
    title: "Horizon Europe — EIC Accelerator",
    summary:
      "Soutien aux start-ups et PME deeptech ayant une innovation à fort potentiel. Combinaison subvention (jusqu'à 2,5 M€) + investissement en capital (jusqu'à 15 M€). Suivi long.",
    themes: ["Innovation", "Deeptech", "Start-up"],
    funder: "EIC / EISMEA",
    eligibleEntities: ["entreprise"],
    eligibleCountries: ["EU"],
    maxAmountEur: 17500000,
  },
  {
    url: "https://eit.europa.eu/our-activities/calls-for-proposals",
    title: "Horizon Europe — EIT (European Institute of Innovation & Technology)",
    summary:
      "Institut Européen d'Innovation et de Technologie. 9 KICs (Knowledge & Innovation Communities) thématiques : Climate, Digital, Food, Health, Manufacturing, Raw Materials, Urban Mobility, Cultural & Creative Industries, Water.",
    themes: ["Innovation", "Formation", "Industrie"],
    funder: "EIT / Commission Européenne",
    eligibleEntities: ["entreprise", "recherche", "universite"],
    eligibleCountries: ["EU"],
    maxAmountEur: 5000000,
  },

  // ─── WIDENING / EURATOM ──────────────────────────────────────────
  {
    url: "https://research-and-innovation.ec.europa.eu/funding/funding-opportunities/funding-programmes-and-open-calls/horizon-europe/widening-participation-and-strengthening-european-research-area_en",
    title: "Horizon Europe — Widening Participation",
    summary:
      "Programme Widening : élargir la participation aux pays sous-représentés dans Horizon Europe (ERA Chairs, Twinning, Teaming, Excellence Hubs, COST Actions).",
    themes: ["Recherche", "Coopération"],
    funder: "REA / Commission Européenne",
    eligibleEntities: ["recherche", "universite"],
    eligibleCountries: ["EU"],
    maxAmountEur: 15000000,
  },
  {
    url: "https://www.cost.eu/funding/",
    title: "COST Actions (réseautage scientifique européen)",
    summary:
      "Programme COST : réseaux thématiques pluriannuels (4 ans) connectant chercheurs, ingénieurs et entrepreneurs. Coordination uniquement (pas de financement de recherche directe). Ouvert à tous les domaines.",
    themes: ["Recherche", "Réseautage"],
    funder: "COST Association",
    eligibleEntities: ["recherche", "universite", "entreprise"],
    eligibleCountries: ["EU"],
    maxAmountEur: 600000,
  },
  {
    url: "https://research-and-innovation.ec.europa.eu/funding/funding-opportunities/funding-programmes-and-open-calls/horizon-europe/euratom-research-and-training-programme_en",
    title: "Horizon Europe — Euratom Research & Training",
    summary:
      "Programme Euratom 2021-2025 (1,38 Md€). Recherche sur la fission nucléaire sûre, gestion des déchets, radioprotection, fusion (ITER, EUROfusion).",
    themes: ["Énergie", "Nucléaire", "Recherche"],
    funder: "Commission Européenne (DG ENER)",
    eligibleEntities: ["recherche", "universite", "entreprise"],
    eligibleCountries: ["EU"],
    maxAmountEur: 10000000,
  },

  // ─── MISSIONS UE ─────────────────────────────────────────────────
  {
    url: "https://research-and-innovation.ec.europa.eu/funding/funding-opportunities/funding-programmes-and-open-calls/horizon-europe/eu-missions-horizon-europe_en",
    title: "Horizon Europe — Missions UE (5 missions)",
    summary:
      "5 missions UE pour 2030 : adaptation au changement climatique ; cancer ; restaurer océans et eaux ; 100 villes climatiquement neutres ; pacte du sol pour l'Europe. AAP transversaux engageant villes, citoyens, recherche.",
    themes: ["Climat", "Santé", "Villes", "Recherche"],
    funder: "Commission Européenne",
    eligibleEntities: ["recherche", "collectivite", "association", "entreprise"],
    eligibleCountries: ["EU"],
    minAmountEur: 500000,
    maxAmountEur: 25000000,
  },
];

export async function fetchHorizonPrograms(): Promise<HorizonProgram[]> {
  console.log(`[Horizon Europe / CORDIS] ${HORIZON_PROGRAMS.length} programmes curés`);
  return HORIZON_PROGRAMS;
}

export function transformHorizonToGrant(p: HorizonProgram) {
  return {
    sourceUrl: p.url,
    sourceName: "Horizon Europe / CORDIS",
    title: p.title,
    summary: p.summary,
    rawContent: p.summary,
    funder: p.funder,
    country: "EU",
    thematicAreas: p.themes,
    eligibleEntities: p.eligibleEntities ?? ["recherche", "universite", "entreprise"],
    eligibleCountries: p.eligibleCountries ?? ["EU"],
    minAmountEur: p.minAmountEur ?? 100000,
    maxAmountEur: p.maxAmountEur ?? 5000000,
    coFinancingRequired: true,
    deadline: null,
    grantType: "subvention",
    language: "en",
    status: "active",
    aiSummary: null,
  };
}
