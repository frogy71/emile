/**
 * Fonds européens structurels & d'investissement (FESI) — programmation 2021-2027
 *
 * En France, les FESI représentent un volume colossal de subventions
 * (~22 Md€ sur 2021-2027). Quatre fonds principaux :
 *
 *  • FEDER (Fonds européen de développement régional) — innovation,
 *    transition écologique, numérique, cohésion territoriale.
 *  • FSE+ (Fonds Social Européen Plus) — emploi, inclusion sociale,
 *    formation, lutte contre la pauvreté.
 *  • FEADER (Fonds européen agricole pour le développement rural) —
 *    agriculture, ruralité, LEADER.
 *  • FEAMPA (Fonds européen pour les affaires maritimes, la pêche et
 *    l'aquaculture) — pêche durable, économie bleue, aquaculture.
 *
 * La France a confié l'autorité de gestion du FEDER, d'une partie du
 * FSE+ et du FEADER (volet hors-surfacique) aux Conseils régionaux
 * depuis 2014. Le FSE+ "emploi/inclusion" reste piloté par la DGEFP au
 * niveau national, le FEAMPA par la DGAMPA. Conséquence : pour ne rien
 * rater, il faut référencer (a) le portail national europe-en-france,
 * (b) la plateforme nationale Ma Démarche FSE, et (c) chaque autorité
 * de gestion régionale (13 métropole + 5 DROM).
 */

export interface EUStructuralFundProgram {
  url: string;
  title: string;
  summary: string;
  themes: string[];
  funder: string;
  /** FEDER | FSE+ | FEADER | FEAMPA | Multi (portails) */
  fund: "FEDER" | "FSE+" | "FEADER" | "FEAMPA" | "Multi";
  /** Région cible — null pour les programmes nationaux. */
  region?: string | null;
  eligibleEntities?: string[];
  eligibleCountries?: string[];
  minAmountEur?: number | null;
  maxAmountEur?: number | null;
}

