/**
 * DG ECHO — Aide humanitaire & Protection civile européenne
 *
 * Direction générale de la Commission européenne dédiée à l'aide humanitaire
 * (~2 Md€/an) et à la protection civile (rescEU, UCPM). Source de
 * financement majeure pour les ONG humanitaires françaises (MdM, ACF,
 * Solidarités International, Première Urgence, HI…).
 *
 * Les ONG candidatent en tant que partenaires DG ECHO via FPA (Framework
 * Partnership Agreement). Les AAP & HIPs (Humanitarian Implementation
 * Plans) sont thématiques et géographiques.
 */

export interface DGEchoProgram {
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

const DG_ECHO_PROGRAMS: DGEchoProgram[] = [
  // ─── PORTAILS ────────────────────────────────────────────────────
  {
    url: "https://civil-protection-humanitarian-aid.ec.europa.eu/",
    title: "DG ECHO — Portail européen Aide humanitaire & Protection civile",
    summary:
      "Direction générale de la Commission européenne pour l'aide humanitaire et la protection civile. Plus grand bailleur humanitaire au monde (~2 Md€/an) avec 168+ ONG partenaires sous Framework Partnership Agreement (FPA).",
    themes: ["Solidarité internationale", "Humanitaire", "Protection civile"],
    funder: "DG ECHO / Commission Européenne",
    eligibleEntities: ["ong", "association"],
    eligibleCountries: ["EU"],
    maxAmountEur: 50000000,
  },
  {
    url: "https://webgate.ec.europa.eu/echo/applications-funding",
    title: "DG ECHO — Applications & Funding (portail FPA)",
    summary:
      "Portail de candidature pour les ONG partenaires de DG ECHO. Gestion des Single Form, négociation des budgets, reporting des actions humanitaires financées.",
    themes: ["Solidarité internationale", "Humanitaire"],
    funder: "DG ECHO",
    eligibleEntities: ["ong"],
    eligibleCountries: ["EU"],
    maxAmountEur: 50000000,
  },
  {
    url: "https://civil-protection-humanitarian-aid.ec.europa.eu/funding-evaluations/financing-decisions-hips_en",
    title: "DG ECHO — Humanitarian Implementation Plans (HIPs)",
    summary:
      "Plans d'implémentation humanitaire annuels par zone géographique et thématique. Définissent les priorités opérationnelles, les enveloppes budgétaires et les modalités d'intervention.",
    themes: ["Solidarité internationale", "Humanitaire"],
    funder: "DG ECHO",
    eligibleEntities: ["ong"],
    eligibleCountries: ["EU"],
    maxAmountEur: 30000000,
  },

  // ─── MODALITÉS DE FINANCEMENT ────────────────────────────────────
  {
    url: "https://civil-protection-humanitarian-aid.ec.europa.eu/partnerships/humanitarian-partners_en",
    title: "DG ECHO — Framework Partnership Agreement (FPA)",
    summary:
      "Convention-cadre de partenariat entre DG ECHO et une ONG humanitaire. Préalable obligatoire pour candidater aux financements DG ECHO. Renégocié tous les 7 ans.",
    themes: ["Solidarité internationale", "Humanitaire"],
    funder: "DG ECHO",
    eligibleEntities: ["ong"],
    eligibleCountries: ["EU"],
    maxAmountEur: 0,
  },
  {
    url: "https://civil-protection-humanitarian-aid.ec.europa.eu/what/humanitarian-aid/needs-based-humanitarian-aid_en",
    title: "DG ECHO — Aide humanitaire fondée sur les besoins",
    summary:
      "Principal levier d'intervention DG ECHO : financement de projets humanitaires sur la base des évaluations de besoins (assistance alimentaire, abris, santé, eau-hygiène-assainissement, protection, éducation en urgence).",
    themes: ["Solidarité internationale", "Humanitaire"],
    funder: "DG ECHO",
    eligibleEntities: ["ong"],
    eligibleCountries: ["EU"],
    minAmountEur: 500000,
    maxAmountEur: 30000000,
  },

  // ─── HIPs PAR ZONE GÉOGRAPHIQUE ─────────────────────────────────
  {
    url: "https://civil-protection-humanitarian-aid.ec.europa.eu/where/africa_en",
    title: "DG ECHO — HIP Afrique (Sahel, Lac Tchad, Corne, Afrique centrale)",
    summary:
      "Aide humanitaire DG ECHO en Afrique : Sahel (Mali, Burkina, Niger, Tchad), Lac Tchad, Corne de l'Afrique (Éthiopie, Soudan, Soudan du Sud, Somalie), Afrique centrale (RDC, RCA), Afrique australe.",
    themes: ["Solidarité internationale", "Humanitaire", "Afrique"],
    funder: "DG ECHO",
    eligibleEntities: ["ong"],
    eligibleCountries: ["EU"],
    minAmountEur: 500000,
    maxAmountEur: 20000000,
  },
  {
    url: "https://civil-protection-humanitarian-aid.ec.europa.eu/where/middle-east-and-north-africa_en",
    title: "DG ECHO — HIP Moyen-Orient & Afrique du Nord",
    summary:
      "Aide humanitaire DG ECHO au Moyen-Orient (Syrie, Irak, Yémen, Palestine, Liban, Jordanie, Iran), Afrique du Nord (Libye), Turquie. Crises liées au conflit, déplacements, protection.",
    themes: ["Solidarité internationale", "Humanitaire", "Moyen-Orient"],
    funder: "DG ECHO",
    eligibleEntities: ["ong"],
    eligibleCountries: ["EU"],
    minAmountEur: 500000,
    maxAmountEur: 30000000,
  },
  {
    url: "https://civil-protection-humanitarian-aid.ec.europa.eu/where/ukraine_en",
    title: "DG ECHO — HIP Ukraine & pays voisins",
    summary:
      "Réponse humanitaire à la guerre en Ukraine : assistance d'urgence en Ukraine, aux populations déplacées internes et aux réfugiés (Moldavie notamment).",
    themes: ["Solidarité internationale", "Humanitaire", "Ukraine"],
    funder: "DG ECHO",
    eligibleEntities: ["ong"],
    eligibleCountries: ["EU"],
    minAmountEur: 500000,
    maxAmountEur: 30000000,
  },
  {
    url: "https://civil-protection-humanitarian-aid.ec.europa.eu/where/asia-and-pacific_en",
    title: "DG ECHO — HIP Asie & Pacifique",
    summary:
      "Aide humanitaire DG ECHO en Asie : Afghanistan/Pakistan, Myanmar/Bangladesh (Rohingyas), DPRK, Pacifique (catastrophes naturelles).",
    themes: ["Solidarité internationale", "Humanitaire", "Asie"],
    funder: "DG ECHO",
    eligibleEntities: ["ong"],
    eligibleCountries: ["EU"],
    minAmountEur: 500000,
    maxAmountEur: 15000000,
  },
  {
    url: "https://civil-protection-humanitarian-aid.ec.europa.eu/where/latin-america-and-caribbean_en",
    title: "DG ECHO — HIP Amérique latine & Caraïbes",
    summary:
      "Aide humanitaire DG ECHO en Amérique latine/Caraïbes : Venezuela, Colombie, Haïti, Amérique centrale (migrations, catastrophes naturelles, El Niño).",
    themes: ["Solidarité internationale", "Humanitaire", "Amérique latine"],
    funder: "DG ECHO",
    eligibleEntities: ["ong"],
    eligibleCountries: ["EU"],
    minAmountEur: 500000,
    maxAmountEur: 10000000,
  },

  // ─── HIPs THÉMATIQUES / TRANSVERSAUX ─────────────────────────────
  {
    url: "https://civil-protection-humanitarian-aid.ec.europa.eu/what/humanitarian-aid/education-emergencies_en",
    title: "DG ECHO — Éducation en urgence (EiE)",
    summary:
      "Financement DG ECHO dédié à l'éducation des enfants pris dans des crises humanitaires. ~10 % du budget humanitaire annuel de DG ECHO.",
    themes: ["Éducation", "Humanitaire", "Enfance"],
    funder: "DG ECHO",
    eligibleEntities: ["ong"],
    eligibleCountries: ["EU"],
    minAmountEur: 200000,
    maxAmountEur: 5000000,
  },
  {
    url: "https://civil-protection-humanitarian-aid.ec.europa.eu/what/humanitarian-aid/disaster-preparedness_en",
    title: "DG ECHO — Préparation aux catastrophes (DRR / DIPECHO)",
    summary:
      "Programme DIPECHO : préparation aux catastrophes et réduction des risques (DRR) dans les pays exposés. Renforcement des capacités locales et nationales.",
    themes: ["Humanitaire", "Climat", "Résilience"],
    funder: "DG ECHO",
    eligibleEntities: ["ong"],
    eligibleCountries: ["EU"],
    minAmountEur: 200000,
    maxAmountEur: 5000000,
  },
  {
    url: "https://civil-protection-humanitarian-aid.ec.europa.eu/what/humanitarian-aid/cash-transfers_en",
    title: "DG ECHO — Transferts monétaires humanitaires",
    summary:
      "DG ECHO est leader mondial des transferts monétaires en aide humanitaire (CVA). Soutien aux ONG mettant en œuvre cash multipurpose, cash conditionnel.",
    themes: ["Humanitaire", "Innovation"],
    funder: "DG ECHO",
    eligibleEntities: ["ong"],
    eligibleCountries: ["EU"],
    minAmountEur: 1000000,
    maxAmountEur: 30000000,
  },
  {
    url: "https://civil-protection-humanitarian-aid.ec.europa.eu/what/humanitarian-aid/health_en",
    title: "DG ECHO — Santé humanitaire",
    summary:
      "Financement de l'accès aux soins primaires et secondaires dans les contextes humanitaires : santé maternelle/infantile, santé mentale, lutte contre les épidémies, blessés de guerre.",
    themes: ["Santé", "Humanitaire"],
    funder: "DG ECHO",
    eligibleEntities: ["ong"],
    eligibleCountries: ["EU"],
    minAmountEur: 500000,
    maxAmountEur: 15000000,
  },

  // ─── PROTECTION CIVILE / UCPM / RESCEU ───────────────────────────
  {
    url: "https://civil-protection-humanitarian-aid.ec.europa.eu/what/civil-protection/eu-civil-protection-mechanism_en",
    title: "DG ECHO — Mécanisme de Protection Civile de l'UE (UCPM)",
    summary:
      "Mécanisme européen de protection civile : 36 États participants. Réponse coordonnée aux catastrophes naturelles et industrielles, en Europe et hors UE. AAP prévention & préparation (Track 1).",
    themes: ["Protection civile", "Climat", "Résilience"],
    funder: "DG ECHO",
    eligibleEntities: ["collectivite", "ong", "association", "recherche"],
    eligibleCountries: ["EU"],
    minAmountEur: 200000,
    maxAmountEur: 1500000,
  },
  {
    url: "https://civil-protection-humanitarian-aid.ec.europa.eu/funding-evaluations/financing-civil-protection_en",
    title: "DG ECHO — Appels à projets Protection civile (UCPM Track 1 & 2)",
    summary:
      "AAP UCPM : prévention (risques climatiques, feux de forêt, inondations, séismes), préparation (formation, exercices, équipes), connaissance et innovation.",
    themes: ["Protection civile", "Climat"],
    funder: "DG ECHO",
    eligibleEntities: ["collectivite", "ong", "association", "recherche"],
    eligibleCountries: ["EU"],
    maxAmountEur: 1500000,
  },
  {
    url: "https://civil-protection-humanitarian-aid.ec.europa.eu/what/civil-protection/resceu_en",
    title: "DG ECHO — rescEU (réserve européenne)",
    summary:
      "Réserve européenne d'équipements de protection civile (Canadairs, hélicoptères, équipements médicaux, abris). Financement à 100 % par la Commission.",
    themes: ["Protection civile", "Climat"],
    funder: "DG ECHO",
    eligibleEntities: ["etat", "collectivite"],
    eligibleCountries: ["EU"],
    maxAmountEur: 50000000,
  },
];

export async function fetchDGEchoPrograms(): Promise<DGEchoProgram[]> {
  console.log(`[DG ECHO] ${DG_ECHO_PROGRAMS.length} programmes curés`);
  return DG_ECHO_PROGRAMS;
}

export function transformDGEchoToGrant(p: DGEchoProgram) {
  return {
    sourceUrl: p.url,
    sourceName: "DG ECHO — EU Humanitarian Aid",
    title: p.title,
    summary: p.summary,
    rawContent: p.summary,
    funder: p.funder,
    country: "EU",
    thematicAreas: p.themes,
    eligibleEntities: p.eligibleEntities ?? ["ong", "association"],
    eligibleCountries: p.eligibleCountries ?? ["EU"],
    minAmountEur: p.minAmountEur ?? 200000,
    maxAmountEur: p.maxAmountEur ?? 5000000,
    coFinancingRequired: true,
    deadline: null,
    grantType: "subvention",
    language: "en",
    status: "active",
    aiSummary: null,
  };
}
