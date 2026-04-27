/**
 * ARS — Agences Régionales de Santé
 *
 * Établissements publics autonomes qui pilotent la politique de santé en
 * région (18 ARS : 13 métropole + 5 outre-mer). Très importantes pour les
 * associations sanitaires et médico-sociales : prévention, addictions,
 * santé mentale, vieillissement, handicap, accompagnement à domicile.
 *
 * Les AAP ARS sont thématiques et publiés sur le portail régional de
 * chaque agence. On référence ici les portails AAP + les grands axes
 * récurrents.
 */

export interface ARSProgram {
  url: string;
  title: string;
  summary: string;
  themes: string[];
  funder: string;
  region?: string;
  eligibleEntities?: string[];
  minAmountEur?: number | null;
  maxAmountEur?: number | null;
}

const ARS_PROGRAMS: ARSProgram[] = [
  // ─── PORTAIL NATIONAL ───────────────────────────────────────────
  {
    url: "https://sante.gouv.fr/professionnels/gerer-un-etablissement-de-sante-medico-social/financement/",
    title: "ARS — Cadre national des AAP régionaux",
    summary:
      "Cadre commun des appels à projets ARS : Fonds d'Intervention Régional (FIR), MIG, AAP médico-sociaux conjoints CD/ARS, conventions pluriannuelles d'objectifs et de moyens (CPOM).",
    themes: ["Santé", "Médico-social"],
    funder: "Ministère de la Santé / ARS",
    eligibleEntities: ["association", "etablissement-sante"],
    maxAmountEur: 500000,
  },

  // ─── 18 ARS ──────────────────────────────────────────────────────
  {
    url: "https://www.auvergne-rhone-alpes.ars.sante.fr/appels-projets-et-appels-candidatures",
    title: "ARS Auvergne-Rhône-Alpes — Appels à projets",
    summary:
      "AAP de l'ARS AURA : prévention, santé publique, médico-social, autonomie, santé mentale, addictions, soins de premier recours, soins palliatifs.",
    themes: ["Santé", "Médico-social", "Prévention"],
    funder: "ARS Auvergne-Rhône-Alpes",
    region: "Auvergne-Rhône-Alpes",
    eligibleEntities: ["association", "etablissement-sante"],
    maxAmountEur: 500000,
  },
  {
    url: "https://www.bourgogne-franche-comte.ars.sante.fr/appels-projets",
    title: "ARS Bourgogne-Franche-Comté — Appels à projets",
    summary:
      "AAP de l'ARS BFC : prévention, accès aux soins, autonomie, santé mentale, accompagnement des publics fragiles.",
    themes: ["Santé", "Médico-social"],
    funder: "ARS Bourgogne-Franche-Comté",
    region: "Bourgogne-Franche-Comté",
    eligibleEntities: ["association", "etablissement-sante"],
    maxAmountEur: 300000,
  },
  {
    url: "https://www.bretagne.ars.sante.fr/appels-projets",
    title: "ARS Bretagne — Appels à projets",
    summary:
      "AAP de l'ARS Bretagne : prévention, addictions, santé mentale, autonomie, accompagnement à domicile, télésanté.",
    themes: ["Santé", "Médico-social"],
    funder: "ARS Bretagne",
    region: "Bretagne",
    eligibleEntities: ["association", "etablissement-sante"],
    maxAmountEur: 400000,
  },
  {
    url: "https://www.centre-val-de-loire.ars.sante.fr/appels-projets",
    title: "ARS Centre-Val de Loire — Appels à projets",
    summary:
      "AAP de l'ARS CVL : prévention, accès aux soins, médico-social, lutte contre la désertification médicale.",
    themes: ["Santé", "Médico-social"],
    funder: "ARS Centre-Val de Loire",
    region: "Centre-Val de Loire",
    eligibleEntities: ["association", "etablissement-sante"],
    maxAmountEur: 300000,
  },
  {
    url: "https://www.corse.ars.sante.fr/appels-projets",
    title: "ARS Corse — Appels à projets",
    summary:
      "AAP de l'ARS Corse : prévention, santé publique, autonomie, accompagnement médico-social.",
    themes: ["Santé", "Médico-social"],
    funder: "ARS Corse",
    region: "Corse",
    eligibleEntities: ["association", "etablissement-sante"],
    maxAmountEur: 200000,
  },
  {
    url: "https://www.grand-est.ars.sante.fr/appels-projets",
    title: "ARS Grand Est — Appels à projets",
    summary:
      "AAP de l'ARS Grand Est : prévention, santé environnementale, autonomie, santé mentale, addictions.",
    themes: ["Santé", "Médico-social", "Santé environnementale"],
    funder: "ARS Grand Est",
    region: "Grand Est",
    eligibleEntities: ["association", "etablissement-sante"],
    maxAmountEur: 400000,
  },
  {
    url: "https://www.hauts-de-france.ars.sante.fr/appels-projets",
    title: "ARS Hauts-de-France — Appels à projets",
    summary:
      "AAP de l'ARS Hauts-de-France : prévention (santé environnementale, nutrition), accès aux soins, médico-social, santé mentale.",
    themes: ["Santé", "Médico-social"],
    funder: "ARS Hauts-de-France",
    region: "Hauts-de-France",
    eligibleEntities: ["association", "etablissement-sante"],
    maxAmountEur: 400000,
  },
  {
    url: "https://www.iledefrance.ars.sante.fr/appels-projets",
    title: "ARS Île-de-France — Appels à projets",
    summary:
      "AAP de l'ARS IDF (la plus importante en volume) : prévention, addictions, santé mentale, autonomie, accès aux soins en QPV, e-santé.",
    themes: ["Santé", "Médico-social", "QPV"],
    funder: "ARS Île-de-France",
    region: "Île-de-France",
    eligibleEntities: ["association", "etablissement-sante"],
    maxAmountEur: 1000000,
  },
  {
    url: "https://www.normandie.ars.sante.fr/appels-projets",
    title: "ARS Normandie — Appels à projets",
    summary:
      "AAP de l'ARS Normandie : prévention, autonomie, santé mentale, accompagnement des publics fragiles.",
    themes: ["Santé", "Médico-social"],
    funder: "ARS Normandie",
    region: "Normandie",
    eligibleEntities: ["association", "etablissement-sante"],
    maxAmountEur: 300000,
  },
  {
    url: "https://www.nouvelle-aquitaine.ars.sante.fr/appels-projets",
    title: "ARS Nouvelle-Aquitaine — Appels à projets",
    summary:
      "AAP de l'ARS Nouvelle-Aquitaine : prévention, santé environnementale, autonomie, santé mentale, accompagnement des aidants.",
    themes: ["Santé", "Médico-social"],
    funder: "ARS Nouvelle-Aquitaine",
    region: "Nouvelle-Aquitaine",
    eligibleEntities: ["association", "etablissement-sante"],
    maxAmountEur: 500000,
  },
  {
    url: "https://www.occitanie.ars.sante.fr/appels-projets",
    title: "ARS Occitanie — Appels à projets",
    summary:
      "AAP de l'ARS Occitanie : prévention, autonomie, santé mentale, addictions, accompagnement en milieu rural.",
    themes: ["Santé", "Médico-social"],
    funder: "ARS Occitanie",
    region: "Occitanie",
    eligibleEntities: ["association", "etablissement-sante"],
    maxAmountEur: 400000,
  },
  {
    url: "https://www.pays-de-la-loire.ars.sante.fr/appels-projets",
    title: "ARS Pays de la Loire — Appels à projets",
    summary:
      "AAP de l'ARS Pays de la Loire : prévention, santé publique, médico-social, accompagnement à domicile.",
    themes: ["Santé", "Médico-social"],
    funder: "ARS Pays de la Loire",
    region: "Pays de la Loire",
    eligibleEntities: ["association", "etablissement-sante"],
    maxAmountEur: 300000,
  },
  {
    url: "https://www.paca.ars.sante.fr/appels-projets",
    title: "ARS PACA — Appels à projets",
    summary:
      "AAP de l'ARS PACA : prévention, santé environnementale, autonomie, santé mentale, addictions, accompagnement social.",
    themes: ["Santé", "Médico-social"],
    funder: "ARS Provence-Alpes-Côte d'Azur",
    region: "PACA",
    eligibleEntities: ["association", "etablissement-sante"],
    maxAmountEur: 500000,
  },
  {
    url: "https://www.guadeloupe.ars.sante.fr/appels-projets",
    title: "ARS Guadeloupe — Appels à projets",
    summary:
      "AAP de l'ARS Guadeloupe : prévention, santé environnementale (chlordécone, sargasses), autonomie, médico-social, addictions.",
    themes: ["Santé", "Médico-social", "Outre-mer"],
    funder: "ARS Guadeloupe",
    region: "Guadeloupe",
    eligibleEntities: ["association", "etablissement-sante"],
    maxAmountEur: 200000,
  },
  {
    url: "https://www.martinique.ars.sante.fr/appels-projets",
    title: "ARS Martinique — Appels à projets",
    summary:
      "AAP de l'ARS Martinique : prévention, santé environnementale, médico-social, vieillissement de la population, addictions.",
    themes: ["Santé", "Médico-social", "Outre-mer"],
    funder: "ARS Martinique",
    region: "Martinique",
    eligibleEntities: ["association", "etablissement-sante"],
    maxAmountEur: 200000,
  },
  {
    url: "https://www.guyane.ars.sante.fr/appels-projets",
    title: "ARS Guyane — Appels à projets",
    summary:
      "AAP de l'ARS Guyane : prévention (paludisme, VIH, dengue), accès aux soins en zones isolées, santé maternelle et infantile.",
    themes: ["Santé", "Médico-social", "Outre-mer"],
    funder: "ARS Guyane",
    region: "Guyane",
    eligibleEntities: ["association", "etablissement-sante"],
    maxAmountEur: 200000,
  },
  {
    url: "https://www.lareunion.ars.sante.fr/appels-projets",
    title: "ARS La Réunion — Appels à projets",
    summary:
      "AAP de l'ARS La Réunion : prévention (diabète, VIH, dengue, chikungunya), autonomie, médico-social.",
    themes: ["Santé", "Médico-social", "Outre-mer"],
    funder: "ARS La Réunion",
    region: "La Réunion",
    eligibleEntities: ["association", "etablissement-sante"],
    maxAmountEur: 200000,
  },
  {
    url: "https://www.mayotte.ars.sante.fr/appels-projets",
    title: "ARS Mayotte — Appels à projets",
    summary:
      "AAP de l'ARS Mayotte : prévention, santé maternelle et infantile, accès aux soins, médico-social.",
    themes: ["Santé", "Médico-social", "Outre-mer"],
    funder: "ARS Mayotte",
    region: "Mayotte",
    eligibleEntities: ["association", "etablissement-sante"],
    maxAmountEur: 150000,
  },

  // ─── DISPOSITIFS ARS RÉCURRENTS ─────────────────────────────────
  {
    url: "https://sante.gouv.fr/professionnels/gerer-un-etablissement-de-sante-medico-social/financement/financement-fir",
    title: "ARS — Fonds d'Intervention Régional (FIR)",
    summary:
      "Principal levier financier des ARS (3,9 Md€/an) : prévention, soins de premier recours, démocratie sanitaire, médico-social, télésanté. Conventions pluriannuelles avec les associations.",
    themes: ["Santé", "Médico-social", "Prévention"],
    funder: "ARS — Fonds d'Intervention Régional",
    eligibleEntities: ["association", "etablissement-sante"],
    minAmountEur: 5000,
    maxAmountEur: 1000000,
  },
  {
    url: "https://www.santepubliquefrance.fr/dossiers/conferences-de-financeurs",
    title: "ARS — Conférences des financeurs (prévention de la perte d'autonomie)",
    summary:
      "Coopération ARS / Départements / CNSA pour la prévention de la perte d'autonomie des plus de 60 ans : forfaits autonomie, actions collectives de prévention.",
    themes: ["Santé", "Autonomie", "Vieillissement"],
    funder: "ARS / Départements / CNSA",
    eligibleEntities: ["association", "collectivite"],
    maxAmountEur: 200000,
  },
  {
    url: "https://sante.gouv.fr/grands-dossiers/sante-mentale-et-psychiatrie/feuille-de-route-sante-mentale-et-psychiatrie/",
    title: "ARS — Santé mentale et psychiatrie (feuille de route)",
    summary:
      "AAP ARS pour la mise en œuvre de la feuille de route santé mentale : projets territoriaux de santé mentale (PTSM), CLSM, prévention du suicide, accompagnement des troubles psychiques.",
    themes: ["Santé", "Santé mentale"],
    funder: "ARS",
    eligibleEntities: ["association", "etablissement-sante"],
    maxAmountEur: 300000,
  },
  {
    url: "https://sante.gouv.fr/prevention-en-sante/addictions/",
    title: "ARS — Prévention des addictions (MILDECA / Fonds Addictions)",
    summary:
      "AAP ARS dans le cadre de la stratégie nationale de prévention des conduites addictives (alcool, tabac, drogues, jeux). Financements MILDECA et fonds addictions.",
    themes: ["Santé", "Addictions", "Prévention"],
    funder: "ARS / MILDECA",
    eligibleEntities: ["association", "etablissement-sante"],
    maxAmountEur: 200000,
  },
  {
    url: "https://www.cnsa.fr/financements",
    title: "ARS / CNSA — Caisse Nationale de Solidarité pour l'Autonomie",
    summary:
      "Établissement public qui finance l'autonomie via les ARS : médico-social (handicap, dépendance), accompagnement des aidants, structures innovantes, habitat inclusif.",
    themes: ["Santé", "Autonomie", "Handicap"],
    funder: "CNSA / ARS",
    eligibleEntities: ["association", "etablissement-sante", "collectivite"],
    maxAmountEur: 500000,
  },
];

export async function fetchARSPrograms(): Promise<ARSProgram[]> {
  console.log(`[ARS] ${ARS_PROGRAMS.length} programmes curés`);
  return ARS_PROGRAMS;
}

export function transformARSToGrant(p: ARSProgram) {
  return {
    sourceUrl: p.url,
    sourceName: "ARS — Agences Régionales de Santé",
    title: p.title,
    summary: p.summary,
    rawContent: p.summary,
    funder: p.funder,
    country: "FR",
    thematicAreas: p.themes,
    eligibleEntities: p.eligibleEntities ?? ["association", "etablissement-sante"],
    eligibleCountries: ["FR"],
    minAmountEur: p.minAmountEur ?? 5000,
    maxAmountEur: p.maxAmountEur ?? 200000,
    coFinancingRequired: true,
    deadline: null,
    grantType: "subvention",
    language: "fr",
    status: "active",
    aiSummary: null,
  };
}