const EU_STRUCTURAL_PROGRAMS: EUStructuralFundProgram[] = [
  // ─── PORTAILS NATIONAUX ──────────────────────────────────────────
  {
    url: "https://www.europe-en-france.gouv.fr/",
    title: "L'Europe s'engage en France — Portail national FESI",
    summary:
      "Portail interministériel français consacré aux Fonds Européens Structurels et d'Investissement (FESI). Recense les programmes FEDER, FSE+, FEADER, FEAMPA et les autorités de gestion (Régions + DGEFP + DGPE + DGAMPA). Point d'entrée unique pour les bénéficiaires.",
    themes: ["Europe", "Territoires", "Cohésion"],
    funder: "ANCT / SGAR — Europe en France",
    fund: "Multi",
    region: null,
    eligibleEntities: ["association", "entreprise", "collectivite", "ong"],
    eligibleCountries: ["FR"],
    maxAmountEur: 5000000,
  },
  {
    url: "https://www.europe-en-france.gouv.fr/fr/programmes-europeens-2021-2027",
    title: "Programmes FESI 2021-2027 — Catalogue national",
    summary:
      "Catalogue des 39 programmes opérationnels FESI 2021-2027 en France : programmes régionaux FEDER-FSE+, programme national FSE+, programmes nationaux FEADER, FEAMPA. Recense les autorités de gestion et les enveloppes par fonds.",
    themes: ["Europe", "Cohésion", "Programmation"],
    funder: "ANCT / SGAR",
    fund: "Multi",
    region: null,
    eligibleEntities: ["association", "entreprise", "collectivite"],
    eligibleCountries: ["FR"],
    maxAmountEur: 5000000,
  },
  {
    url: "https://ma-demarche-fse.fr/",
    title: "Ma Démarche FSE — Plateforme nationale FSE+ / IEJ",
    summary:
      "Plateforme officielle de dépôt et de gestion des dossiers FSE+ en France. Tous les bénéficiaires (associations, OPCO, entreprises d'insertion, collectivités) y déposent leur demande de subvention pour les volets emploi, inclusion et lutte contre la pauvreté.",
    themes: ["Emploi", "Insertion", "Formation"],
    funder: "DGEFP — Délégation générale à l'emploi et à la formation professionnelle",
    fund: "FSE+",
    region: null,
    eligibleEntities: ["association", "entreprise", "collectivite"],
    eligibleCountries: ["FR"],
    minAmountEur: 23000,
    maxAmountEur: 2000000,
  },
  {
    url: "https://www.fse.gouv.fr/",
    title: "FSE+ France — Programme national emploi-inclusion",
    summary:
      "Programme national FSE+ (2021-2027) piloté par la DGEFP. ~6,7 Md€ sur la période. 4 axes : emploi durable, inclusion sociale et lutte contre la pauvreté, jeunesse (ex-IEJ), aide alimentaire (ex-FEAD).",
    themes: ["Emploi", "Insertion", "Pauvreté", "Jeunesse"],
    funder: "DGEFP / FSE+ France",
    fund: "FSE+",
    region: null,
    eligibleEntities: ["association", "entreprise", "collectivite"],
    eligibleCountries: ["FR"],
    minAmountEur: 23000,
    maxAmountEur: 2000000,
  },
  {
    url: "https://agriculture.gouv.fr/le-feader-fonds-europeen-agricole-pour-le-developpement-rural",
    title: "FEADER — Plan Stratégique National PAC 2023-2027",
    summary:
      "Fonds européen agricole pour le développement rural (FEADER), volet français du Plan Stratégique National PAC. ~9 Md€ sur 2023-2027. Mesures non-surfaciques (installation, modernisation, LEADER, mesures forestières) gérées par les Régions ; mesures surfaciques par le ministère.",
    themes: ["Agriculture", "Ruralité", "Forêt"],
    funder: "MASA / DGPE — Ministère de l'Agriculture",
    fund: "FEADER",
    region: null,
    eligibleEntities: ["association", "entreprise", "collectivite", "agriculteur"],
    eligibleCountries: ["FR"],
    maxAmountEur: 1000000,
  },
  {
    url: "https://www.reseaurural.fr/",
    title: "Réseau Rural National — Animation FEADER & LEADER",
    summary:
      "Réseau d'animation national du FEADER. Capitalise les bonnes pratiques, anime les Groupes d'Action Locale (GAL) LEADER et appuie les porteurs de projets ruraux.",
    themes: ["Ruralité", "Développement local", "LEADER"],
    funder: "MASA / Réseau Rural Français",
    fund: "FEADER",
    region: null,
    eligibleEntities: ["association", "collectivite", "entreprise"],
    eligibleCountries: ["FR"],
    maxAmountEur: 200000,
  },
  {
    url: "https://www.europe-en-france.gouv.fr/fr/fonds-europeens/leader",
    title: "LEADER — Liaison Entre Actions de Développement de l'Économie Rurale",
    summary:
      "Volet territorial du FEADER mis en œuvre par 339 Groupes d'Action Locale (GAL) en France. Soutient les projets locaux portés par associations, collectivités, entreprises ruraux. ~700 M€ sur 2023-2027. Stratégies locales définies par chaque GAL.",
    themes: ["Ruralité", "Développement local", "Innovation territoriale"],
    funder: "Régions (autorités de gestion FEADER) / GAL",
    fund: "FEADER",
    region: null,
    eligibleEntities: ["association", "collectivite", "entreprise"],
    eligibleCountries: ["FR"],
    minAmountEur: 5000,
    maxAmountEur: 200000,
  },
  {
    url: "https://agriculture.gouv.fr/feampa-fonds-europeen-pour-les-affaires-maritimes-la-peche-et-laquaculture",
    title: "FEAMPA — Programme national 2021-2027",
    summary:
      "Fonds européen pour les affaires maritimes, la pêche et l'aquaculture (567 M€ FR sur 2021-2027). Pêche durable, aquaculture, transformation, contrôle, gouvernance maritime. Géré par la DGAMPA avec l'appui des Régions littorales.",
    themes: ["Mer", "Pêche", "Aquaculture", "Économie bleue"],
    funder: "DGAMPA — Direction générale des affaires maritimes, pêche et aquaculture",
    fund: "FEAMPA",
    region: null,
    eligibleEntities: ["association", "entreprise", "collectivite", "recherche"],
    eligibleCountries: ["FR"],
    maxAmountEur: 1500000,
  },
  {
    url: "https://feampa.fr/",
    title: "FEAMPA — Portail bénéficiaires",
    summary:
      "Portail de dépôt FEAMPA pour les pêcheurs, aquaculteurs, transformateurs, ports, structures de gouvernance maritime et associations littorales. AAP réguliers sur la décarbonation, l'innovation, les aires marines protégées, le contrôle des pêches.",
    themes: ["Mer", "Pêche", "Aquaculture"],
    funder: "DGAMPA",
    fund: "FEAMPA",
    region: null,
    eligibleEntities: ["entreprise", "association", "collectivite"],
    eligibleCountries: ["FR"],
    maxAmountEur: 1500000,
  },
  {
    url: "https://www.europe-en-france.gouv.fr/fr/fonds-europeens/feampa",
    title: "FEAMPA — Aides aux Groupes d'Action Locale Pêche (GALPA / DLAL FEAMPA)",
    summary:
      "Volet territorialisé du FEAMPA porté par les Groupes d'Action Locale Pêche et Aquaculture (DLAL FEAMPA). Soutient les projets de territoire littoraux et fluviaux : diversification, valorisation des produits, lien terre-mer, environnement marin.",
    themes: ["Mer", "Pêche", "Développement local"],
    funder: "DGAMPA / Régions / GALPA",
    fund: "FEAMPA",
    region: null,
    eligibleEntities: ["association", "entreprise", "collectivite"],
    eligibleCountries: ["FR"],
    minAmountEur: 5000,
    maxAmountEur: 200000,
  },

  // ─── FEDER / FSE+ — RÉGIONS MÉTROPOLE ────────────────────────────
  {
    url: "https://www.iledefrance.fr/europe",
    title: "Île-de-France — Programme régional FEDER-FSE+ 2021-2027",
    summary:
      "Programme régional FEDER-FSE+ Île-de-France (~750 M€). Innovation, transition écologique, numérique, formation, inclusion sociale. Autorité de gestion : Région Île-de-France.",
    themes: ["Innovation", "Transition écologique", "Inclusion", "Numérique"],
    funder: "Région Île-de-France (AG FEDER-FSE+)",
    fund: "FEDER",
    region: "Île-de-France",
    eligibleEntities: ["association", "entreprise", "collectivite", "recherche"],
    eligibleCountries: ["FR"],
    minAmountEur: 23000,
    maxAmountEur: 1500000,
  },
  {
    url: "https://www.europe-en-auvergnerhonealpes.eu/",
    title: "Auvergne-Rhône-Alpes — Programmes FEDER, FSE+, FEADER",
    summary:
      "Portail des fonds européens en Auvergne-Rhône-Alpes (~2 Md€ sur 2021-2027). Programme FEDER-FSE+, programmes FEADER, AAP régionaux. Autorité de gestion : Région AURA.",
    themes: ["Innovation", "Transition", "Ruralité"],
    funder: "Région Auvergne-Rhône-Alpes",
    fund: "Multi",
    region: "Auvergne-Rhône-Alpes",
    eligibleEntities: ["association", "entreprise", "collectivite", "agriculteur"],
    eligibleCountries: ["FR"],
    minAmountEur: 23000,
    maxAmountEur: 1500000,
  },
  {
    url: "https://www.europe-en-nouvelle-aquitaine.eu/",
    title: "Nouvelle-Aquitaine — Fonds européens",
    summary:
      "Plateforme régionale Nouvelle-Aquitaine sur les fonds européens. Programme FEDER-FSE+ (~1,4 Md€), FEADER, Interreg SUDOE et POCTEFA. Politiques : Néo Terra, jeunesse, ESS, économie bleue.",
    themes: ["Innovation", "Transition", "Ruralité", "Mer"],
    funder: "Région Nouvelle-Aquitaine",
    fund: "Multi",
    region: "Nouvelle-Aquitaine",
    eligibleEntities: ["association", "entreprise", "collectivite", "agriculteur"],
    eligibleCountries: ["FR"],
    minAmountEur: 23000,
    maxAmountEur: 1500000,
  },
  {
    url: "https://www.europe-en-occitanie.eu/",
    title: "Occitanie — Fonds européens 2021-2027",
    summary:
      "Plateforme régionale Occitanie. Programme FEDER-FSE+ (~1,7 Md€), FEADER, mesures littorales FEAMPA. Pacte Vert, transition agricole, montagne, mer Méditerranée.",
    themes: ["Innovation", "Transition", "Ruralité", "Méditerranée"],
    funder: "Région Occitanie",
    fund: "Multi",
    region: "Occitanie",
    eligibleEntities: ["association", "entreprise", "collectivite", "agriculteur"],
    eligibleCountries: ["FR"],
    minAmountEur: 23000,
    maxAmountEur: 1500000,
  },
  {
    url: "https://www.europe-grandest.eu/",
    title: "Grand Est — Fonds européens 2021-2027",
    summary:
      "Portail des fonds européens en région Grand Est. Programme FEDER-FSE+ (~1,3 Md€), FEADER, Interreg Rhin Supérieur et France-Wallonie-Vlaanderen. Coopération transfrontalière intense.",
    themes: ["Innovation", "Transfrontalier", "Ruralité"],
    funder: "Région Grand Est",
    fund: "Multi",
    region: "Grand Est",
    eligibleEntities: ["association", "entreprise", "collectivite", "agriculteur"],
    eligibleCountries: ["FR"],
    minAmountEur: 23000,
    maxAmountEur: 1500000,
  },
  {
    url: "https://www.europe-hautsdefrance.eu/",
    title: "Hauts-de-France — Fonds européens",
    summary:
      "Plateforme régionale Hauts-de-France sur les fonds européens. Programme FEDER-FSE+ (~1,7 Md€, le plus important après IDF en métropole), FEADER, Interreg France-Wallonie-Vlaanderen et NWE. Rev3, transition industrielle.",
    themes: ["Innovation", "Industrie", "Transition", "Transfrontalier"],
    funder: "Région Hauts-de-France",
    fund: "Multi",
    region: "Hauts-de-France",
    eligibleEntities: ["association", "entreprise", "collectivite", "agriculteur"],
    eligibleCountries: ["FR"],
    minAmountEur: 23000,
    maxAmountEur: 2000000,
  },
  {
    url: "https://www.europe.maregionsud.fr/",
    title: "Provence-Alpes-Côte d'Azur — Europe en région",
    summary:
      "Portail des fonds européens en région Sud (PACA). Programme FEDER-FSE+ (~1 Md€), FEADER, FEAMPA littoral, Interreg ALCOTRA et Marittimo. Climat, tourisme durable, économie bleue.",
    themes: ["Innovation", "Mer", "Climat", "Méditerranée"],
    funder: "Région Provence-Alpes-Côte d'Azur",
    fund: "Multi",
    region: "Provence-Alpes-Côte d'Azur",
    eligibleEntities: ["association", "entreprise", "collectivite", "agriculteur"],
    eligibleCountries: ["FR"],
    minAmountEur: 23000,
    maxAmountEur: 1500000,
  },
  {
    url: "https://www.europe.bzh/",
    title: "Bretagne — Europe en Bretagne",
    summary:
      "Portail régional des fonds européens en Bretagne. Programme FEDER-FSE+ (~700 M€), FEADER, FEAMPA (Bretagne = 1ʳᵉ région halieutique française). Stratégie Breizh Cop.",
    themes: ["Innovation", "Mer", "Pêche", "Ruralité"],
    funder: "Région Bretagne",
    fund: "Multi",
    region: "Bretagne",
    eligibleEntities: ["association", "entreprise", "collectivite", "agriculteur"],
    eligibleCountries: ["FR"],
    minAmountEur: 23000,
    maxAmountEur: 1500000,
  },
  {
    url: "https://www.europe.paysdelaloire.fr/",
    title: "Pays de la Loire — Fonds européens",
    summary:
      "Plateforme des fonds européens en région Pays de la Loire. Programme FEDER-FSE+ (~600 M€), FEADER, FEAMPA. Spécialisation : économie maritime, agriculture, industrie navale.",
    themes: ["Innovation", "Mer", "Industrie", "Ruralité"],
    funder: "Région Pays de la Loire",
    fund: "Multi",
    region: "Pays de la Loire",
    eligibleEntities: ["association", "entreprise", "collectivite", "agriculteur"],
    eligibleCountries: ["FR"],
    minAmountEur: 23000,
    maxAmountEur: 1500000,
  },
  {
    url: "https://www.europe-en-normandie.eu/",
    title: "Normandie — Fonds européens 2021-2027",
    summary:
      "Portail régional Normandie sur les fonds européens. Programme FEDER-FSE+ (~700 M€), FEADER, FEAMPA. Spécialisation : énergies marines, hydrogène, équidés, industrie.",
    themes: ["Innovation", "Énergie", "Mer", "Industrie"],
    funder: "Région Normandie",
    fund: "Multi",
    region: "Normandie",
    eligibleEntities: ["association", "entreprise", "collectivite", "agriculteur"],
    eligibleCountries: ["FR"],
    minAmountEur: 23000,
    maxAmountEur: 1500000,
  },
  {
    url: "https://europe-bfc.eu/",
    title: "Bourgogne-Franche-Comté — Europe en BFC",
    summary:
      "Portail régional des fonds européens en Bourgogne-Franche-Comté. Programme FEDER-FSE+ (~600 M€), FEADER (région à forte ruralité), Interreg France-Suisse. Forêt-bois, agriculture, industrie.",
    themes: ["Innovation", "Ruralité", "Forêt", "Transfrontalier"],
    funder: "Région Bourgogne-Franche-Comté",
    fund: "Multi",
    region: "Bourgogne-Franche-Comté",
    eligibleEntities: ["association", "entreprise", "collectivite", "agriculteur"],
    eligibleCountries: ["FR"],
    minAmountEur: 23000,
    maxAmountEur: 1500000,
  },
  {
    url: "https://www.europeocentre-valdeloire.eu/",
    title: "Centre-Val de Loire — L'Europe s'engage",
    summary:
      "Portail des fonds européens en Centre-Val de Loire. Programme FEDER-FSE+ (~450 M€), FEADER. Spécialisation : agriculture, patrimoine UNESCO, santé.",
    themes: ["Innovation", "Ruralité", "Patrimoine"],
    funder: "Région Centre-Val de Loire",
    fund: "Multi",
    region: "Centre-Val de Loire",
    eligibleEntities: ["association", "entreprise", "collectivite", "agriculteur"],
    eligibleCountries: ["FR"],
    minAmountEur: 23000,
    maxAmountEur: 1500000,
  },
  {
    url: "https://www.isula.corsica/Programmes-europeens",
    title: "Corse — Programmes européens 2021-2027",
    summary:
      "Programmes européens en Corse pilotés par la Collectivité de Corse. FEDER-FSE+ (~370 M€), FEADER, FEAMPA, Interreg Marittimo. Insularité, montagne, agriculture méditerranéenne.",
    themes: ["Innovation", "Ruralité", "Insularité", "Méditerranée"],
    funder: "Collectivité de Corse",
    fund: "Multi",
    region: "Corse",
    eligibleEntities: ["association", "entreprise", "collectivite", "agriculteur"],
    eligibleCountries: ["FR"],
    minAmountEur: 23000,
    maxAmountEur: 1500000,
  },

  // ─── FEDER / FSE+ — RÉGIONS ULTRAPÉRIPHÉRIQUES (DROM) ────────────
  // Les RUP bénéficient d'enveloppes par habitant très supérieures
  // (statut OMR / Article 349 TFUE).
  {
    url: "https://www.europe-guadeloupe.fr/",
    title: "Guadeloupe — L'Europe s'engage",
    summary:
      "Portail des fonds européens en Guadeloupe. Programme FEDER-FSE+ (~700 M€), FEADER, FEAMPA, POSEI agricole, Interreg Caraïbes. Région ultrapériphérique : taux d'intervention UE jusqu'à 85 %.",
    themes: ["Outre-mer", "Caraïbe", "Insularité"],
    funder: "Région Guadeloupe",
    fund: "Multi",
    region: "Guadeloupe",
    eligibleEntities: ["association", "entreprise", "collectivite", "agriculteur"],
    eligibleCountries: ["FR"],
    minAmountEur: 10000,
    maxAmountEur: 2000000,
  },
  {
    url: "https://www.europe-martinique.com/",
    title: "Martinique — Europe en Martinique",
    summary:
      "Portail des fonds européens en Martinique. Programme FEDER-FSE+ (~600 M€), FEADER, FEAMPA, POSEI, Interreg Caraïbes. Région ultrapériphérique.",
    themes: ["Outre-mer", "Caraïbe", "Insularité"],
    funder: "Collectivité Territoriale de Martinique",
    fund: "Multi",
    region: "Martinique",
    eligibleEntities: ["association", "entreprise", "collectivite", "agriculteur"],
    eligibleCountries: ["FR"],
    minAmountEur: 10000,
    maxAmountEur: 2000000,
  },
  {
    url: "https://www.europe-en-guyane.eu/",
    title: "Guyane — L'Europe en Guyane",
    summary:
      "Portail des fonds européens en Guyane. Programme FEDER-FSE+ (~500 M€), FEADER, FEAMPA, POSEI, Interreg Amazonie. RUP au taux d'intervention le plus élevé.",
    themes: ["Outre-mer", "Amazonie", "Forêt"],
    funder: "Collectivité Territoriale de Guyane",
    fund: "Multi",
    region: "Guyane",
    eligibleEntities: ["association", "entreprise", "collectivite", "agriculteur"],
    eligibleCountries: ["FR"],
    minAmountEur: 10000,
    maxAmountEur: 2000000,
  },
  {
    url: "https://www.regionreunion.com/aides-services/article/programmes-europeens-2021-2027",
    title: "La Réunion — Programmes européens 2021-2027",
    summary:
      "Programmes européens à La Réunion. Programme FEDER-FSE+ (~2 Md€, le plus important des RUP), FEADER, FEAMPA, POSEI, Interreg Océan Indien. Réunion = 1ᵉʳ bénéficiaire FESI/habitant en France.",
    themes: ["Outre-mer", "Océan Indien", "Insularité"],
    funder: "Région La Réunion",
    fund: "Multi",
    region: "La Réunion",
    eligibleEntities: ["association", "entreprise", "collectivite", "agriculteur"],
    eligibleCountries: ["FR"],
    minAmountEur: 10000,
    maxAmountEur: 2000000,
  },
  {
    url: "https://www.europe-a-mayotte.fr/",
    title: "Mayotte — L'Europe à Mayotte",
    summary:
      "Programmes européens à Mayotte (101ᵉ département, RUP depuis 2014). Programme FEDER-FSE+ (~500 M€), FEADER, FEAMPA, POSEI. Forte montée en charge sur 2021-2027.",
    themes: ["Outre-mer", "Océan Indien", "Insularité"],
    funder: "Préfecture de Mayotte / SGAR",
    fund: "Multi",
    region: "Mayotte",
    eligibleEntities: ["association", "entreprise", "collectivite", "agriculteur"],
    eligibleCountries: ["FR"],
    minAmountEur: 10000,
    maxAmountEur: 2000000,
  },

  // ─── FSE+ — VOLETS THÉMATIQUES NATIONAUX ─────────────────────────
  {
    url: "https://www.fse.gouv.fr/programmes/programme-emploi-inclusion-jeunesse-competences",
    title: "FSE+ — Programme national Emploi-Inclusion-Jeunesse-Compétences",
    summary:
      "Volet emploi-inclusion du FSE+ (DGEFP). Cofinance les Plans Locaux pour l'Insertion et l'Emploi (PLIE), les missions locales, les structures d'insertion par l'activité économique (SIAE), les écoles de la 2e Chance, les actions d'accompagnement vers l'emploi.",
    themes: ["Emploi", "Insertion", "Jeunesse", "Compétences"],
    funder: "DGEFP / FSE+ France",
    fund: "FSE+",
    region: null,
    eligibleEntities: ["association", "entreprise", "collectivite"],
    eligibleCountries: ["FR"],
    minAmountEur: 23000,
    maxAmountEur: 2000000,
  },
  {
    url: "https://www.fse.gouv.fr/programmes/programme-aide-alimentaire",
    title: "FSE+ — Aide alimentaire (ex-FEAD)",
    summary:
      "Volet aide alimentaire du FSE+ (~600 M€/an). Cofinance les denrées et l'accompagnement des grandes associations habilitées : Croix-Rouge, Restos du Cœur, Banques Alimentaires, Secours Populaire, Fédération française des Banques Alimentaires.",
    themes: ["Pauvreté", "Solidarité", "Aide alimentaire"],
    funder: "FranceAgriMer / DGCS",
    fund: "FSE+",
    region: null,
    eligibleEntities: ["association"],
    eligibleCountries: ["FR"],
    maxAmountEur: 5000000,
  },
  {
    url: "https://www.fse.gouv.fr/initiative-pour-l-emploi-des-jeunes-iej",
    title: "FSE+ — Volet jeunesse (ex-IEJ)",
    summary:
      "Volet jeunesse du FSE+ (héritier de l'Initiative pour l'Emploi des Jeunes). Cible les NEET (jeunes ni en emploi, ni en formation, ni en études). Soutient l'accompagnement par les missions locales, le service civique renforcé, les écoles de production.",
    themes: ["Jeunesse", "Emploi", "Insertion"],
    funder: "DGEFP / FSE+",
    fund: "FSE+",
    region: null,
    eligibleEntities: ["association", "collectivite"],
    eligibleCountries: ["FR"],
    minAmountEur: 23000,
    maxAmountEur: 1500000,
  },

  // ─── FEADER — DISPOSITIFS NATIONAUX & GAL ────────────────────────
  {
    url: "https://agriculture.gouv.fr/dotation-jeunes-agriculteurs-dja",
    title: "FEADER — Dotation Jeunes Agriculteurs (DJA)",
    summary:
      "Aide à l'installation des nouveaux agriculteurs cofinancée par le FEADER. Subvention forfaitaire (modulée selon le projet et le territoire) pour aider à la trésorerie de démarrage. Pilotée par les Régions.",
    themes: ["Agriculture", "Installation", "Ruralité"],
    funder: "Régions / MASA / FEADER",
    fund: "FEADER",
    region: null,
    eligibleEntities: ["agriculteur", "entreprise"],
    eligibleCountries: ["FR"],
    minAmountEur: 8000,
    maxAmountEur: 60000,
  },
  {
    url: "https://agriculture.gouv.fr/le-plan-de-competitivite-et-dadaptation-des-exploitations-agricoles-pcae",
    title: "FEADER — Plan de Compétitivité et d'Adaptation des Exploitations (PCAE)",
    summary:
      "Aides FEADER aux investissements dans les exploitations agricoles : modernisation, transition agroécologique, autonomie protéique, économies d'eau et d'énergie, transformation à la ferme. Géré par les Régions.",
    themes: ["Agriculture", "Modernisation", "Agroécologie"],
    funder: "Régions / FEADER",
    fund: "FEADER",
    region: null,
    eligibleEntities: ["agriculteur", "entreprise"],
    eligibleCountries: ["FR"],
    minAmountEur: 5000,
    maxAmountEur: 200000,
  },
  {
    url: "https://www.reseaurural.fr/le-reseau-rural-francais/leader-feader",
    title: "FEADER — LEADER (catalogue des GAL)",
    summary:
      "Annuaire et stratégies des 339 Groupes d'Action Locale (GAL) LEADER en France. Chaque GAL ouvre ses propres AAP locaux selon une stratégie de développement (5-7 thématiques au choix). Cibles : associations, microentreprises, communes rurales, agriculteurs.",
    themes: ["Ruralité", "Développement local"],
    funder: "Régions / GAL LEADER",
    fund: "FEADER",
    region: null,
    eligibleEntities: ["association", "collectivite", "entreprise", "agriculteur"],
    eligibleCountries: ["FR"],
    minAmountEur: 5000,
    maxAmountEur: 100000,
  },
  {
    url: "https://agriculture.gouv.fr/les-mesures-agroenvironnementales-et-climatiques-maec",
    title: "FEADER — Mesures Agro-Environnementales et Climatiques (MAEC)",
    summary:
      "Aides surfaciques FEADER aux agriculteurs s'engageant dans des pratiques favorables à l'environnement, au climat et à la biodiversité (bio, prairies, zones humides, polyculture, économies d'intrants). Engagement 5 ans.",
    themes: ["Agriculture", "Environnement", "Climat", "Biodiversité"],
    funder: "MASA / FEADER",
    fund: "FEADER",
    region: null,
    eligibleEntities: ["agriculteur"],
    eligibleCountries: ["FR"],
    minAmountEur: 1000,
    maxAmountEur: 60000,
  },
  {
    url: "https://agriculture.gouv.fr/aide-la-conversion-lagriculture-biologique-cab",
    title: "FEADER — Conversion à l'Agriculture Biologique (CAB)",
    summary:
      "Aide à la conversion à l'agriculture biologique cofinancée FEADER. Soutien forfaitaire à l'hectare pendant 5 ans selon le type de culture (terres arables, légumes, viticulture, maraîchage, arboriculture).",
    themes: ["Agriculture", "Bio", "Environnement"],
    funder: "MASA / FEADER",
    fund: "FEADER",
    region: null,
    eligibleEntities: ["agriculteur"],
    eligibleCountries: ["FR"],
    minAmountEur: 1000,
    maxAmountEur: 60000,
  },

  // ─── FEAMPA — DISPOSITIFS THÉMATIQUES ────────────────────────────
  {
    url: "https://feampa.fr/decarbonation-des-flottes-de-peche/",
    title: "FEAMPA — Décarbonation des flottes de pêche",
    summary:
      "AAP FEAMPA pour la modernisation et la décarbonation des navires de pêche : remotorisation, efficacité énergétique, sécurité, conditions de travail à bord.",
    themes: ["Mer", "Pêche", "Décarbonation"],
    funder: "DGAMPA / FEAMPA",
    fund: "FEAMPA",
    region: null,
    eligibleEntities: ["entreprise"],
    eligibleCountries: ["FR"],
    minAmountEur: 10000,
    maxAmountEur: 1000000,
  },
  {
    url: "https://feampa.fr/aquaculture/",
    title: "FEAMPA — Aquaculture durable",
    summary:
      "Volet aquaculture du FEAMPA : installation, modernisation, conversion biologique, recirculation d'eau, gestion sanitaire, valorisation des produits. Cible exploitations aquacoles métropole et outre-mer.",
    themes: ["Mer", "Aquaculture"],
    funder: "DGAMPA / FEAMPA",
    fund: "FEAMPA",
    region: null,
    eligibleEntities: ["entreprise"],
    eligibleCountries: ["FR"],
    minAmountEur: 10000,
    maxAmountEur: 1500000,
  },
  {
    url: "https://feampa.fr/economie-bleue-durable/",
    title: "FEAMPA — Économie bleue durable & innovation maritime",
    summary:
      "Volet économie bleue du FEAMPA. Soutien à l'innovation maritime, aux énergies marines renouvelables, à la connaissance du milieu marin, aux Aires Marines Protégées et à la gouvernance maritime intégrée.",
    themes: ["Mer", "Économie bleue", "Innovation"],
    funder: "DGAMPA / FEAMPA",
    fund: "FEAMPA",
    region: null,
    eligibleEntities: ["association", "entreprise", "collectivite", "recherche"],
    eligibleCountries: ["FR"],
    minAmountEur: 10000,
    maxAmountEur: 2000000,
  },

  // ─── FEDER — DISPOSITIFS THÉMATIQUES TRANSVERSAUX ────────────────
  {
    url: "https://www.europe-en-france.gouv.fr/fr/fonds-europeens/feder",
    title: "FEDER — Volet Recherche & Innovation",
    summary:
      "Volet R&I du FEDER (premier poste budgétaire, ~30 % de l'enveloppe FEDER 2021-2027). Soutient les projets de recherche collaborative, transferts de technologie, plateformes d'innovation, smart specialisation. Géré par chaque Région.",
    themes: ["Recherche", "Innovation"],
    funder: "Régions / FEDER",
    fund: "FEDER",
    region: null,
    eligibleEntities: ["entreprise", "recherche", "association"],
    eligibleCountries: ["FR"],
    minAmountEur: 30000,
    maxAmountEur: 2000000,
  },
  {
    url: "https://www.europe-en-france.gouv.fr/fr/fonds-europeens/feder",
    title: "FEDER — Volet Transition écologique",
    summary:
      "Volet transition du FEDER. Soutient les projets bas-carbone, énergies renouvelables, économie circulaire, biodiversité, qualité de l'air, adaptation au changement climatique. Bénéficiaires : associations, collectivités, entreprises.",
    themes: ["Environnement", "Climat", "Énergie", "Économie circulaire"],
    funder: "Régions / FEDER",
    fund: "FEDER",
    region: null,
    eligibleEntities: ["association", "entreprise", "collectivite"],
    eligibleCountries: ["FR"],
    minAmountEur: 23000,
    maxAmountEur: 2000000,
  },
  {
    url: "https://www.europe-en-france.gouv.fr/fr/fonds-europeens/feder",
    title: "FEDER — Volet Numérique pour tous",
    summary:
      "Volet numérique du FEDER. Soutien aux projets de transformation numérique des PME, infrastructures numériques (très haut débit, données), e-services publics, inclusion numérique, cybersécurité.",
    themes: ["Numérique", "Innovation", "Inclusion"],
    funder: "Régions / FEDER",
    fund: "FEDER",
    region: null,
    eligibleEntities: ["association", "entreprise", "collectivite"],
    eligibleCountries: ["FR"],
    minAmountEur: 23000,
    maxAmountEur: 1500000,
  },
  {
    url: "https://www.europe-en-france.gouv.fr/fr/fonds-europeens/feder",
    title: "FEDER — Volet Cohésion territoriale (ITI / DLAL)",
    summary:
      "Volet cohésion territoriale du FEDER : Investissements Territoriaux Intégrés (ITI) urbains et Développement Local mené par les Acteurs Locaux (DLAL) ruraux et urbains. Soutient des stratégies de territoire intégrées (~5 % de l'enveloppe).",
    themes: ["Territoires", "Cohésion", "Politique de la ville"],
    funder: "Régions / FEDER",
    fund: "FEDER",
    region: null,
    eligibleEntities: ["association", "collectivite", "entreprise"],
    eligibleCountries: ["FR"],
    minAmountEur: 5000,
    maxAmountEur: 500000,
  },
];

