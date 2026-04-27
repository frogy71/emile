/**
 * Mécénat d'entreprise — programmes directs (hors fondations)
 *
 * Beaucoup d'entreprises ne créent pas de fondation mais engagent des
 * dépenses de mécénat directes via une direction dédiée (RSE,
 * communication, engagement) ou un fonds de dotation. C'est complémentaire
 * de fondations-curated.ts (qui couvre les fondations d'entreprise
 * formellement constituées).
 *
 * Ces dispositifs ouvrent fréquemment des AAP, prix, et appels à
 * candidatures aux associations.
 */

export interface MecenatProgram {
  url: string;
  title: string;
  summary: string;
  themes: string[];
  funder: string;
  eligibleEntities?: string[];
  minAmountEur?: number | null;
  maxAmountEur?: number | null;
}

const MECENAT_PROGRAMS: MecenatProgram[] = [
  // ─── ENERGIE / INDUSTRIES ───────────────────────────────────────
  {
    url: "https://www.totalenergies.com/fr/totalenergies-foundation/projets-soutenus",
    title: "TotalEnergies — Mécénat (au-delà de la Fondation)",
    summary:
      "Programme de mécénat international de TotalEnergies en complément de sa fondation : sécurité routière, accès à l'énergie, éducation, environnement. Implantations dans 130+ pays.",
    themes: ["Énergie", "Solidarité", "Climat", "Éducation"],
    funder: "TotalEnergies",
    eligibleEntities: ["association", "ong"],
    maxAmountEur: 500000,
  },
  {
    url: "https://www.engie.com/responsabilites/engagement-societal",
    title: "ENGIE — Engagement sociétal & mécénat",
    summary:
      "Mécénat ENGIE en France et à l'international : transition énergétique solidaire, lutte contre la précarité énergétique, accès à l'énergie dans les pays du Sud.",
    themes: ["Énergie", "Précarité", "Climat"],
    funder: "ENGIE",
    eligibleEntities: ["association"],
    maxAmountEur: 100000,
  },
  {
    url: "https://www.edf.fr/groupe-edf/responsable-et-engage/agir-en-entreprise-engagee-pour-la-societe",
    title: "EDF — Mécénat & engagement",
    summary:
      "Programme de mécénat EDF (au-delà de la Fondation) : insertion par l'emploi, lutte contre la précarité énergétique, soutien aux territoires.",
    themes: ["Précarité", "Insertion", "Énergie"],
    funder: "EDF",
    eligibleEntities: ["association"],
    maxAmountEur: 100000,
  },
  {
    url: "https://www.airliquide.com/fr/groupe/notre-engagement",
    title: "Air Liquide — Mécénat & engagement social",
    summary:
      "Programme de mécénat d'Air Liquide : santé respiratoire, environnement, éducation. Présence dans 75+ pays.",
    themes: ["Santé", "Environnement", "Éducation"],
    funder: "Air Liquide",
    eligibleEntities: ["association", "ong"],
    maxAmountEur: 100000,
  },
  {
    url: "https://www.veolia.com/fr/groupe/qui-sommes-nous/responsabilite",
    title: "Veolia — Mécénat & impact territorial",
    summary:
      "Programme de mécénat Veolia (au-delà de sa fondation) : eau, déchets, énergie, économie circulaire. Soutien aux ONG humanitaires (Veoliaforce — volontariat de compétences).",
    themes: ["Environnement", "Eau", "Solidarité"],
    funder: "Veolia",
    eligibleEntities: ["association", "ong"],
    maxAmountEur: 200000,
  },
  {
    url: "https://www.suez.com/fr/notre-groupe/notre-vision/notre-engagement",
    title: "Suez — Mécénat & engagement",
    summary:
      "Programme de mécénat Suez : eau, environnement, économie circulaire, accès à l'eau et à l'assainissement dans les pays en développement.",
    themes: ["Environnement", "Eau", "Solidarité"],
    funder: "Suez",
    eligibleEntities: ["association", "ong"],
    maxAmountEur: 100000,
  },

  // ─── BANQUES & ASSURANCES ───────────────────────────────────────
  {
    url: "https://www.bnpparibas.com/fr/engagement",
    title: "BNP Paribas — Engagement & mécénat",
    summary:
      "Programme de mécénat BNP Paribas (au-delà de la Fondation) : entrepreneuriat social, microfinance, transition écologique. Implication dans 60+ pays.",
    themes: ["Solidarité", "Entrepreneuriat social", "Microfinance"],
    funder: "BNP Paribas",
    eligibleEntities: ["association", "ong"],
    maxAmountEur: 500000,
  },
  {
    url: "https://www.societegenerale.com/fr/responsabilite/mecenat-engagement",
    title: "Société Générale — Mécénat",
    summary:
      "Mécénat Société Générale : insertion par l'emploi, éducation, solidarités. Présence en France et à l'international.",
    themes: ["Insertion", "Éducation", "Solidarité"],
    funder: "Société Générale",
    eligibleEntities: ["association"],
    maxAmountEur: 100000,
  },
  {
    url: "https://www.creditmutuel.com/fr/responsabilite/mecenat-solidarite.html",
    title: "Crédit Mutuel — Mécénat & solidarité (au-delà des fondations)",
    summary:
      "Mécénat des banques régionales du Crédit Mutuel : solidarité, éducation, culture, action territoriale.",
    themes: ["Solidarité", "Culture", "Territoires"],
    funder: "Crédit Mutuel",
    eligibleEntities: ["association"],
    maxAmountEur: 50000,
  },
  {
    url: "https://www.axa.com/fr/notre-engagement",
    title: "AXA — Mécénat & engagement",
    summary:
      "Mécénat AXA (au-delà du Fonds AXA pour la Recherche et de l'AXA Research Fund) : prévention des risques, climat, solidarité.",
    themes: ["Recherche", "Climat", "Prévention"],
    funder: "AXA",
    eligibleEntities: ["association", "recherche"],
    maxAmountEur: 200000,
  },
  {
    url: "https://www.aviva.fr/aviva-france/notre-engagement-societal",
    title: "Aviva France — Mécénat & engagement",
    summary:
      "Programme de mécénat Aviva France : insertion par l'emploi, lutte contre la pauvreté, éducation financière, environnement.",
    themes: ["Insertion", "Solidarité", "Éducation"],
    funder: "Aviva France",
    eligibleEntities: ["association"],
    maxAmountEur: 50000,
  },
  {
    url: "https://www.macif.fr/assurance/particuliers/qui-sommes-nous/engagement",
    title: "Macif — Mécénat solidaire",
    summary:
      "Mécénat Macif (au-delà de sa fondation) : économie sociale et solidaire, mobilité solidaire, santé, jeunesse.",
    themes: ["Économie sociale", "Solidarité", "Mobilité"],
    funder: "Macif",
    eligibleEntities: ["association"],
    maxAmountEur: 50000,
  },
  {
    url: "https://www.maif.fr/qui-sommes-nous/notre-mission/engagement",
    title: "MAIF — Mécénat & engagement",
    summary:
      "Mécénat MAIF (entreprise à mission) : éducation populaire, prévention, accès à la culture, accompagnement des aidants. Engagement militant.",
    themes: ["Éducation", "Solidarité", "Culture"],
    funder: "MAIF",
    eligibleEntities: ["association"],
    maxAmountEur: 100000,
  },

  // ─── DISTRIBUTION / GRANDE CONSO ────────────────────────────────
  {
    url: "https://www.carrefour.com/fr/engagements/societe/programme-fondation-carrefour",
    title: "Carrefour — Mécénat & engagement (hors Fondation)",
    summary:
      "Mécénat Carrefour : aide alimentaire (Banques Alimentaires, Restos du Cœur), agriculture durable, solidarités locales. Au-delà du programme Fondation.",
    themes: ["Aide alimentaire", "Agriculture", "Solidarité"],
    funder: "Carrefour",
    eligibleEntities: ["association"],
    maxAmountEur: 100000,
  },
  {
    url: "https://www.danone.com/fr/about-danone/sustainable-value-creation.html",
    title: "Danone — Programme Communities (mécénat)",
    summary:
      "Initiatives de mécénat de Danone (au-delà de Danone Communities et Livelihoods) : nutrition, accès à l'eau, agriculture régénératrice.",
    themes: ["Nutrition", "Eau", "Agriculture"],
    funder: "Danone",
    eligibleEntities: ["association", "ong"],
    maxAmountEur: 200000,
  },
  {
    url: "https://www.unilever.fr/notre-engagement/mecenat/",
    title: "Unilever France — Mécénat & engagement",
    summary:
      "Mécénat Unilever France : nutrition, hygiène, durabilité environnementale, inclusion sociale.",
    themes: ["Nutrition", "Santé", "Environnement"],
    funder: "Unilever France",
    eligibleEntities: ["association"],
    maxAmountEur: 50000,
  },
  {
    url: "https://www.michelin.com/notre-engagement-societal/",
    title: "Michelin — Engagement sociétal",
    summary:
      "Programme d'engagement Michelin : mobilité durable, sécurité routière, environnement, formation aux métiers de l'industrie.",
    themes: ["Mobilité", "Climat", "Formation"],
    funder: "Michelin",
    eligibleEntities: ["association"],
    maxAmountEur: 100000,
  },
  {
    url: "https://www.lvmh.fr/groupe/engagement-societal/",
    title: "LVMH — Mécénat (hors Fondation Louis Vuitton)",
    summary:
      "Mécénat LVMH au-delà de la Fondation Louis Vuitton : Institut des Métiers d'Excellence, mécénat solidaire, cultures urbaines, recherche médicale (Pasteur).",
    themes: ["Culture", "Formation", "Solidarité", "Recherche"],
    funder: "LVMH",
    eligibleEntities: ["association"],
    maxAmountEur: 500000,
  },
  {
    url: "https://www.kering.com/fr/groupe/engagement/",
    title: "Kering — Engagement & mécénat",
    summary:
      "Mécénat Kering : lutte contre les violences faites aux femmes (Kering Foundation), durabilité de la mode, biodiversité. Programmes globaux.",
    themes: ["Égalité", "Femmes", "Mode durable"],
    funder: "Kering",
    eligibleEntities: ["association", "ong"],
    maxAmountEur: 500000,
  },
  {
    url: "https://www.loreal.com/fr/articles/commitments/mecenat/",
    title: "L'Oréal — Mécénat & engagement (hors Fondation)",
    summary:
      "Initiatives mécénat L'Oréal (au-delà de la Fondation L'Oréal) : femmes & sciences, durabilité, beauté solidaire, formation aux métiers de la beauté pour publics vulnérables.",
    themes: ["Femmes", "Recherche", "Insertion"],
    funder: "L'Oréal",
    eligibleEntities: ["association", "ong"],
    maxAmountEur: 200000,
  },

  // ─── BTP / IMMOBILIER ───────────────────────────────────────────
  {
    url: "https://www.bouygues.com/responsabilite/mecenat-engagement/",
    title: "Bouygues — Mécénat groupe",
    summary:
      "Programme de mécénat groupe Bouygues : insertion par l'emploi, éducation, accès au logement, solidarités locales.",
    themes: ["Insertion", "Éducation", "Logement"],
    funder: "Bouygues",
    eligibleEntities: ["association"],
    maxAmountEur: 100000,
  },
  {
    url: "https://www.vinci.com/vinci.nsf/fr/responsabilite/pages/mecenat.htm",
    title: "Vinci — Mécénat (Fondation + au-delà)",
    summary:
      "Mécénat Vinci : insertion par l'activité économique, accompagnement des publics fragiles, mobilité solidaire. Au-delà de la Fondation Vinci pour la Cité.",
    themes: ["Insertion", "Solidarité", "Mobilité"],
    funder: "Vinci",
    eligibleEntities: ["association"],
    maxAmountEur: 100000,
  },
  {
    url: "https://www.eiffage.com/groupe/responsabilite/societe/fondation",
    title: "Eiffage — Engagement sociétal & mécénat",
    summary:
      "Programme de mécénat Eiffage : insertion par l'emploi (Initiatives Solidaires), patrimoine bâti, éducation aux métiers du BTP.",
    themes: ["Insertion", "Patrimoine", "Formation"],
    funder: "Eiffage",
    eligibleEntities: ["association"],
    maxAmountEur: 100000,
  },

  // ─── TECH / TÉLÉCOMS / MÉDIAS ───────────────────────────────────
  {
    url: "https://www.orange.com/fr/engagement/responsable-et-solidaire",
    title: "Orange — Mécénat (hors Fondation)",
    summary:
      "Mécénat Orange (au-delà de la Fondation) : inclusion numérique, autisme, solidarité internationale, éducation, culture.",
    themes: ["Numérique", "Inclusion", "Solidarité"],
    funder: "Orange",
    eligibleEntities: ["association", "ong"],
    maxAmountEur: 100000,
  },
  {
    url: "https://www.tf1corporate.fr/groupe-tf1/notre-engagement-societal",
    title: "TF1 — Mécénat & engagement (hors Fondation TF1)",
    summary:
      "Programme de mécénat TF1 : insertion des jeunes des QPV vers l'audiovisuel, soutien aux associations dans les médias (visibilité).",
    themes: ["Médias", "Insertion", "Jeunesse"],
    funder: "TF1",
    eligibleEntities: ["association"],
    maxAmountEur: 50000,
  },
  {
    url: "https://www.iliad.fr/notre-engagement/",
    title: "Iliad / Free — Mécénat & engagement",
    summary:
      "Mécénat Iliad/Free (au-delà des Fondations Free et Xavier Niel) : numérique pour tous, éducation tech, écoles informatiques (42).",
    themes: ["Numérique", "Éducation"],
    funder: "Iliad / Free",
    eligibleEntities: ["association", "ecole"],
    maxAmountEur: 100000,
  },
  {
    url: "https://www.bel-group.com/fr/engagements/",
    title: "Bel — Mécénat & engagement",
    summary:
      "Mécénat Bel (au-delà de la Fondation Bel) : nutrition de l'enfance, agriculture régénératrice, accès à l'alimentation.",
    themes: ["Nutrition", "Enfance", "Alimentation"],
    funder: "Bel",
    eligibleEntities: ["association", "ong"],
    maxAmountEur: 100000,
  },
  {
    url: "https://www.decathlon.fr/landing/decathlon-foundation",
    title: "Decathlon — Mécénat (hors Fondation Decathlon)",
    summary:
      "Mécénat Decathlon : sport pour tous, sport en QPV, sport et handicap, sport et insertion. Au-delà de la Fondation Decathlon.",
    themes: ["Sport", "Insertion", "Handicap"],
    funder: "Decathlon",
    eligibleEntities: ["association"],
    maxAmountEur: 50000,
  },
  {
    url: "https://www.pmu.fr/responsabilite-societale",
    title: "PMU — Mécénat",
    summary:
      "Mécénat PMU : sport (filière équine), insertion par le sport, lutte contre le jeu problématique, soutien aux associations sportives.",
    themes: ["Sport", "Insertion", "Solidarité"],
    funder: "PMU",
    eligibleEntities: ["association"],
    maxAmountEur: 50000,
  },
  {
    url: "https://www.fdj.fr/responsabilite-societale/notre-engagement-societal",
    title: "FDJ — Mécénat (hors Fondation FDJ)",
    summary:
      "Mécénat FDJ : sport pour tous, jeu responsable, soutien aux territoires, patrimoine. Au-delà de la Fondation FDJ.",
    themes: ["Sport", "Solidarité", "Patrimoine"],
    funder: "FDJ",
    eligibleEntities: ["association"],
    maxAmountEur: 100000,
  },

  // ─── PHARMA / SANTÉ ─────────────────────────────────────────────
  {
    url: "https://www.sanofi.fr/fr/notre-responsabilite/notre-engagement-societal",
    title: "Sanofi — Mécénat & engagement (hors Fondation S)",
    summary:
      "Mécénat Sanofi (au-delà de la Fondation Sanofi Espoir) : maladies négligées, santé maternelle et infantile en pays du Sud, accès aux médicaments essentiels.",
    themes: ["Santé", "International", "Recherche"],
    funder: "Sanofi",
    eligibleEntities: ["ong", "association", "recherche"],
    maxAmountEur: 500000,
  },
  {
    url: "https://www.servier.com/notre-engagement/responsabilite-societale/",
    title: "Servier — Mécénat & engagement",
    summary:
      "Mécénat Servier : recherche médicale, accès aux soins, prévention. Au-delà du Mécénat Servier classique.",
    themes: ["Santé", "Recherche", "Prévention"],
    funder: "Servier",
    eligibleEntities: ["recherche", "association"],
    maxAmountEur: 200000,
  },
  {
    url: "https://www.pierre-fabre.com/fr-fr/engagement-societal",
    title: "Pierre Fabre — Mécénat (hors Fondation)",
    summary:
      "Mécénat Pierre Fabre : accès aux médicaments, dermatologie pour publics vulnérables, recherche, biodiversité (Conservatoire de Soulié).",
    themes: ["Santé", "Recherche", "Biodiversité"],
    funder: "Pierre Fabre",
    eligibleEntities: ["association", "ong"],
    maxAmountEur: 200000,
  },
];

export async function fetchMecenatPrograms(): Promise<MecenatProgram[]> {
  console.log(`[Mécénat d'entreprise] ${MECENAT_PROGRAMS.length} programmes curés`);
  return MECENAT_PROGRAMS;
}

export function transformMecenatToGrant(p: MecenatProgram) {
  return {
    sourceUrl: p.url,
    sourceName: "Mécénat d'entreprise",
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
    grantType: "mecenat",
    language: "fr",
    status: "active",
    aiSummary: null,
  };
}
