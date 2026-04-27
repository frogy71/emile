/**
 * European programs not surfaced by SEDIA
 *
 * The SEDIA portal (eu-funding.ts) covers all centralised EU calls
 * (Horizon Europe, CERV, Erasmus+ centralised, LIFE, etc.). But many
 * European funding instruments are managed nationally, by intergovernmental
 * partnerships (EEA/Norway Grants, Council of Europe), or by Interreg
 * programme bodies — and never appear in SEDIA.
 *
 * This source curates the entry-points and recurring sub-programmes for
 * these European funders, so French associations and collectivités can
 * discover them.
 */

export interface EUExtraProgram {
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

const EU_EXTRA_PROGRAMS: EUExtraProgram[] = [
  // ─── ERASMUS+ — AGENCES NATIONALES (FR) ──────────────────────────
  {
    url: "https://agence.erasmusplus.fr/financements/",
    title: "Erasmus+ France — Éducation & Formation",
    summary:
      "Agence Erasmus+ France Éducation/Formation. Coordonne les fonds Erasmus+ pour l'enseignement scolaire, supérieur, professionnel et l'éducation des adultes : KA1 mobilité, KA2 partenariats, KA3 réformes.",
    themes: ["Éducation", "Formation", "Mobilité", "International"],
    funder: "Agence Erasmus+ France (Éducation/Formation)",
    eligibleEntities: ["universite", "ecole", "association", "entreprise"],
    eligibleCountries: ["FR", "EU"],
    maxAmountEur: 400000,
  },
  {
    url: "https://www.erasmusplus-jeunesse.fr/",
    title: "Erasmus+ France — Jeunesse & Sport",
    summary:
      "Agence Erasmus+ France Jeunesse & Sport (INJEP) : KA1 mobilité jeunesse, échanges, volontariat (ESC), KA2 partenariats jeunesse, sport (petits & grands partenariats).",
    themes: ["Jeunesse", "Sport", "Mobilité", "International"],
    funder: "Agence Erasmus+ France Jeunesse & Sport",
    eligibleEntities: ["association"],
    eligibleCountries: ["FR", "EU"],
    maxAmountEur: 400000,
  },
  {
    url: "https://www.erasmusplus-jeunesse.fr/le-corps-europeen-de-solidarite/",
    title: "Corps Européen de Solidarité (CES)",
    summary:
      "Programme européen successeur du SVE pour les 18-30 ans. Volontariat individuel ou en groupe, projets de solidarité menés par les jeunes. Indemnités prises en charge.",
    themes: ["Jeunesse", "Engagement", "International"],
    funder: "Commission Européenne (DG EAC)",
    eligibleEntities: ["association"],
    eligibleCountries: ["EU"],
    maxAmountEur: 60000,
  },

  // ─── EEA / NORWAY GRANTS ─────────────────────────────────────────
  {
    url: "https://eeagrants.org/",
    title: "EEA Grants — Espace Économique Européen",
    summary:
      "Mécanisme financier de l'Islande, Liechtenstein et Norvège pour les 15 États membres de l'UE bénéficiaires (Europe centrale et du Sud). Réduction des disparités économiques et renforcement des relations bilatérales. Cible société civile, recherche, environnement.",
    themes: ["Solidarité internationale", "Société civile", "Recherche"],
    funder: "EEA Grants (Islande/Liechtenstein/Norvège)",
    eligibleEntities: ["association", "ong", "recherche"],
    eligibleCountries: ["EU"],
    maxAmountEur: 1000000,
  },
  {
    url: "https://eeagrants.org/topics-programmes/active-citizens-fund",
    title: "EEA Grants — Active Citizens Fund",
    summary:
      "Sous-programme phare des EEA Grants : 214 M€ pour la société civile dans 15 pays. Soutien à la démocratie, droits humains, vulnérables, plaidoyer, médias indépendants.",
    themes: ["Société civile", "Démocratie", "Droits humains"],
    funder: "EEA Grants — Active Citizens Fund",
    eligibleEntities: ["association", "ong"],
    eligibleCountries: ["EU"],
    maxAmountEur: 200000,
  },

  // ─── INTERREG ────────────────────────────────────────────────────
  {
    url: "https://interreg.eu/",
    title: "Interreg — Coopération territoriale européenne",
    summary:
      "Politique européenne de coopération transfrontalière, transnationale et interrégionale. 86 programmes Interreg sur la période 2021-2027 (8,1 Md€).",
    themes: ["Territoires", "Coopération", "International"],
    funder: "Commission Européenne (DG REGIO)",
    eligibleEntities: ["association", "collectivite", "entreprise", "recherche"],
    eligibleCountries: ["EU"],
    maxAmountEur: 2000000,
  },
  {
    url: "https://interreg-france-wallonie-vlaanderen.eu/",
    title: "Interreg France-Wallonie-Vlaanderen",
    summary:
      "Programme transfrontalier France / Belgique francophone & flamande. Innovation, environnement, social, tourisme.",
    themes: ["Territoires", "Coopération transfrontalière"],
    funder: "Interreg France-Wallonie-Vlaanderen",
    eligibleEntities: ["association", "collectivite", "entreprise"],
    eligibleCountries: ["FR", "BE"],
    maxAmountEur: 2000000,
  },
  {
    url: "https://www.interreg-rhin-superieur.eu/",
    title: "Interreg Rhin Supérieur",
    summary:
      "Programme transfrontalier France / Allemagne / Suisse autour du Rhin Supérieur. Innovation, environnement, mobilité, services.",
    themes: ["Territoires", "Coopération transfrontalière"],
    funder: "Interreg Rhin Supérieur",
    eligibleEntities: ["association", "collectivite", "entreprise"],
    eligibleCountries: ["FR", "DE", "CH"],
    maxAmountEur: 2000000,
  },
  {
    url: "https://www.interreg-france-suisse.eu/",
    title: "Interreg France-Suisse",
    summary:
      "Programme transfrontalier France / Suisse (arc jurassien, Léman). Innovation, environnement, tourisme, services aux territoires.",
    themes: ["Territoires", "Coopération transfrontalière"],
    funder: "Interreg France-Suisse",
    eligibleEntities: ["association", "collectivite", "entreprise"],
    eligibleCountries: ["FR", "CH"],
    maxAmountEur: 1500000,
  },
  {
    url: "https://www.interreg-alcotra.eu/",
    title: "Interreg ALCOTRA (France-Italie Alpes)",
    summary:
      "Programme transfrontalier France / Italie (Alpes occidentales). Tourisme, environnement, innovation, services.",
    themes: ["Territoires", "Coopération transfrontalière", "Montagne"],
    funder: "Interreg ALCOTRA",
    eligibleEntities: ["association", "collectivite", "entreprise"],
    eligibleCountries: ["FR", "IT"],
    maxAmountEur: 2000000,
  },
  {
    url: "https://interreg-marittimo.eu/fr/",
    title: "Interreg Marittimo (France-Italie maritime)",
    summary:
      "Programme transfrontalier maritime entre la Corse, la Sardaigne, la Toscane et le Var. Innovation bleue, mer durable, tourisme.",
    themes: ["Mer", "Coopération transfrontalière"],
    funder: "Interreg Marittimo",
    eligibleEntities: ["association", "collectivite", "entreprise"],
    eligibleCountries: ["FR", "IT"],
    maxAmountEur: 1500000,
  },
  {
    url: "https://interreg-poctefa.eu/",
    title: "Interreg POCTEFA (France-Espagne-Andorre)",
    summary:
      "Programme transfrontalier des Pyrénées : France / Espagne / Andorre. Innovation, environnement, mobilité, emploi.",
    themes: ["Territoires", "Coopération transfrontalière", "Pyrénées"],
    funder: "Interreg POCTEFA",
    eligibleEntities: ["association", "collectivite", "entreprise"],
    eligibleCountries: ["FR", "ES", "AD"],
    maxAmountEur: 1500000,
  },
  {
    url: "https://interreg-caraibes.eu/",
    title: "Interreg Caraïbes",
    summary:
      "Programme transfrontalier Caraïbes (Guadeloupe, Martinique, Guyane, Saint-Martin) avec les pays voisins. Risques naturels, biodiversité, économie bleue.",
    themes: ["Territoires", "Outre-mer", "Coopération internationale"],
    funder: "Interreg Caraïbes",
    eligibleEntities: ["association", "collectivite", "entreprise"],
    eligibleCountries: ["FR"],
    maxAmountEur: 2000000,
  },
  {
    url: "https://interreg-oi.fr/",
    title: "Interreg Océan Indien",
    summary:
      "Programme transfrontalier Océan Indien (La Réunion, Mayotte) avec les pays voisins (Comores, Madagascar, Maurice, Seychelles).",
    themes: ["Territoires", "Outre-mer", "Coopération internationale"],
    funder: "Interreg Océan Indien",
    eligibleEntities: ["association", "collectivite"],
    eligibleCountries: ["FR"],
    maxAmountEur: 2000000,
  },
  {
    url: "https://www.interreg-sudoe.eu/fr/",
    title: "Interreg SUDOE (Sud-Ouest européen)",
    summary:
      "Programme transnational Espagne / Portugal / Sud-Ouest de la France / Andorre. Innovation, climat, économie circulaire, démographie.",
    themes: ["Territoires", "Coopération transnationale"],
    funder: "Interreg SUDOE",
    eligibleEntities: ["association", "collectivite", "entreprise", "recherche"],
    eligibleCountries: ["FR", "ES", "PT", "AD"],
    maxAmountEur: 2500000,
  },
  {
    url: "https://www.interreg-northwesteurope.eu/",
    title: "Interreg North-West Europe (NWE)",
    summary:
      "Programme transnational Europe du Nord-Ouest (FR, BE, NL, LU, IE, DE). Climat, transition, innovation.",
    themes: ["Territoires", "Coopération transnationale"],
    funder: "Interreg NWE",
    eligibleEntities: ["association", "collectivite", "entreprise"],
    eligibleCountries: ["FR", "EU"],
    maxAmountEur: 3000000,
  },
  {
    url: "https://www.interregeurope.eu/",
    title: "Interreg Europe (interrégional)",
    summary:
      "Programme paneuropéen de coopération interrégionale : 27 États membres + Norvège + Suisse. Échanges de bonnes pratiques entre territoires.",
    themes: ["Territoires", "Coopération", "Innovation"],
    funder: "Interreg Europe",
    eligibleEntities: ["collectivite", "association"],
    eligibleCountries: ["EU"],
    maxAmountEur: 1500000,
  },
  {
    url: "https://interreg-amazon.eu/",
    title: "Interreg Amazonie",
    summary:
      "Programme transfrontalier Guyane française / Brésil / Suriname. Biodiversité, santé, économie locale.",
    themes: ["Territoires", "Outre-mer", "Coopération internationale"],
    funder: "Interreg Amazonie",
    eligibleEntities: ["association", "collectivite", "entreprise"],
    eligibleCountries: ["FR"],
    maxAmountEur: 1500000,
  },

  // ─── COUNCIL OF EUROPE ───────────────────────────────────────────
  {
    url: "https://www.coe.int/en/web/portal/funding-opportunities",
    title: "Conseil de l'Europe — Opportunités de financement",
    summary:
      "Le Conseil de l'Europe (47 États) finance des programmes sur les droits humains, la démocratie, l'État de droit, les minorités, le sport éthique, la culture.",
    themes: ["Droits humains", "Démocratie", "Culture"],
    funder: "Conseil de l'Europe",
    eligibleEntities: ["association", "ong", "collectivite", "recherche"],
    eligibleCountries: ["EU"],
    maxAmountEur: 200000,
  },
  {
    url: "https://www.coe.int/en/web/european-youth-foundation",
    title: "Conseil de l'Europe — European Youth Foundation",
    summary:
      "Fonds européen pour la jeunesse (CdE) : soutien aux ONG de jeunesse pour des activités internationales (rencontres, formations, recherche, publications).",
    themes: ["Jeunesse", "International", "Engagement"],
    funder: "Conseil de l'Europe (FEJ)",
    eligibleEntities: ["association", "ong"],
    eligibleCountries: ["EU"],
    maxAmountEur: 50000,
  },
  {
    url: "https://www.coebank.org/en/loans-and-financing/",
    title: "Banque de Développement du Conseil de l'Europe (CEB)",
    summary:
      "Banque multilatérale du CdE : prêts pour projets sociaux (logement social, éducation, santé, intégration des migrants, infrastructures sociales).",
    themes: ["Solidarité", "Logement", "Migration"],
    funder: "Banque CEB",
    eligibleEntities: ["collectivite", "etat"],
    eligibleCountries: ["EU"],
    maxAmountEur: 50000000,
  },
  {
    url: "https://www.coe.int/en/web/eurimages",
    title: "Eurimages — Fonds cinéma du Conseil de l'Europe",
    summary:
      "Fonds européen de coproduction cinématographique. Soutien aux longs métrages européens, à la distribution et à l'exposition.",
    themes: ["Culture", "Cinéma"],
    funder: "Eurimages",
    eligibleEntities: ["entreprise"],
    eligibleCountries: ["EU"],
    maxAmountEur: 500000,
  },

  // ─── LIFE ────────────────────────────────────────────────────────
  {
    url: "https://cinea.ec.europa.eu/programmes/life_en",
    title: "LIFE Programme — Environnement & Climat",
    summary:
      "Programme européen environnement et climat (5,4 Md€ 2021-2027). 4 sous-programmes : Nature & Biodiversité, Économie circulaire & qualité de vie, Atténuation & adaptation au changement climatique, Transition énergétique propre.",
    themes: ["Environnement", "Climat", "Biodiversité", "Énergie"],
    funder: "Commission Européenne (CINEA)",
    eligibleEntities: ["association", "collectivite", "entreprise", "recherche"],
    eligibleCountries: ["EU"],
    maxAmountEur: 5000000,
  },
  {
    url: "https://cinea.ec.europa.eu/programmes/life/life-clean-energy-transition_en",
    title: "LIFE — Clean Energy Transition (CET)",
    summary:
      "Sous-programme LIFE pour la transition énergétique propre (efficacité énergétique, communautés énergétiques, décarbonation, gouvernance multi-niveaux).",
    themes: ["Énergie", "Climat"],
    funder: "Commission Européenne (CINEA)",
    eligibleEntities: ["association", "collectivite", "entreprise"],
    eligibleCountries: ["EU"],
    maxAmountEur: 2000000,
  },

  // ─── HORIZON / CERV / EUROPE CRÉATIVE — entrées portail ─────────
  {
    url: "https://citizens-equality-rights-values.ec.europa.eu/",
    title: "CERV — Citoyens, Égalité, Droits et Valeurs",
    summary:
      "Programme européen pour les droits fondamentaux, l'égalité des genres, la lutte contre les violences, la mémoire européenne, la participation citoyenne (1,55 Md€ 2021-2027).",
    themes: ["Droits humains", "Égalité", "Démocratie", "Citoyenneté"],
    funder: "Commission Européenne (CERV)",
    eligibleEntities: ["association", "ong", "collectivite"],
    eligibleCountries: ["EU"],
    maxAmountEur: 1000000,
  },
  {
    url: "https://culture.ec.europa.eu/creative-europe",
    title: "Europe Créative — Culture & Médias",
    summary:
      "Programme européen pour la culture, l'audiovisuel et les médias (2,4 Md€ 2021-2027). 3 volets : Culture, MEDIA (audiovisuel), Cross-sectoriel (innovation, médias d'information).",
    themes: ["Culture", "Audiovisuel", "Médias"],
    funder: "Commission Européenne (EACEA)",
    eligibleEntities: ["association", "entreprise"],
    eligibleCountries: ["EU"],
    maxAmountEur: 2000000,
  },
  {
    url: "https://home-affairs.ec.europa.eu/funding/asylum-migration-and-integration-funds_en",
    title: "AMIF — Asylum, Migration and Integration Fund",
    summary:
      "Fonds européen Asile, Migration et Intégration (2021-2027). Soutien aux projets d'accueil, intégration des migrants, retours volontaires, lutte contre les passeurs.",
    themes: ["Migration", "Solidarité"],
    funder: "Commission Européenne / DGEFP-FR",
    eligibleEntities: ["association", "ong", "collectivite"],
    eligibleCountries: ["EU"],
    maxAmountEur: 2000000,
  },
  {
    url: "https://ec.europa.eu/european-social-fund-plus/fr",
    title: "FSE+ (Fonds Social Européen Plus)",
    summary:
      "Principal levier européen pour l'investissement dans l'humain : emploi, inclusion sociale, lutte contre la pauvreté, formation. Mis en œuvre en France via les Régions et la DGEFP.",
    themes: ["Emploi", "Insertion", "Formation"],
    funder: "Commission Européenne / DGEFP-FR / Régions",
    eligibleEntities: ["association", "collectivite", "entreprise"],
    eligibleCountries: ["FR", "EU"],
    maxAmountEur: 1000000,
  },
  {
    url: "https://www.fse.gouv.fr/",
    title: "FSE+ France — Plateforme nationale Ma Démarche FSE",
    summary:
      "Plateforme française de dépôt FSE+ piloté par la DGEFP : volet emploi (500 M€/an) — partenariats territoriaux, accompagnement à l'emploi, lutte contre la pauvreté.",
    themes: ["Emploi", "Insertion"],
    funder: "DGEFP / FSE+ France",
    eligibleEntities: ["association", "collectivite", "entreprise"],
    eligibleCountries: ["FR"],
    maxAmountEur: 500000,
  },

  // ─── EU4HEALTH / DIGITAL EUROPE / CEF ─────────────────────────────
  {
    url: "https://hadea.ec.europa.eu/programmes/eu4health_en",
    title: "EU4Health — Programme européen santé",
    summary:
      "Programme européen pour la santé (5,3 Md€ 2021-2027). Soutien aux États membres et à la société civile sur la prévention, le cancer, l'AMR, la santé numérique, l'Union de la Santé.",
    themes: ["Santé", "Recherche"],
    funder: "Commission Européenne (HaDEA)",
    eligibleEntities: ["association", "ong", "recherche"],
    eligibleCountries: ["EU"],
    maxAmountEur: 5000000,
  },
  {
    url: "https://digital-strategy.ec.europa.eu/en/activities/digital-programme",
    title: "Digital Europe Programme",
    summary:
      "Programme européen sur le numérique stratégique : IA, cybersécurité, supercalcul, compétences avancées, déploiement (7,6 Md€ 2021-2027).",
    themes: ["Numérique", "Innovation"],
    funder: "Commission Européenne (DG CNECT)",
    eligibleEntities: ["entreprise", "recherche", "collectivite"],
    eligibleCountries: ["EU"],
    maxAmountEur: 5000000,
  },

  // ─── EUROPEANA / AUTRES ──────────────────────────────────────────
  {
    url: "https://www.europeana.eu/en/about-us/funding",
    title: "Europeana — Numérisation patrimoine culturel européen",
    summary:
      "Plateforme européenne du patrimoine culturel numérique. Appels à projets pour la numérisation et la médiation autour des collections culturelles.",
    themes: ["Culture", "Patrimoine", "Numérique"],
    funder: "Europeana / Commission Européenne",
    eligibleEntities: ["association", "musee", "bibliotheque"],
    eligibleCountries: ["EU"],
    maxAmountEur: 200000,
  },
];

export async function fetchEUExtraPrograms(): Promise<EUExtraProgram[]> {
  console.log(`[EU Programmes (hors SEDIA)] ${EU_EXTRA_PROGRAMS.length} programmes curés`);
  return EU_EXTRA_PROGRAMS;
}

export function transformEUExtraToGrant(p: EUExtraProgram) {
  return {
    sourceUrl: p.url,
    sourceName: "Programmes européens (hors SEDIA)",
    title: p.title,
    summary: p.summary,
    rawContent: p.summary,
    funder: p.funder,
    country: "EU",
    thematicAreas: p.themes,
    eligibleEntities: p.eligibleEntities ?? ["association", "ong", "collectivite"],
    eligibleCountries: p.eligibleCountries ?? ["EU"],
    minAmountEur: p.minAmountEur ?? 10000,
    maxAmountEur: p.maxAmountEur ?? 500000,
    coFinancingRequired: true,
    deadline: null,
    grantType: "subvention",
    language: "en",
    status: "active",
    aiSummary: null,
  };
}