export async function fetchEUStructuralFunds(): Promise<EUStructuralFundProgram[]> {
  console.log(
    `[Fonds européens structurels (FEDER/FSE+/FEADER/FEAMPA)] ${EU_STRUCTURAL_PROGRAMS.length} programmes curés`
  );
  return EU_STRUCTURAL_PROGRAMS;
}

export function transformEUStructuralToGrant(p: EUStructuralFundProgram) {
  const themes = [...p.themes];
  if (!themes.includes(p.fund) && p.fund !== "Multi") themes.push(p.fund);
  if (!themes.includes("Europe")) themes.push("Europe");

  return {
    sourceUrl: p.url,
    sourceName: "Fonds européens structurels (FEDER/FSE+/FEADER/FEAMPA)",
    title: p.title,
    summary: p.summary,
    rawContent: p.summary,
    funder: p.funder,
    country: "FR",
    thematicAreas: themes,
    eligibleEntities:
      p.eligibleEntities ?? ["association", "entreprise", "collectivite"],
    eligibleCountries: p.eligibleCountries ?? ["FR"],
    minAmountEur: p.minAmountEur ?? 23000,
    maxAmountEur: p.maxAmountEur ?? 1500000,
    coFinancingRequired: true,
    deadline: null,
    grantType: "subvention",
    language: "fr",
    status: "active",
    aiSummary: null,
  };
}
