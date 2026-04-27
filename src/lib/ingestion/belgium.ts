/**
 * Sources belges — Wallonie, Bruxelles, Fédération Wallonie-Bruxelles
 *
 * La Belgique est un pays partenaire historique des associations
 * francophones (réseau, projets transfrontaliers, diaspora). Trois grands
 * niveaux de financement public francophone :
 *  - Fédération Wallonie-Bruxelles (compétences personnalisables : culture,
 *    enseignement, jeunesse, sport, médias)
 *  - Région wallonne (économie, emploi, environnement)
 *  - Région de Bruxelles-Capitale
 *
 * Plus quelques fondations belges majeures (Fondation Roi Baudouin
 * notamment).
 */

export interface BelgiumProgram {
  url: string;
  title: string;
  summary: string;
  themes: string[];
  funder: string;
  region?: string;
  eligibleEntities?: string[];
  eligibleCountries?: string[];
  minAmountEur?: number | null;
  maxAmountEur?: number | null;
}

const BELGIUM_PROGRAMS: BelgiumProgram[] = [
  // ─── FÉDÉRATION WALLONIE-BRUXELLES ──────────────────────────────
  {
    url: "https://www.federation-wallonie-bruxelles.be/subventions/",
    title: "Fédération Wallonie-Bruxelles — Portail subventions",
    summary:
      "Portail des subventions de la Fédération Wallonie-Bruxelles (Communauté française de Belgique). Compétences : culture, jeunesse, sport, médias, enseignement, recherche scientifique.",
    themes: ["Culture", "Jeunesse", "Sport", "Médias", "Éducation"],
    funder: "Fédération Wallonie-Bruxelles",
    region: "FWB",
    eligibleEntities: ["association", "ong", "ecole"],
    eligibleCountries: ["BE"],
    maxAmountEur: 200000,
  },
  {
    url: "https://www.culture.be/subventions/",
    title: "FWB — Subventions Culture",
    summary:
      "Subventions de la Fédération Wallonie-Bruxelles aux opérateurs culturels : arts vivants, lettres et livre, arts plastiques, audiovisuel, patrimoine, action culturelle.",
    themes: ["Culture", "Spectacle vivant", "Patrimoine"],
    funder: "Fédération Wallonie-Bruxelles — Culture",
    region: "FWB",
    eligibleEntities: ["association", "entreprise"],
    eligibleCountries: ["BE"],
    maxAmountEur: 500000,
  },
  {
    url: "https://www.centreduwallonpicard.be/aides-fwb/",
    title: "FWB — Aides spécifiques au théâtre, à la danse, à la musique",
    summary:
      "Aides FWB aux compagnies, ensembles et lieux du spectacle vivant en Communauté française : conventions, contrats programme, aides ponctuelles à la création.",
    themes: ["Culture", "Spectacle vivant"],
    funder: "Fédération Wallonie-Bruxelles",
    region: "FWB",
    eligibleEntities: ["association", "entreprise"],
    eligibleCountries: ["BE"],
    maxAmountEur: 300000,
  },
  {
    url: "https://www.audiovisuel.cfwb.be/aides/",
    title: "FWB — CCA / Centre du Cinéma et de l'Audiovisuel",
    summary:
      "Aides du Centre du Cinéma et de l'Audiovisuel : développement, production, distribution de films belges francophones (longs métrages, courts, documentaires, séries).",
    themes: ["Culture", "Cinéma", "Audiovisuel"],
    funder: "FWB — CCA",
    region: "FWB",
    eligibleEntities: ["entreprise"],
    eligibleCountries: ["BE"],
    maxAmountEur: 1500000,
  },
  {
    url: "https://www.lettresetlivre.cfwb.be/aides/",
    title: "FWB — Service du Livre et de la Lecture",
    summary:
      "Aides FWB aux librairies, maisons d'édition, auteurs et bibliothèques : bourses de création, soutien aux maisons d'édition, achats de livres pour les bibliothèques publiques.",
    themes: ["Culture", "Livre", "Lecture"],
    funder: "FWB — Service du Livre",
    region: "FWB",
    eligibleEntities: ["association", "entreprise"],
    eligibleCountries: ["BE"],
    maxAmountEur: 100000,
  },
  {
    url: "https://www.servicejeunesse.cfwb.be/subventions/",
    title: "FWB — Service de la Jeunesse (OJ et CJ)",
    summary:
      "Subventions aux Organisations de Jeunesse (OJ) et Centres de Jeunesse (CJ) reconnus par la FWB. Conventions pluriannuelles pour l'animation socioculturelle des jeunes.",
    themes: ["Jeunesse", "Engagement"],
    funder: "FWB — Service Jeunesse",
    region: "FWB",
    eligibleEntities: ["association"],
    eligibleCountries: ["BE"],
    maxAmountEur: 200000,
  },
  {
    url: "https://www.education-permanente.cfwb.be/aides/",
    title: "FWB — Éducation permanente",
    summary:
      "Subventions aux associations d'éducation permanente reconnues par la FWB. Activités d'analyse critique, formation citoyenne, mobilisation collective des publics adultes.",
    themes: ["Éducation", "Engagement", "Démocratie"],
    funder: "FWB — Éducation permanente",
    region: "FWB",
    eligibleEntities: ["association"],
    eligibleCountries: ["BE"],
    maxAmountEur: 300000,
  },

  // ─── RÉGION WALLONNE ─────────────────────────────────────────────
  {
    url: "https://www.wallonie.be/fr/aides-financieres",
    title: "Région wallonne — Portail aides financières",
    summary:
      "Portail centralisé des aides de la Région wallonne : économie, emploi, énergie, environnement, agriculture, action sociale, logement.",
    themes: ["Entreprises", "Emploi", "Environnement", "Social"],
    funder: "Service Public de Wallonie (SPW)",
    region: "Wallonie",
    eligibleEntities: ["association", "entreprise", "collectivite"],
    eligibleCountries: ["BE"],
    maxAmountEur: 500000,
  },
  {
    url: "https://environnement.wallonie.be/aides/",
    title: "Région wallonne — Aides environnement & climat",
    summary:
      "Aides de la Région wallonne pour la transition écologique : économie circulaire, biodiversité, climat, énergie, qualité de l'air et de l'eau.",
    themes: ["Environnement", "Climat", "Transition écologique"],
    funder: "SPW — DGO3 Agriculture, Ressources naturelles et Environnement",
    region: "Wallonie",
    eligibleEntities: ["association", "entreprise", "collectivite"],
    eligibleCountries: ["BE"],
    maxAmountEur: 300000,
  },
  {
    url: "https://emploi.wallonie.be/home/aides-emploi.html",
    title: "Région wallonne — Aides à l'emploi & formation",
    summary:
      "Aides régionales wallonnes pour la création d'emploi, l'insertion socio-professionnelle, la formation, l'économie sociale (Initiatives d'Économie Sociale, IES).",
    themes: ["Emploi", "Insertion", "Formation"],
    funder: "SPW Économie Emploi",
    region: "Wallonie",
    eligibleEntities: ["association", "entreprise"],
    eligibleCountries: ["BE"],
    maxAmountEur: 250000,
  },
  {
    url: "https://socialsante.wallonie.be/aides/",
    title: "Région wallonne — Aides Action sociale & Santé",
    summary:
      "Aides de la Région wallonne dans les domaines de l'action sociale, de la santé, de la famille, du handicap, de l'égalité des chances.",
    themes: ["Solidarité", "Santé", "Handicap"],
    funder: "SPW Action Sociale et Santé",
    region: "Wallonie",
    eligibleEntities: ["association"],
    eligibleCountries: ["BE"],
    maxAmountEur: 200000,
  },
  {
    url: "https://www.aviq.be/agrements-et-subventions",
    title: "AVIQ — Agence Wallonne pour une Vie de Qualité",
    summary:
      "Agence wallonne pilotant les politiques santé, handicap, bien-être social, familles. Agréments et subventions pour les structures médico-sociales et associatives.",
    themes: ["Santé", "Handicap", "Médico-social"],
    funder: "AVIQ",
    region: "Wallonie",
    eligibleEntities: ["association", "etablissement-sante"],
    eligibleCountries: ["BE"],
    maxAmountEur: 500000,
  },
  {
    url: "https://wbi.be/fr/aides-financieres",
    title: "WBI — Wallonie-Bruxelles International",
    summary:
      "Agence chargée des relations internationales de la Wallonie et de la FWB. Bourses, soutien aux projets internationaux, mobilité culturelle, coopération au développement.",
    themes: ["International", "Culture", "Coopération"],
    funder: "Wallonie-Bruxelles International",
    region: "FWB",
    eligibleEntities: ["association", "entreprise"],
    eligibleCountries: ["BE"],
    maxAmountEur: 100000,
  },
  {
    url: "https://wbi.be/fr/services/cooperation-au-developpement-aide-humanitaire",
    title: "WBI — Coopération au développement & Aide humanitaire",
    summary:
      "Volet coopération internationale de WBI. Cofinancement de projets d'ONG belges francophones dans les pays partenaires (Afrique de l'Ouest, Maghreb, Amérique latine).",
    themes: ["Solidarité internationale", "Coopération"],
    funder: "WBI / DGD Belgique",
    region: "FWB",
    eligibleEntities: ["association", "ong"],
    eligibleCountries: ["BE"],
    maxAmountEur: 500000,
  },

  // ─── BRUXELLES-CAPITALE ──────────────────────────────────────────
  {
    url: "https://be.brussels/fr/services/subsides",
    title: "Région de Bruxelles-Capitale — Portail subsides",
    summary:
      "Portail des subsides régionaux bruxellois : économie, emploi, environnement, mobilité, urbanisme, logement, cohésion sociale, propreté, sécurité.",
    themes: ["Territoires", "Cohésion sociale", "Environnement"],
    funder: "Région de Bruxelles-Capitale",
    region: "Bruxelles-Capitale",
    eligibleEntities: ["association", "entreprise", "collectivite"],
    eligibleCountries: ["BE"],
    maxAmountEur: 300000,
  },
  {
    url: "https://hub.brussels/fr/aides-financieres-region-bruxelles-capitale/",
    title: "hub.brussels — Aides aux entreprises (Bruxelles)",
    summary:
      "Agence de l'entrepreneuriat bruxelloise : primes, prêts, accompagnement pour la création, le développement et l'internationalisation des entreprises bruxelloises.",
    themes: ["Entreprises", "Innovation"],
    funder: "hub.brussels / Région de Bruxelles-Capitale",
    region: "Bruxelles-Capitale",
    eligibleEntities: ["entreprise"],
    eligibleCountries: ["BE"],
    maxAmountEur: 200000,
  },
  {
    url: "https://environnement.brussels/professionnels/aides-financieres-et-primes",
    title: "Bruxelles Environnement — Primes & subsides",
    summary:
      "Aides régionales bruxelloises pour la transition écologique : énergie, climat, biodiversité, économie circulaire, qualité de l'air, alimentation durable.",
    themes: ["Environnement", "Climat", "Énergie"],
    funder: "Bruxelles Environnement",
    region: "Bruxelles-Capitale",
    eligibleEntities: ["association", "entreprise", "collectivite"],
    eligibleCountries: ["BE"],
    maxAmountEur: 250000,
  },
  {
    url: "https://equal.brussels/subsides/",
    title: "equal.brussels — Égalité des chances (RBC)",
    summary:
      "Service public régional bruxellois en charge de l'égalité des chances : genre, LGBTQI+, handicap, antiracisme, lutte contre les discriminations. Subventions associatives.",
    themes: ["Égalité", "Droits humains", "Société"],
    funder: "equal.brussels",
    region: "Bruxelles-Capitale",
    eligibleEntities: ["association"],
    eligibleCountries: ["BE"],
    maxAmountEur: 50000,
  },
  {
    url: "https://www.cocof.brussels/subsides/",
    title: "COCOF — Commission communautaire française (Bruxelles)",
    summary:
      "Compétences communautaires francophones à Bruxelles : action sociale, santé, famille, formation professionnelle, culture, sport, jeunesse.",
    themes: ["Solidarité", "Santé", "Culture"],
    funder: "COCOF",
    region: "Bruxelles-Capitale",
    eligibleEntities: ["association"],
    eligibleCountries: ["BE"],
    maxAmountEur: 200000,
  },

  // ─── FONDATIONS BELGES MAJEURES ──────────────────────────────────
  {
    url: "https://www.kbs-frb.be/fr/appels-projets",
    title: "Fondation Roi Baudouin (FRB)",
    summary:
      "Plus grande fondation belge (~70 M€/an de subventions). AAP réguliers : pauvreté, santé, intégration, héritage culturel, Afrique. Travaille aussi avec la diaspora et la philanthropie.",
    themes: ["Solidarité", "Santé", "Culture", "Afrique"],
    funder: "Fondation Roi Baudouin",
    eligibleEntities: ["association", "ong"],
    eligibleCountries: ["BE", "EU", "FR"],
    maxAmountEur: 500000,
  },
  {
    url: "https://www.bevoorrechte-getuige.be/",
    title: "Fondation P&V — Engagement des jeunes",
    summary:
      "Fondation belge dédiée à l'engagement citoyen des jeunes, à la mémoire et à la lutte contre le racisme. Soutien à des projets associatifs en Belgique francophone.",
    themes: ["Jeunesse", "Engagement", "Démocratie"],
    funder: "Fondation P&V",
    eligibleEntities: ["association", "ecole"],
    eligibleCountries: ["BE"],
    maxAmountEur: 50000,
  },
  {
    url: "https://www.fondationbernheim.be/",
    title: "Fondation Bernheim",
    summary:
      "Fondation d'utilité publique belge soutenant la citoyenneté active, la culture et les médias d'information indépendants en Belgique francophone.",
    themes: ["Démocratie", "Médias", "Culture"],
    funder: "Fondation Bernheim",
    eligibleEntities: ["association", "ong"],
    eligibleCountries: ["BE"],
    maxAmountEur: 100000,
  },
];

export async function fetchBelgiumPrograms(): Promise<BelgiumProgram[]> {
  console.log(`[Belgique (Wallonie + Bruxelles)] ${BELGIUM_PROGRAMS.length} programmes curés`);
  return BELGIUM_PROGRAMS;
}

export function transformBelgiumToGrant(p: BelgiumProgram) {
  return {
    sourceUrl: p.url,
    sourceName: "Belgique (Wallonie + Bruxelles)",
    title: p.title,
    summary: p.summary,
    rawContent: p.summary,
    funder: p.funder,
    country: "BE",
    thematicAreas: p.themes,
    eligibleEntities: p.eligibleEntities ?? ["association", "entreprise"],
    eligibleCountries: p.eligibleCountries ?? ["BE"],
    minAmountEur: p.minAmountEur ?? 5000,
    maxAmountEur: p.maxAmountEur ?? 200000,
    coFinancingRequired: false,
    deadline: null,
    grantType: "subvention",
    language: "fr",
    status: "active",
    aiSummary: null,
  };
}
