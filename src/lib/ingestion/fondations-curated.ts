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
  // -- Extension 2026 : grandes fondations à fort volume --
  {
    name: "Fondation Bettencourt Schueller",
    themes: ["Sciences de la vie", "Culture", "Solidarité", "Arts"],
    url: "https://www.fondationbs.org/fr/candidater-pour-un-prix",
    summary: "Plusieurs prix annuels dans les sciences, les arts et la solidarité. Dotations importantes, jusqu'à 500 000 €.",
    maxAmount: 500000,
  },
  {
    name: "Fondation du Patrimoine",
    themes: ["Culture", "Patrimoine", "Territoires"],
    url: "https://www.fondation-patrimoine.org/",
    summary: "Sauvegarde du patrimoine de proximité (bâti, naturel, mobilier). Mécénat, souscriptions publiques, loto.",
    maxAmount: 100000,
  },
  {
    name: "Fondation Crédit Agricole — Pays de France",
    themes: ["Patrimoine", "Insertion", "Territoires", "Culture"],
    url: "https://fondation-ca-paysdefrance.org/",
    summary: "Soutient les projets d'intérêt général portés par les associations en région (patrimoine, insertion, culture).",
    maxAmount: 40000,
  },
  {
    name: "Fondation Orange",
    themes: ["Numérique", "Inclusion", "Éducation", "Handicap", "Culture"],
    url: "https://www.fondationorange.com/",
    summary: "Inclusion numérique, éducation, culture, autisme. Partenariats structurants pour associations.",
    maxAmount: 50000,
  },
  {
    name: "Fondation Vinci pour la Cité",
    themes: ["Insertion", "Solidarité", "Lien social"],
    url: "https://www.fondation-vinci.com/",
    summary: "Soutien à l'insertion par l'emploi et le logement. Appels à projets locaux via salariés parrains.",
    maxAmount: 15000,
  },
  {
    name: "Fondation Carrefour",
    themes: ["Alimentation", "Solidarité", "Précarité"],
    url: "https://www.fondation-carrefour.org/",
    summary: "Lutte contre la précarité alimentaire, transition alimentaire, urgence. Projets en France et à l'international.",
    maxAmount: 100000,
  },
  {
    name: "Fondation Michelin",
    themes: ["Mobilité", "Environnement", "Sport", "Santé", "Éducation"],
    url: "https://www.fondation.michelin.com/",
    summary: "Mobilité durable, santé, sport, éducation. Projets internationaux et dans les territoires Michelin.",
    maxAmount: 50000,
  },
  {
    name: "Fondation JM Bruneau",
    themes: ["Précarité", "Santé", "Éducation"],
    url: "https://www.fondation-bruneau.fr/",
    summary: "Soutient les projets d'aide aux personnes démunies : santé, éducation, insertion.",
    maxAmount: 30000,
  },
  {
    name: "Fondation de l'Olivier",
    themes: ["Précarité", "Santé", "Logement"],
    url: "https://www.fondationdelolivier.org/",
    summary: "Santé et précarité. Accès aux soins des personnes en grande exclusion.",
    maxAmount: 20000,
  },
  {
    name: "Fondation AG2R La Mondiale",
    themes: ["Lien social", "Autonomie", "Santé", "Prévention"],
    url: "https://www.ag2rlamondiale.fr/",
    summary: "Prévention santé, autonomie des personnes âgées, lien intergénérationnel.",
    maxAmount: 50000,
  },
  {
    name: "Fondation L'Oréal",
    themes: ["Femmes", "Sciences", "Recherche"],
    url: "https://www.fondationloreal.com/",
    summary: "Soutien aux femmes dans les sciences (prix L'Oréal-UNESCO), beauté pour tous, femmes vulnérables.",
    maxAmount: 100000,
  },
  {
    name: "Fondation Veolia",
    themes: ["Environnement", "Solidarité", "Eau", "Déchets"],
    url: "https://www.fondation.veolia.com/",
    summary: "Projets environnementaux et humanitaires. Mobilise le mécénat de compétences des salariés.",
    maxAmount: 75000,
  },
  {
    name: "Fondation Engie",
    themes: ["Énergie", "Précarité énergétique", "Environnement"],
    url: "https://www.fondation-engie.com/",
    summary: "Lutte contre la précarité énergétique, accès à l'énergie durable en France et à l'international.",
    maxAmount: 80000,
  },
  {
    name: "Fondation Schneider Electric",
    themes: ["Formation", "Insertion", "Énergie"],
    url: "https://www.foundation.se.com/",
    summary: "Formation aux métiers de l'énergie pour les jeunes en insertion. Programmes internationaux.",
    maxAmount: 60000,
  },
  {
    name: "Fondation BNP Paribas",
    themes: ["Culture", "Solidarité", "Recherche", "Environnement"],
    url: "https://fondation.bnpparibas/fr/nos-appels-a-projets/",
    summary: "Culture, recherche médicale, changement climatique, insertion. Appels à projets structurants.",
    maxAmount: 100000,
  },
  {
    name: "Fondation La France s'engage",
    themes: ["Innovation sociale", "Solidarité", "Éducation"],
    url: "https://www.fondationlafrancesengage.org/",
    summary: "Soutient les innovateurs sociaux avec un financement pluriannuel (jusqu'à 300 k€) et un accompagnement.",
    maxAmount: 300000,
  },
  {
    name: "Fondation Macif",
    themes: ["Insertion", "Solidarité", "ESS"],
    url: "https://www.fondation-macif.org/",
    summary: "Économie sociale et solidaire, insertion, santé, éducation. Fondation d'entreprise à forte portée nationale.",
    maxAmount: 50000,
  },
  {
    name: "Fondation Caisse d'Épargne",
    themes: ["Autonomie", "Dépendance", "Culture"],
    url: "https://www.fondation-caisse-epargne.fr/",
    summary: "Lutte contre la dépendance, soutien aux aidants, inclusion sociale.",
    maxAmount: 40000,
  },
  {
    name: "Fondation Air Liquide",
    themes: ["Environnement", "Santé respiratoire", "Éducation"],
    url: "https://fondationairliquide.com/",
    summary: "Environnement, santé respiratoire, développement local. Projets en France et à l'international.",
    maxAmount: 50000,
  },
  {
    name: "Fondation Hermès",
    themes: ["Culture", "Artisanat", "Savoir-faire"],
    url: "https://www.fondationdentreprisehermes.org/",
    summary: "Savoir-faire artisanal, solidarité, biodiversité, création contemporaine.",
    maxAmount: 60000,
  },
  {
    name: "Fondation Sanofi Espoir",
    themes: ["Santé", "Pauvreté infantile", "International"],
    url: "https://www.fondation-sanofi.org/",
    summary: "Santé des mères et enfants dans les zones fragiles, lutte contre les cancers pédiatriques.",
    maxAmount: 100000,
  },
  {
    name: "Fondation Bouygues Telecom",
    themes: ["Culture", "Patrimoine", "Numérique", "Solidarité"],
    url: "https://www.fondationbouyguestelecom.fr/",
    summary: "Coup de pouce aux projets associatifs locaux. Nombreux petits dons.",
    maxAmount: 10000,
  },
  {
    name: "Fondation RATP",
    themes: ["Insertion", "Éducation", "Lien social", "Inclusion"],
    url: "https://www.fondationratp.fr/",
    summary: "Insertion et lutte contre la fracture sociale dans les territoires urbains.",
    maxAmount: 30000,
  },
  {
    name: "Fondation Decathlon",
    themes: ["Sport", "Inclusion", "Santé"],
    url: "https://fondation.decathlon.com/",
    summary: "Accès au sport pour les personnes éloignées de la pratique (handicap, précarité).",
    maxAmount: 30000,
  },
  {
    name: "Fondation RAJA-Danièle Marcovici",
    themes: ["Femmes", "Droits", "International"],
    url: "https://www.fondation-raja-marcovici.com/",
    summary: "Promotion de la condition féminine en France et dans le monde. Projets portés par des associations.",
    maxAmount: 50000,
  },
  {
    name: "Fondation Afnic pour la solidarité numérique",
    themes: ["Numérique", "Inclusion", "Territoires"],
    url: "https://www.fondation-afnic.fr/",
    summary: "Solidarité numérique. Appels à projets annuels pour les initiatives associatives.",
    maxAmount: 20000,
  },
  {
    name: "Fondation SNCF",
    themes: ["Éducation", "Insertion", "Lien social"],
    url: "https://www.fondation-sncf.org/",
    summary: "Éducation des jeunes, prévention de l'illettrisme, lien social dans les territoires.",
    maxAmount: 50000,
  },
  {
    name: "Fondation RTE",
    themes: ["Territoires", "Lien social", "Ruralité"],
    url: "https://www.fondation-rte.org/",
    summary: "Cohésion des territoires ruraux, énergie, mobilité, lien social.",
    maxAmount: 40000,
  },
  {
    name: "Fondation Banque Populaire",
    themes: ["Handicap", "Musique", "Artisanat"],
    url: "https://www.fondation.banquepopulaire.fr/",
    summary: "Bourses et prix pour les personnes handicapées, musiciens et artisans d'art.",
    maxAmount: 25000,
  },
  {
    name: "Fondation Daniel et Nina Carasso",
    themes: ["Alimentation durable", "Art citoyen"],
    url: "https://www.fondationcarasso.org/",
    summary: "Alimentation durable et art citoyen. Fondation franco-espagnole de grande taille.",
    maxAmount: 150000,
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
