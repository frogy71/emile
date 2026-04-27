/**
 * Conseils Régionaux — appels à projets et dispositifs régionaux.
 *
 * Les régions françaises distribuent une part importante des subventions
 * aux associations et collectivités. Beaucoup d'AAP sont récurrents
 * (annuels) et structurellement stables, donc une approche curated est
 * pertinente : on liste les programmes phares avec lien direct.
 *
 * Couvre les 13 régions métropolitaines + 5 DROM. Chaque entrée pointe
 * directement sur la page programme/AAP (pas sur la home).
 */

export interface RegionProgram {
  /** Région cible — sert pour le funder + l'eligibility. */
  region: string;
  /** Code région ISO 3166-2:FR (FR-IDF, FR-ARA, etc.) — informatif. */
  regionCode: string;
  url: string;
  title: string;
  summary: string;
  themes: string[];
  /** Cible principale du programme. */
  eligibleEntities?: string[];
  minAmountEur?: number | null;
  maxAmountEur?: number | null;
}

const REGION_PROGRAMS: RegionProgram[] = [
  // ─── ÎLE-DE-FRANCE ────────────────────────────────────────────────
  {
    region: "Île-de-France",
    regionCode: "FR-IDF",
    url: "https://www.iledefrance.fr/aides-et-appels-a-projets",
    title: "Île-de-France — Aides et appels à projets",
    summary:
      "Plateforme régionale recensant l'ensemble des aides et appels à projets de la Région Île-de-France : transition écologique, jeunesse, économie sociale, culture, tourisme, agriculture, lycées, mobilité.",
    themes: ["Territoires", "Innovation", "Solidarité"],
    maxAmountEur: 200000,
  },
  {
    region: "Île-de-France",
    regionCode: "FR-IDF",
    url: "https://www.iledefrance.fr/aides-et-appels-a-projets/fabrique-de-territoires-1",
    title: "IDF — Fabrique de territoires & lieux d'innovation sociale",
    summary:
      "Soutien aux tiers-lieux et fabriques de territoires en Île-de-France : équipement, projet structurant, ingénierie. Subvention jusqu'à 100 000 €.",
    themes: ["Innovation sociale", "Territoires", "Tiers-lieux"],
    maxAmountEur: 100000,
  },
  {
    region: "Île-de-France",
    regionCode: "FR-IDF",
    url: "https://www.iledefrance.fr/aides-et-appels-a-projets/aide-aux-projets-eco-responsables-territoriaux",
    title: "IDF — Aide aux projets éco-responsables territoriaux",
    summary:
      "Subvention aux associations et collectivités franciliennes pour des projets locaux de transition écologique : énergie, mobilité, économie circulaire, biodiversité urbaine.",
    themes: ["Environnement", "Énergie", "Territoires"],
    maxAmountEur: 80000,
  },
  {
    region: "Île-de-France",
    regionCode: "FR-IDF",
    url: "https://www.iledefrance.fr/aides-et-appels-a-projets/soutien-aux-projets-jeunesse",
    title: "IDF — Soutien aux projets jeunesse",
    summary:
      "Aide aux associations franciliennes portant des projets en faveur de la jeunesse : éducation populaire, engagement citoyen, lutte contre les discriminations, accompagnement scolaire.",
    themes: ["Jeunesse", "Éducation", "Citoyenneté"],
    maxAmountEur: 50000,
  },
  {
    region: "Île-de-France",
    regionCode: "FR-IDF",
    url: "https://www.iledefrance.fr/aides-et-appels-a-projets/aide-la-creation-cinematographique-et-audiovisuelle",
    title: "IDF — Aide à la création cinématographique et audiovisuelle",
    summary:
      "Fonds de soutien régional au cinéma et à l'audiovisuel : développement, production, post-production, écriture. Cible producteurs, auteurs, structures culturelles.",
    themes: ["Culture", "Cinéma", "Audiovisuel"],
    maxAmountEur: 250000,
  },
  {
    region: "Île-de-France",
    regionCode: "FR-IDF",
    url: "https://www.iledefrance.fr/aides-et-appels-a-projets/aide-aux-manifestations-culturelles",
    title: "IDF — Aide aux manifestations culturelles",
    summary:
      "Subvention aux festivals, salons, manifestations et programmations culturelles d'envergure régionale en Île-de-France.",
    themes: ["Culture", "Événementiel"],
    maxAmountEur: 100000,
  },
  {
    region: "Île-de-France",
    regionCode: "FR-IDF",
    url: "https://www.iledefrance.fr/aides-et-appels-a-projets/100-projets-pour-le-climat",
    title: "IDF — 100 projets citoyens pour le climat",
    summary:
      "Appel à projets régional pour soutenir des initiatives citoyennes franciliennes en faveur du climat et de la biodiversité.",
    themes: ["Environnement", "Climat", "Citoyenneté"],
    maxAmountEur: 10000,
  },
  {
    region: "Île-de-France",
    regionCode: "FR-IDF",
    url: "https://www.iledefrance.fr/aides-et-appels-a-projets/innovup-leader",
    title: "IDF — Innov'Up Leader / Faisabilité",
    summary:
      "Aide à l'innovation pour les startups et PME franciliennes. Subvention de 30 000 € à 500 000 € selon le volet (faisabilité, expérimentation, leader).",
    themes: ["Innovation", "Numérique", "Recherche"],
    eligibleEntities: ["entreprise", "pme", "startup"],
    minAmountEur: 30000,
    maxAmountEur: 500000,
  },
  {
    region: "Île-de-France",
    regionCode: "FR-IDF",
    url: "https://www.iledefrance.fr/aides-et-appels-a-projets/aide-leconomie-sociale-et-solidaire-ess",
    title: "IDF — Aide à l'Économie Sociale et Solidaire",
    summary:
      "Soutien à la création, au développement et à la consolidation des structures de l'ESS franciliennes (associations, coopératives, entreprises d'insertion).",
    themes: ["ESS", "Solidarité", "Insertion"],
    maxAmountEur: 80000,
  },
  {
    region: "Île-de-France",
    regionCode: "FR-IDF",
    url: "https://www.iledefrance.fr/aides-et-appels-a-projets/projets-solidarite-internationale",
    title: "IDF — Projets de solidarité internationale",
    summary:
      "Aide aux associations franciliennes portant des projets de coopération et de solidarité internationale, en lien avec un partenaire local.",
    themes: ["Solidarité internationale", "Développement"],
    maxAmountEur: 30000,
  },

  // ─── AUVERGNE-RHÔNE-ALPES ─────────────────────────────────────────
  {
    region: "Auvergne-Rhône-Alpes",
    regionCode: "FR-ARA",
    url: "https://www.auvergnerhonealpes.fr/aides",
    title: "Auvergne-Rhône-Alpes — Plateforme aides régionales",
    summary:
      "Portail régional des aides : entreprises, associations, agriculteurs, étudiants, collectivités. Plus de 200 dispositifs (subventions, prêts, garanties).",
    themes: ["Territoires", "Entreprises", "Innovation"],
    maxAmountEur: 200000,
  },
  {
    region: "Auvergne-Rhône-Alpes",
    regionCode: "FR-ARA",
    url: "https://www.auvergnerhonealpes.fr/aide/h/53/contrat-ambition-region-volet-territorial",
    title: "AURA — Contrat Ambition Région (volet territorial)",
    summary:
      "Soutien régional aux projets structurants des territoires (équipements, services, mobilité). Cible communes, EPCI, syndicats. Subvention pluriannuelle.",
    themes: ["Territoires", "Aménagement"],
    eligibleEntities: ["collectivite"],
    maxAmountEur: 1000000,
  },
  {
    region: "Auvergne-Rhône-Alpes",
    regionCode: "FR-ARA",
    url: "https://www.auvergnerhonealpes.fr/aide/h/164/jeunesse-engagee",
    title: "AURA — Jeunesse engagée",
    summary:
      "Soutien régional aux projets associatifs portés par et pour les jeunes : engagement citoyen, mobilité, projets innovants. Subvention jusqu'à 5 000 €.",
    themes: ["Jeunesse", "Engagement", "Citoyenneté"],
    maxAmountEur: 5000,
  },
  {
    region: "Auvergne-Rhône-Alpes",
    regionCode: "FR-ARA",
    url: "https://www.auvergnerhonealpes.fr/aide/h/93/aide-au-fonctionnement-des-festivals",
    title: "AURA — Aide aux festivals",
    summary:
      "Soutien régional aux festivals d'Auvergne-Rhône-Alpes (musique, cinéma, spectacle vivant, livre). Subvention de fonctionnement annuelle.",
    themes: ["Culture", "Événementiel"],
    maxAmountEur: 50000,
  },
  {
    region: "Auvergne-Rhône-Alpes",
    regionCode: "FR-ARA",
    url: "https://www.auvergnerhonealpes.fr/aide/h/127/contrat-vert-et-bleu",
    title: "AURA — Contrats Verts et Bleus",
    summary:
      "Programme régional de protection et restauration des continuités écologiques (trame verte et bleue). Soutien à des plans d'actions pluriannuels.",
    themes: ["Environnement", "Biodiversité"],
    maxAmountEur: 300000,
  },
  {
    region: "Auvergne-Rhône-Alpes",
    regionCode: "FR-ARA",
    url: "https://www.auvergnerhonealpes.fr/aide/h/50/aide-au-developpement-international",
    title: "AURA — Aide au développement international / coopération",
    summary:
      "Soutien aux associations régionales portant des projets de coopération décentralisée et de solidarité internationale.",
    themes: ["Solidarité internationale", "Développement"],
    maxAmountEur: 30000,
  },
  {
    region: "Auvergne-Rhône-Alpes",
    regionCode: "FR-ARA",
    url: "https://www.auvergnerhonealpes.fr/aide/h/82/innov-rd-booster",
    title: "AURA — R&D Booster",
    summary:
      "Aide à la R&D collaborative pour les PME régionales : projets d'innovation, partenariats avec laboratoires.",
    themes: ["Innovation", "Recherche"],
    eligibleEntities: ["entreprise", "pme"],
    maxAmountEur: 200000,
  },

  // ─── NOUVELLE-AQUITAINE ───────────────────────────────────────────
  {
    region: "Nouvelle-Aquitaine",
    regionCode: "FR-NAQ",
    url: "https://les-aides.nouvelle-aquitaine.fr/",
    title: "Nouvelle-Aquitaine — Portail des aides",
    summary:
      "Portail officiel des aides régionales (300+ dispositifs) : transition énergétique, agriculture, économie, formation, culture, mer, jeunesse.",
    themes: ["Territoires", "Innovation", "Solidarité"],
    maxAmountEur: 300000,
  },
  {
    region: "Nouvelle-Aquitaine",
    regionCode: "FR-NAQ",
    url: "https://les-aides.nouvelle-aquitaine.fr/transitions-environnementale-et-energetique/aap-economie-circulaire",
    title: "Nouvelle-Aquitaine — AAP Économie circulaire",
    summary:
      "Soutien régional aux projets d'économie circulaire (éco-conception, allongement de la durée d'usage, gestion des matières et déchets, sensibilisation).",
    themes: ["Environnement", "Économie circulaire"],
    maxAmountEur: 200000,
  },
  {
    region: "Nouvelle-Aquitaine",
    regionCode: "FR-NAQ",
    url: "https://les-aides.nouvelle-aquitaine.fr/jeunesse-citoyennete-vie-associative/aap-cape",
    title: "Nouvelle-Aquitaine — Contrats Aquitains de Performance Énergétique",
    summary:
      "Aide à la rénovation énergétique des bâtiments publics et associatifs néo-aquitains. Audit + travaux.",
    themes: ["Énergie", "Bâtiment"],
    maxAmountEur: 500000,
  },
  {
    region: "Nouvelle-Aquitaine",
    regionCode: "FR-NAQ",
    url: "https://les-aides.nouvelle-aquitaine.fr/culture-sport-et-vie-associative/aide-au-fonctionnement-des-festivals",
    title: "Nouvelle-Aquitaine — Aide au fonctionnement des festivals",
    summary:
      "Soutien régional au fonctionnement des festivals néo-aquitains structurants (musique, livre, image, spectacle vivant).",
    themes: ["Culture", "Événementiel"],
    maxAmountEur: 60000,
  },
  {
    region: "Nouvelle-Aquitaine",
    regionCode: "FR-NAQ",
    url: "https://les-aides.nouvelle-aquitaine.fr/europe-et-international/solidarite-internationale-et-cooperation-decentralisee",
    title: "Nouvelle-Aquitaine — Solidarité internationale & coopération décentralisée",
    summary:
      "Soutien aux projets de coopération décentralisée et de solidarité internationale portés par les associations néo-aquitaines avec un partenaire local.",
    themes: ["Solidarité internationale", "Développement"],
    maxAmountEur: 30000,
  },
  {
    region: "Nouvelle-Aquitaine",
    regionCode: "FR-NAQ",
    url: "https://les-aides.nouvelle-aquitaine.fr/transitions-environnementale-et-energetique/aap-neo-terra",
    title: "Nouvelle-Aquitaine — AAP Néo Terra",
    summary:
      "Feuille de route régionale de transition écologique. Soutien aux projets exemplaires d'agriculture, biodiversité, énergie, mobilité.",
    themes: ["Environnement", "Transition"],
    maxAmountEur: 200000,
  },

  // ─── OCCITANIE ────────────────────────────────────────────────────
  {
    region: "Occitanie",
    regionCode: "FR-OCC",
    url: "https://www.laregion.fr/Les-aides-et-appels-a-projets",
    title: "Occitanie — Aides et appels à projets",
    summary:
      "Portail régional Occitanie : aides aux entreprises, associations, étudiants, collectivités. Pacte Vert, jeunesse, culture, agriculture, mer.",
    themes: ["Territoires", "Innovation"],
    maxAmountEur: 200000,
  },
  {
    region: "Occitanie",
    regionCode: "FR-OCC",
    url: "https://www.laregion.fr/Pacte-vert",
    title: "Occitanie — Pacte Vert",
    summary:
      "Plan régional de transition écologique. Appels à projets thématiques : énergie, biodiversité, alimentation, économie circulaire.",
    themes: ["Environnement", "Énergie", "Biodiversité"],
    maxAmountEur: 150000,
  },
  {
    region: "Occitanie",
    regionCode: "FR-OCC",
    url: "https://www.laregion.fr/Aide-aux-projets-d-economie-sociale-et",
    title: "Occitanie — Aide aux projets ESS",
    summary:
      "Soutien aux acteurs régionaux de l'économie sociale et solidaire (ESS) : associations, coopératives, structures d'insertion.",
    themes: ["ESS", "Insertion", "Solidarité"],
    maxAmountEur: 60000,
  },
  {
    region: "Occitanie",
    regionCode: "FR-OCC",
    url: "https://www.laregion.fr/Aide-aux-festivals",
    title: "Occitanie — Aide aux festivals",
    summary:
      "Soutien aux festivals occitans (musique, cinéma, livre, arts vivants). Subvention annuelle de fonctionnement.",
    themes: ["Culture", "Événementiel"],
    maxAmountEur: 80000,
  },
  {
    region: "Occitanie",
    regionCode: "FR-OCC",
    url: "https://www.laregion.fr/Generation-engagee",
    title: "Occitanie — Génération engagée",
    summary:
      "Programme jeunesse régional : aides aux projets, mobilité européenne, engagement citoyen, premier emploi, formation.",
    themes: ["Jeunesse", "Engagement"],
    maxAmountEur: 5000,
  },
  {
    region: "Occitanie",
    regionCode: "FR-OCC",
    url: "https://www.laregion.fr/-Solidarite-internationale-",
    title: "Occitanie — Solidarité internationale",
    summary:
      "Aide régionale aux associations occitanes pour des projets de coopération internationale, particulièrement en Méditerranée et Afrique.",
    themes: ["Solidarité internationale", "Développement"],
    maxAmountEur: 25000,
  },

  // ─── GRAND EST ────────────────────────────────────────────────────
  {
    region: "Grand Est",
    regionCode: "FR-GES",
    url: "https://www.grandest.fr/aides/",
    title: "Grand Est — Catalogue des aides",
    summary:
      "Portail régional Grand Est : 250+ aides pour entreprises, associations, agriculteurs, collectivités. Énergie, jeunesse, transfrontalier, culture.",
    themes: ["Territoires", "Innovation"],
    maxAmountEur: 200000,
  },
  {
    region: "Grand Est",
    regionCode: "FR-GES",
    url: "https://www.grandest.fr/aides/climaxion/",
    title: "Grand Est — Climaxion (transition énergétique)",
    summary:
      "Programme régional Grand Est / ADEME pour la transition énergétique. Audits, études, investissements (chaleur renouvelable, rénovation, mobilité).",
    themes: ["Énergie", "Environnement"],
    maxAmountEur: 500000,
  },
  {
    region: "Grand Est",
    regionCode: "FR-GES",
    url: "https://www.grandest.fr/vos-aides-regionales/aide-aux-festivals-musiques-actuelles/",
    title: "Grand Est — Aide aux festivals",
    summary:
      "Soutien aux festivals de musiques actuelles, théâtre, cinéma, livre dans le Grand Est.",
    themes: ["Culture", "Événementiel"],
    maxAmountEur: 50000,
  },
  {
    region: "Grand Est",
    regionCode: "FR-GES",
    url: "https://www.grandest.fr/aides/jeunest/",
    title: "Grand Est — Jeun'Est",
    summary:
      "Dispositif régional pour les jeunes : aide aux projets, mobilité internationale, formation, apprentissage. Cible 15-29 ans.",
    themes: ["Jeunesse", "Engagement"],
    maxAmountEur: 5000,
  },
  {
    region: "Grand Est",
    regionCode: "FR-GES",
    url: "https://www.grandest.fr/aides/cooperation-decentralisee-solidarite-internationale/",
    title: "Grand Est — Coopération décentralisée et solidarité internationale",
    summary:
      "Aide aux associations Grand Est portant des projets de coopération internationale (priorités : Afrique, Europe centrale, voisinage).",
    themes: ["Solidarité internationale", "Développement"],
    maxAmountEur: 30000,
  },

  // ─── HAUTS-DE-FRANCE ──────────────────────────────────────────────
  {
    region: "Hauts-de-France",
    regionCode: "FR-HDF",
    url: "https://guide-aides.hautsdefrance.fr/",
    title: "Hauts-de-France — Guide des aides",
    summary:
      "Portail régional Hauts-de-France : aides économiques, sociales, environnementales et culturelles. 200+ dispositifs.",
    themes: ["Territoires", "Solidarité"],
    maxAmountEur: 200000,
  },
  {
    region: "Hauts-de-France",
    regionCode: "FR-HDF",
    url: "https://guide-aides.hautsdefrance.fr/dispositif/aide-aux-festivals/",
    title: "Hauts-de-France — Aide aux festivals",
    summary:
      "Soutien aux festivals régionaux Hauts-de-France (musique, cinéma, livre, spectacle vivant). Subvention de fonctionnement.",
    themes: ["Culture", "Événementiel"],
    maxAmountEur: 60000,
  },
  {
    region: "Hauts-de-France",
    regionCode: "FR-HDF",
    url: "https://guide-aides.hautsdefrance.fr/dispositif/rev3/",
    title: "Hauts-de-France — Rev3 (3ème révolution industrielle)",
    summary:
      "Programme régional de transition vers une économie décarbonée et circulaire. Aide aux projets d'énergies renouvelables, mobilité, économie circulaire.",
    themes: ["Énergie", "Environnement", "Innovation"],
    maxAmountEur: 500000,
  },
  {
    region: "Hauts-de-France",
    regionCode: "FR-HDF",
    url: "https://guide-aides.hautsdefrance.fr/dispositif/generation-2025/",
    title: "Hauts-de-France — Génération + (Jeunesse)",
    summary:
      "Programme régional de soutien aux projets jeunesse (engagement, mobilité, sport, culture).",
    themes: ["Jeunesse", "Sport", "Culture"],
    maxAmountEur: 10000,
  },
  {
    region: "Hauts-de-France",
    regionCode: "FR-HDF",
    url: "https://guide-aides.hautsdefrance.fr/dispositif/cooperation-decentralisee/",
    title: "Hauts-de-France — Coopération décentralisée",
    summary:
      "Aide régionale aux projets de coopération internationale portés par les associations et collectivités des Hauts-de-France.",
    themes: ["Solidarité internationale", "Développement"],
    maxAmountEur: 25000,
  },

  // ─── PROVENCE-ALPES-CÔTE D'AZUR ───────────────────────────────────
  {
    region: "Provence-Alpes-Côte d'Azur",
    regionCode: "FR-PAC",
    url: "https://www.maregionsud.fr/aides-et-appels-a-projets",
    title: "PACA — Aides et appels à projets",
    summary:
      "Portail régional Provence-Alpes-Côte d'Azur : aides aux entreprises, associations, agriculteurs, étudiants. Mer, énergie, culture, jeunesse.",
    themes: ["Territoires", "Innovation"],
    maxAmountEur: 200000,
  },
  {
    region: "Provence-Alpes-Côte d'Azur",
    regionCode: "FR-PAC",
    url: "https://www.maregionsud.fr/aides-et-appels-a-projets/detail/aap-une-cop-davance",
    title: "PACA — Une COP d'avance",
    summary:
      "Stratégie régionale climat. Appels à projets sur l'énergie, la biodiversité, l'eau, l'économie circulaire, l'agriculture durable.",
    themes: ["Environnement", "Climat"],
    maxAmountEur: 200000,
  },
  {
    region: "Provence-Alpes-Côte d'Azur",
    regionCode: "FR-PAC",
    url: "https://www.maregionsud.fr/aides-et-appels-a-projets/detail/aide-aux-festivals",
    title: "PACA — Aide aux festivals",
    summary:
      "Soutien régional aux festivals PACA (musique, cinéma, théâtre, livre).",
    themes: ["Culture", "Événementiel"],
    maxAmountEur: 80000,
  },
  {
    region: "Provence-Alpes-Côte d'Azur",
    regionCode: "FR-PAC",
    url: "https://www.maregionsud.fr/aides-et-appels-a-projets/detail/cooperation-decentralisee",
    title: "PACA — Coopération décentralisée et solidarité internationale",
    summary:
      "Aide aux projets de coopération internationale, particulièrement en Méditerranée et en Afrique francophone.",
    themes: ["Solidarité internationale", "Développement"],
    maxAmountEur: 30000,
  },

  // ─── BRETAGNE ─────────────────────────────────────────────────────
  {
    region: "Bretagne",
    regionCode: "FR-BRE",
    url: "https://www.bretagne.bzh/aides/",
    title: "Bretagne — Aides régionales",
    summary:
      "Portail régional Bretagne : aides économiques, agricoles, culturelles, jeunesse, environnement, mer. 200+ dispositifs.",
    themes: ["Territoires", "Mer"],
    maxAmountEur: 200000,
  },
  {
    region: "Bretagne",
    regionCode: "FR-BRE",
    url: "https://www.bretagne.bzh/aides/fiches/breizh-cop/",
    title: "Bretagne — Breizh Cop (transitions)",
    summary:
      "Stratégie régionale de transitions écologique, démographique, économique. Appels à projets territoires durables, énergie, biodiversité.",
    themes: ["Environnement", "Énergie"],
    maxAmountEur: 200000,
  },
  {
    region: "Bretagne",
    regionCode: "FR-BRE",
    url: "https://www.bretagne.bzh/aides/fiches/karta-bretagne/",
    title: "Bretagne — Karta Bretagne (jeunesse)",
    summary:
      "Programme régional pour la jeunesse bretonne : engagement, projets, mobilité internationale, formation.",
    themes: ["Jeunesse", "Engagement"],
    maxAmountEur: 5000,
  },
  {
    region: "Bretagne",
    regionCode: "FR-BRE",
    url: "https://www.bretagne.bzh/aides/fiches/aide-festivals/",
    title: "Bretagne — Aide aux festivals",
    summary:
      "Soutien aux festivals bretons (musique, cinéma, livre, spectacle vivant, arts traditionnels).",
    themes: ["Culture", "Événementiel"],
    maxAmountEur: 60000,
  },
  {
    region: "Bretagne",
    regionCode: "FR-BRE",
    url: "https://www.bretagne.bzh/aides/fiches/cooperation-internationale/",
    title: "Bretagne — Coopération et solidarité internationale",
    summary:
      "Aide aux associations et collectivités bretonnes portant des projets de coopération internationale.",
    themes: ["Solidarité internationale", "Développement"],
    maxAmountEur: 30000,
  },

  // ─── PAYS DE LA LOIRE ─────────────────────────────────────────────
  {
    region: "Pays de la Loire",
    regionCode: "FR-PDL",
    url: "https://www.paysdelaloire.fr/les-aides",
    title: "Pays de la Loire — Plateforme des aides",
    summary:
      "Portail régional Pays de la Loire : 200+ dispositifs. Économie, jeunesse, agriculture, environnement, culture, sport, formation.",
    themes: ["Territoires", "Innovation"],
    maxAmountEur: 200000,
  },
  {
    region: "Pays de la Loire",
    regionCode: "FR-PDL",
    url: "https://www.paysdelaloire.fr/les-aides/aide-aux-festivals",
    title: "Pays de la Loire — Aide aux festivals",
    summary:
      "Soutien régional aux festivals des Pays de la Loire (musique, théâtre, livre, cinéma).",
    themes: ["Culture", "Événementiel"],
    maxAmountEur: 50000,
  },
  {
    region: "Pays de la Loire",
    regionCode: "FR-PDL",
    url: "https://www.paysdelaloire.fr/les-aides/aide-aux-projets-jeunes",
    title: "Pays de la Loire — Aide aux projets jeunes",
    summary:
      "Aide régionale aux projets portés par et pour les jeunes : engagement, citoyenneté, mobilité, culture, sport.",
    themes: ["Jeunesse", "Engagement"],
    maxAmountEur: 5000,
  },
  {
    region: "Pays de la Loire",
    regionCode: "FR-PDL",
    url: "https://www.paysdelaloire.fr/les-aides/transition-ecologique-aide-aux-projets",
    title: "Pays de la Loire — Aide aux projets de transition écologique",
    summary:
      "Soutien régional aux projets associatifs et territoriaux de transition écologique : énergie, mobilité, biodiversité, économie circulaire.",
    themes: ["Environnement", "Énergie"],
    maxAmountEur: 100000,
  },
  {
    region: "Pays de la Loire",
    regionCode: "FR-PDL",
    url: "https://www.paysdelaloire.fr/les-aides/cooperation-decentralisee",
    title: "Pays de la Loire — Coopération décentralisée",
    summary:
      "Aide aux associations ligériennes pour des projets de coopération internationale.",
    themes: ["Solidarité internationale", "Développement"],
    maxAmountEur: 25000,
  },

  // ─── NORMANDIE ────────────────────────────────────────────────────
  {
    region: "Normandie",
    regionCode: "FR-NOR",
    url: "https://aides.normandie.fr/",
    title: "Normandie — Aides régionales",
    summary:
      "Portail régional Normandie : aides aux entreprises, associations, agriculteurs, étudiants. Mer, énergie, culture, jeunesse, handicap.",
    themes: ["Territoires", "Mer"],
    maxAmountEur: 200000,
  },
  {
    region: "Normandie",
    regionCode: "FR-NOR",
    url: "https://aides.normandie.fr/aides-aux-festivals-et-aux-evenements-culturels",
    title: "Normandie — Aide aux festivals et événements culturels",
    summary:
      "Soutien aux festivals normands (musique, cinéma, livre, spectacle vivant, traditions).",
    themes: ["Culture", "Événementiel"],
    maxAmountEur: 50000,
  },
  {
    region: "Normandie",
    regionCode: "FR-NOR",
    url: "https://aides.normandie.fr/normandie-jeunesse",
    title: "Normandie — Programme Jeunesse",
    summary:
      "Programme régional jeunesse : engagement, projets innovants, mobilité internationale, lutte contre le décrochage.",
    themes: ["Jeunesse", "Engagement"],
    maxAmountEur: 5000,
  },
  {
    region: "Normandie",
    regionCode: "FR-NOR",
    url: "https://aides.normandie.fr/cooperation-decentralisee-et-action-internationale",
    title: "Normandie — Coopération décentralisée",
    summary:
      "Aide régionale aux projets de coopération internationale portés par les associations normandes.",
    themes: ["Solidarité internationale", "Développement"],
    maxAmountEur: 25000,
  },

  // ─── BOURGOGNE-FRANCHE-COMTÉ ──────────────────────────────────────
  {
    region: "Bourgogne-Franche-Comté",
    regionCode: "FR-BFC",
    url: "https://www.bourgognefranchecomte.fr/aides",
    title: "Bourgogne-Franche-Comté — Aides régionales",
    summary:
      "Portail régional BFC : aides aux entreprises, associations, agriculteurs, étudiants, collectivités. Énergie, culture, jeunesse, transition.",
    themes: ["Territoires", "Innovation"],
    maxAmountEur: 200000,
  },
  {
    region: "Bourgogne-Franche-Comté",
    regionCode: "FR-BFC",
    url: "https://www.bourgognefranchecomte.fr/aides/aap-effilogis",
    title: "BFC — Effilogis (rénovation énergétique)",
    summary:
      "Programme régional de rénovation énergétique des logements en Bourgogne-Franche-Comté. Aides aux ménages et bailleurs.",
    themes: ["Énergie", "Logement"],
    maxAmountEur: 50000,
  },
  {
    region: "Bourgogne-Franche-Comté",
    regionCode: "FR-BFC",
    url: "https://www.bourgognefranchecomte.fr/aides/aide-aux-festivals",
    title: "BFC — Aide aux festivals",
    summary:
      "Soutien aux festivals BFC (musique, cinéma, livre, spectacle vivant).",
    themes: ["Culture", "Événementiel"],
    maxAmountEur: 50000,
  },
  {
    region: "Bourgogne-Franche-Comté",
    regionCode: "FR-BFC",
    url: "https://www.bourgognefranchecomte.fr/aides/cooperation-decentralisee",
    title: "BFC — Coopération décentralisée",
    summary:
      "Aide régionale aux projets de coopération internationale portés par les associations BFC.",
    themes: ["Solidarité internationale", "Développement"],
    maxAmountEur: 25000,
  },

  // ─── CENTRE-VAL DE LOIRE ──────────────────────────────────────────
  {
    region: "Centre-Val de Loire",
    regionCode: "FR-CVL",
    url: "https://www.centre-valdeloire.fr/aides-cap-asso",
    title: "Centre-Val de Loire — CAP'Asso",
    summary:
      "Aide à l'emploi associatif en Centre-Val de Loire. Subvention pluriannuelle pour la création/consolidation d'emplois (jusqu'à 60 000 € sur 3 ans).",
    themes: ["Emploi", "Vie associative"],
    maxAmountEur: 60000,
  },
  {
    region: "Centre-Val de Loire",
    regionCode: "FR-CVL",
    url: "https://www.centre-valdeloire.fr/aides",
    title: "Centre-Val de Loire — Aides régionales",
    summary:
      "Portail régional Centre-Val de Loire : aides économiques, jeunesse, environnement, culture, agriculture, formation.",
    themes: ["Territoires", "Innovation"],
    maxAmountEur: 200000,
  },
  {
    region: "Centre-Val de Loire",
    regionCode: "FR-CVL",
    url: "https://www.centre-valdeloire.fr/aides-festivals",
    title: "Centre-Val de Loire — Aide aux festivals",
    summary:
      "Soutien régional aux festivals du Centre-Val de Loire (musique, livre, cinéma).",
    themes: ["Culture", "Événementiel"],
    maxAmountEur: 40000,
  },
  {
    region: "Centre-Val de Loire",
    regionCode: "FR-CVL",
    url: "https://www.centre-valdeloire.fr/cooperation-decentralisee",
    title: "Centre-Val de Loire — Coopération décentralisée",
    summary:
      "Aide aux projets de coopération internationale portés par les associations régionales.",
    themes: ["Solidarité internationale", "Développement"],
    maxAmountEur: 25000,
  },

  // ─── CORSE ────────────────────────────────────────────────────────
  {
    region: "Corse",
    regionCode: "FR-COR",
    url: "https://www.isula.corsica/aides",
    title: "Corse — Collectivité de Corse, aides régionales",
    summary:
      "Aides de la Collectivité de Corse : agriculture, culture, langue corse, environnement, jeunesse, économie.",
    themes: ["Territoires", "Culture"],
    maxAmountEur: 100000,
  },
  {
    region: "Corse",
    regionCode: "FR-COR",
    url: "https://www.isula.corsica/aap-cinema-audiovisuel",
    title: "Corse — Aide au cinéma et audiovisuel",
    summary:
      "Fonds régional Corse pour la production cinématographique et audiovisuelle.",
    themes: ["Culture", "Cinéma"],
    maxAmountEur: 200000,
  },

  // ─── DROM (Outre-mer) ─────────────────────────────────────────────
  {
    region: "Guadeloupe",
    regionCode: "FR-GP",
    url: "https://www.regionguadeloupe.fr/se-developper/les-aides-de-la-region/",
    title: "Guadeloupe — Aides régionales",
    summary:
      "Portail des aides de la Région Guadeloupe : entreprises, formation, jeunesse, culture, environnement, agriculture.",
    themes: ["Territoires", "Outre-mer"],
    maxAmountEur: 100000,
  },
  {
    region: "Martinique",
    regionCode: "FR-MQ",
    url: "https://www.collectivitedemartinique.mq/les-aides/",
    title: "Martinique — Aides de la Collectivité",
    summary:
      "Aides de la Collectivité Territoriale de Martinique : entreprises, agriculture, mer, formation, culture, jeunesse.",
    themes: ["Territoires", "Outre-mer"],
    maxAmountEur: 100000,
  },
  {
    region: "Guyane",
    regionCode: "FR-GF",
    url: "https://www.ctguyane.fr/aides/",
    title: "Guyane — Aides de la Collectivité Territoriale",
    summary:
      "Aides de la Collectivité Territoriale de Guyane : entreprises, agriculture, formation, culture, environnement.",
    themes: ["Territoires", "Outre-mer"],
    maxAmountEur: 100000,
  },
  {
    region: "La Réunion",
    regionCode: "FR-RE",
    url: "https://regionreunion.com/aides-et-services/",
    title: "La Réunion — Aides régionales",
    summary:
      "Portail des aides de la Région Réunion : entreprises, agriculture, formation, jeunesse, culture, environnement, mobilité internationale.",
    themes: ["Territoires", "Outre-mer"],
    maxAmountEur: 100000,
  },
  {
    region: "Mayotte",
    regionCode: "FR-YT",
    url: "https://www.cg976.fr/les-aides/",
    title: "Mayotte — Aides du Département",
    summary:
      "Aides du Département de Mayotte : agriculture, formation, jeunesse, social, culture.",
    themes: ["Territoires", "Outre-mer"],
    maxAmountEur: 50000,
  },
];

export async function fetchRegionPrograms(): Promise<RegionProgram[]> {
  console.log(`[Conseils Régionaux] ${REGION_PROGRAMS.length} programmes curés`);
  return REGION_PROGRAMS;
}

export function transformRegionToGrant(p: RegionProgram) {
  return {
    sourceUrl: p.url,
    sourceName: "Conseils Régionaux",
    title: p.title,
    summary: p.summary,
    rawContent: p.summary,
    funder: `Région ${p.region}`,
    country: "FR",
    thematicAreas: p.themes,
    eligibleEntities: p.eligibleEntities ?? ["association", "collectivite", "entreprise"],
    eligibleCountries: ["FR"],
    minAmountEur: p.minAmountEur ?? 5000,
    maxAmountEur: p.maxAmountEur ?? 100000,
    coFinancingRequired: true,
    deadline: null,
    grantType: "subvention",
    language: "fr",
    status: "active",
    aiSummary: null,
  };
}
