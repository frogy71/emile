/**
 * Curated list of top 20 French foundations that fund associations/NGOs
 *
 * High-quality, manually maintained data with thematic areas,
 * estimated max amounts, and direct URLs.
 *
 * Updated: quarterly
 */

interface CuratedFoundation {
  name: string;
  themes: string[];
  url: string;
  summary: string;
  maxAmount: number;
}

const FONDATIONS: CuratedFoundation[] = [
  {
    name: "Fondation Abbé Pierre",
    themes: ["Logement", "Précarité", "Exclusion"],
    url: "https://www.fondation-abbe-pierre.fr/",
    summary: "Lutte contre le mal-logement et l'exclusion. Finance des projets d'hébergement, d'accès au logement et d'accompagnement social.",
    maxAmount: 200000,
  },
  {
    name: "Fondation de France",
    themes: ["Solidarité", "Environnement", "Culture", "Éducation", "Recherche"],
    url: "https://www.fondationdefrance.org/fr/appels-a-projets",
    summary: "1ère fondation française. Appels à projets dans tous les domaines de l'intérêt général. 3 000+ projets soutenus/an.",
    maxAmount: 100000,
  },
  {
    name: "Fondation Caritas France",
    themes: ["Solidarité", "Pauvreté", "Exclusion", "Migration"],
    url: "https://www.fondation-caritas.org/",
    summary: "Lutte contre la pauvreté et l'exclusion. Finance des projets d'insertion, d'hébergement et d'aide alimentaire.",
    maxAmount: 50000,
  },
  {
    name: "Fondation Daniel et Nina Carasso",
    themes: ["Alimentation durable", "Art citoyen"],
    url: "https://www.fondationcarasso.org/",
    summary: "Finance des projets innovants en alimentation durable et art citoyen. Appels à projets réguliers.",
    maxAmount: 150000,
  },
  {
    name: "Fondation MACIF",
    themes: ["Économie sociale", "Innovation sociale", "Inclusion"],
    url: "https://www.fondation-macif.org/",
    summary: "Soutient l'économie sociale et solidaire. Finance des projets d'inclusion, d'innovation sociale et de transition écologique.",
    maxAmount: 50000,
  },
  {
    name: "Fondation Nicolas Hulot",
    themes: ["Environnement", "Écologie", "Transition"],
    url: "https://www.fondation-nicolas-hulot.org/",
    summary: "Sensibilisation et actions pour la transition écologique. Soutient des projets de préservation de la biodiversité.",
    maxAmount: 30000,
  },
  {
    name: "Fondation Total Energies",
    themes: ["Éducation", "Insertion", "Patrimoine", "Biodiversité"],
    url: "https://foundation.totalenergies.com/fr",
    summary: "Fondation d'entreprise. Finance des projets d'éducation, d'insertion professionnelle, de biodiversité marine et de patrimoine culturel.",
    maxAmount: 100000,
  },
  {
    name: "Fondation Orange",
    themes: ["Numérique", "Éducation", "Santé", "Inclusion"],
    url: "https://www.fondationorange.com/",
    summary: "Fondation d'entreprise. Finance des projets numériques pour l'éducation, la santé et l'inclusion. Appels à projets annuels.",
    maxAmount: 30000,
  },
  {
    name: "Fondation Crédit Coopératif",
    themes: ["Économie sociale", "Innovation sociale", "Solidarité"],
    url: "https://www.credit-cooperatif.coop/fondation",
    summary: "Soutient l'innovation dans l'économie sociale et solidaire. Prix et bourses pour les structures ESS.",
    maxAmount: 20000,
  },
  {
    name: "Fondation SNCF",
    themes: ["Solidarité", "Éducation", "Insertion", "Mobilité"],
    url: "https://www.fondation-sncf.org/",
    summary: "Fondation d'entreprise. Soutient des projets de lutte contre l'illettrisme, d'insertion et de solidarité dans les territoires.",
    maxAmount: 30000,
  },
  {
    name: "Fondation Bettencourt Schueller",
    themes: ["Recherche", "Culture", "Solidarité"],
    url: "https://www.fondationbs.org/",
    summary: "Fondation majeure en France. Soutient la recherche scientifique, les talents artistiques et des projets solidaires innovants.",
    maxAmount: 500000,
  },
  {
    name: "Fondation Roi Baudouin (France)",
    themes: ["Solidarité", "Pauvreté", "Migration", "Justice sociale"],
    url: "https://www.kbs-frb.be/fr",
    summary: "Fondation européenne active en France. Programmes de lutte contre la pauvreté, justice sociale et migration.",
    maxAmount: 60000,
  },
  {
    name: "Fondation Apprentis d'Auteuil",
    themes: ["Jeunesse", "Éducation", "Protection de l'enfance", "Insertion"],
    url: "https://www.apprentis-auteuil.org/",
    summary: "Protection de l'enfance et insertion des jeunes. Programmes éducatifs et d'accompagnement en France et à l'international.",
    maxAmount: 100000,
  },
  {
    name: "Fondation Decathlon",
    themes: ["Sport", "Inclusion", "Jeunesse", "Handicap"],
    url: "https://www.fondation-decathlon.com/",
    summary: "Fondation d'entreprise. Favorise l'accès au sport pour les publics fragiles : jeunes, personnes handicapées, quartiers prioritaires.",
    maxAmount: 20000,
  },
  {
    name: "Fondation Vinci pour la Cité",
    themes: ["Insertion", "Emploi", "Mobilité", "Logement"],
    url: "https://www.fondation-vinci.com/",
    summary: "Fondation d'entreprise. Soutient des projets d'insertion professionnelle, de mobilité et d'accès au logement.",
    maxAmount: 50000,
  },
  {
    name: "Fondation Kering",
    themes: ["Droits des femmes", "Violences", "Égalité"],
    url: "https://www.keringfoundation.org/fr/",
    summary: "Lutte contre les violences faites aux femmes. Finance des associations de terrain et des programmes de prévention.",
    maxAmount: 100000,
  },
  {
    name: "Fondation Schneider Electric",
    themes: ["Énergie", "Formation", "Développement", "Insertion"],
    url: "https://www.se.com/fr/fr/about-us/sustainability/foundation/",
    summary: "Formation aux métiers de l'énergie et insertion professionnelle des jeunes. Active en France et pays en développement.",
    maxAmount: 50000,
  },
  {
    name: "Fondation Bouygues Telecom",
    themes: ["Éducation", "Numérique", "Égalité des chances"],
    url: "https://www.fondation-bouyguestelecom.org/",
    summary: "Fondation d'entreprise. Finance des projets éducatifs numériques pour l'égalité des chances.",
    maxAmount: 20000,
  },
  {
    name: "Fondation Avril",
    themes: ["Agriculture", "Alimentation", "Développement rural"],
    url: "https://www.fondationavril.org/",
    summary: "Soutient le développement agricole et rural en France et en Afrique. Finance des projets de sécurité alimentaire.",
    maxAmount: 80000,
  },
  {
    name: "Fondation Société Générale",
    themes: ["Insertion", "Éducation", "Sport", "Culture"],
    url: "https://www.fondation-societegenerale.com/",
    summary: "Fondation d'entreprise. Soutient l'insertion professionnelle et l'éducation via la pratique sportive et culturelle.",
    maxAmount: 30000,
  },
];

/**
 * Get all curated foundations as raw data
 */
export function fetchCuratedFoundations() {
  console.log(`[Fondations curatées] ${FONDATIONS.length} fondations`);
  return FONDATIONS;
}

/**
 * Transform curated foundation to grant schema
 */
export function transformCuratedToGrant(f: CuratedFoundation) {
  return {
    sourceUrl: f.url,
    sourceName: "Fondations françaises (curated)",
    title: f.name,
    summary: f.summary,
    rawContent: f.summary,
    funder: f.name,
    country: "FR",
    thematicAreas: f.themes,
    eligibleEntities: ["association", "ong"],
    eligibleCountries: ["FR"],
    minAmountEur: 1000,
    maxAmountEur: f.maxAmount,
    coFinancingRequired: false,
    deadline: null,
    grantType: "fondation",
    language: "fr",
    status: "active",
    aiSummary: f.summary,
  };
}
