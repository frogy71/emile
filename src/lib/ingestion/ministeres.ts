/**
 * AAP Ministériels — appels à projets des ministères et opérateurs d'État.
 *
 * Couvre les principaux ministères français qui financent des associations
 * et collectivités, hors ADEME / FDVA / ANS / Aides-Territoires (déjà
 * intégrés via leurs propres sources).
 *
 * Cibles principales :
 *  - Ministère de la Culture (DRAC) : patrimoine, spectacle vivant, livre, médias
 *  - Ministère de la Transition Écologique : biodiversité, eau, climat
 *  - INJEP / Jeunesse et Sports : engagement, éducation populaire
 *  - MEAE : coopération internationale, francophonie
 *  - Ministère de l'Intérieur (BOP 161) : sécurité civile, lutte contre les violences
 *  - Ministère de la Cohésion des territoires : ruralité, ANCT, Petites villes de demain
 *  - Ministère du Travail : insertion, IAE
 */

export interface MinisterialProgram {
  url: string;
  title: string;
  summary: string;
  themes: string[];
  funder: string;
  eligibleEntities?: string[];
  minAmountEur?: number | null;
  maxAmountEur?: number | null;
}

const MINISTERIAL_PROGRAMS: MinisterialProgram[] = [
  // ─── MINISTÈRE DE LA CULTURE ─────────────────────────────────────
  {
    url: "https://www.culture.gouv.fr/Aides-demarches",
    title: "Ministère de la Culture — Portail des aides",
    summary:
      "Plateforme officielle des aides du ministère de la Culture. Recense les dispositifs nationaux et déconcentrés (DRAC) pour le patrimoine, la création, la diffusion, le livre, le cinéma, les médias.",
    themes: ["Culture", "Patrimoine", "Arts"],
    funder: "Ministère de la Culture",
    eligibleEntities: ["association", "collectivite", "entreprise"],
    maxAmountEur: 200000,
  },
  {
    url: "https://www.culture.gouv.fr/Aides-demarches/Appels-a-projets-candidatures-concours",
    title: "Ministère de la Culture — Appels à projets nationaux",
    summary:
      "Liste mise à jour des AAP nationaux du ministère : médiation, démocratisation, éducation artistique, culture & santé, culture & justice, culture en zones rurales.",
    themes: ["Culture", "Médiation"],
    funder: "Ministère de la Culture",
    maxAmountEur: 100000,
  },
  {
    url: "https://www.culture.gouv.fr/Thematiques/Patrimoines/Sites-archeologiques/Carte-archeologique-nationale-et-aides-financieres",
    title: "Culture — Aides à l'archéologie préventive et programmée",
    summary:
      "Subventions du Ministère de la Culture aux associations, collectivités et chantiers d'archéologie pour des opérations de fouilles, valorisation et publication.",
    themes: ["Culture", "Patrimoine", "Recherche"],
    funder: "Ministère de la Culture (DRAC)",
    maxAmountEur: 80000,
  },
  {
    url: "https://www.culture.gouv.fr/Thematiques/Spectacle-vivant/Aides-aux-acteurs-du-spectacle-vivant",
    title: "Culture — Aides au spectacle vivant",
    summary:
      "Aides du ministère de la Culture aux compagnies, lieux et festivals de spectacle vivant : conventionnement, aide à la création, à la résidence, à la diffusion.",
    themes: ["Culture", "Spectacle vivant"],
    funder: "Ministère de la Culture (DRAC)",
    eligibleEntities: ["association", "compagnie"],
    maxAmountEur: 200000,
  },
  {
    url: "https://www.culture.gouv.fr/Thematiques/Livre-et-lecture/Economie-du-livre/Aides-economiques-aux-acteurs-du-livre",
    title: "Culture — Aides aux acteurs du livre (CNL)",
    summary:
      "Subventions du Centre National du Livre (sous tutelle du ministère) aux librairies indépendantes, éditeurs, auteurs, manifestations littéraires, traduction.",
    themes: ["Culture", "Livre", "Édition"],
    funder: "Centre National du Livre (CNL)",
    maxAmountEur: 50000,
  },
  {
    url: "https://www.cnc.fr/professionnels/aides-et-financements",
    title: "Culture — Aides du CNC (cinéma & audiovisuel)",
    summary:
      "Aides du Centre National du Cinéma : production cinématographique, audiovisuelle, jeux vidéo, distribution, exploitation, exportation. Plus de 100 dispositifs.",
    themes: ["Culture", "Cinéma", "Audiovisuel", "Jeux vidéo"],
    funder: "CNC",
    maxAmountEur: 1000000,
  },
  {
    url: "https://www.culture.gouv.fr/Thematiques/Musique/Aides-aux-acteurs-de-la-musique",
    title: "Culture — Aides aux acteurs de la musique (CNM)",
    summary:
      "Subventions du Centre National de la Musique (CNM) aux producteurs, salles, festivals, labels, éditeurs et entreprises de la musique.",
    themes: ["Culture", "Musique"],
    funder: "Centre National de la Musique",
    maxAmountEur: 200000,
  },
  {
    url: "https://www.culture.gouv.fr/Thematiques/Education-artistique-et-culturelle",
    title: "Culture — Éducation artistique et culturelle (EAC)",
    summary:
      "Programme partagé entre Culture et Éducation Nationale. Soutien aux résidences d'artistes en milieu scolaire, projets EAC, parcours culturels.",
    themes: ["Culture", "Éducation"],
    funder: "Ministère de la Culture",
    maxAmountEur: 50000,
  },
  {
    url: "https://www.culture.gouv.fr/Thematiques/Demarche-d-Innovation-de-recherche/Aides-financieres",
    title: "Culture — Aide à la médiation, démocratisation, action culturelle",
    summary:
      "Soutien aux projets favorisant l'accès à la culture pour les publics éloignés (zones rurales, quartiers prioritaires, public empêché : santé, justice, handicap).",
    themes: ["Culture", "Inclusion", "Médiation"],
    funder: "Ministère de la Culture (DRAC)",
    maxAmountEur: 30000,
  },
  {
    url: "https://www.culture.gouv.fr/Thematiques/Langue-francaise-et-langues-de-France/Politiques-de-la-langue/Maitrise-de-la-langue-francaise/Action-culture-et-langue-francaise",
    title: "Culture — Action Culture et Langue Française",
    summary:
      "Soutien aux projets associatifs de maîtrise du français, ateliers sociolinguistiques, lutte contre l'illettrisme par la culture.",
    themes: ["Culture", "Éducation", "Inclusion"],
    funder: "Délégation à la langue française (DGLFLF)",
    maxAmountEur: 15000,
  },

  // ─── MINISTÈRE DE LA TRANSITION ÉCOLOGIQUE ───────────────────────
  {
    url: "https://www.ecologie.gouv.fr/aides-et-subventions",
    title: "Ministère de la Transition Écologique — Aides & subventions",
    summary:
      "Portail recensant les aides du ministère : Fonds Vert, OFB, agences de l'eau, Cerema, Bureau de l'eau, biodiversité, énergie.",
    themes: ["Environnement", "Climat", "Biodiversité"],
    funder: "Ministère de la Transition Écologique",
    maxAmountEur: 500000,
  },
  {
    url: "https://www.ecologie.gouv.fr/fonds-dacceleration-transition-ecologique-territoires-fonds-vert",
    title: "Fonds Vert — Accélération de la transition écologique",
    summary:
      "Fonds national (2 Md€/an) pour les collectivités : rénovation des bâtiments publics, friches, biodiversité, mobilités, prévention des risques. 14 mesures.",
    themes: ["Environnement", "Énergie", "Climat"],
    funder: "État (Fonds Vert)",
    eligibleEntities: ["collectivite"],
    maxAmountEur: 5000000,
  },
  {
    url: "https://www.ofb.gouv.fr/aides-et-appels-projets",
    title: "OFB — Aides et appels à projets biodiversité",
    summary:
      "Office Français de la Biodiversité : appels à projets biodiversité, atlas, restauration des milieux, gestion d'espaces, sciences participatives.",
    themes: ["Environnement", "Biodiversité"],
    funder: "Office Français de la Biodiversité (OFB)",
    maxAmountEur: 200000,
  },
  {
    url: "https://aides-redevances.eaufrance.fr/",
    title: "Agences de l'eau — Aides aux projets aquatiques",
    summary:
      "Les 6 agences de l'eau (Loire-Bretagne, Seine-Normandie, etc.) financent les projets de qualité de l'eau, gestion des milieux aquatiques, lutte contre les pollutions.",
    themes: ["Environnement", "Eau"],
    funder: "Agences de l'eau",
    maxAmountEur: 1000000,
  },
  {
    url: "https://www.ecologie.gouv.fr/dispositif/territoires-engages-pour-nature",
    title: "MTE — Territoires Engagés pour la Nature",
    summary:
      "Reconnaissance et accompagnement des collectivités s'engageant en faveur de la biodiversité. Animation par les Régions et l'OFB.",
    themes: ["Environnement", "Biodiversité"],
    funder: "OFB / Régions",
    eligibleEntities: ["collectivite"],
    maxAmountEur: 100000,
  },
  {
    url: "https://www.ecologie.gouv.fr/aap-engages-pour-quartier",
    title: "MTE — Quartiers résilients / Engagés pour la nature",
    summary:
      "Appel à projets renaturation et adaptation climatique des quartiers prioritaires. Cible villes, bailleurs sociaux et associations.",
    themes: ["Environnement", "Logement", "Inclusion"],
    funder: "Ministère de la Transition Écologique",
    maxAmountEur: 200000,
  },

  // ─── INJEP / JEUNESSE / ENGAGEMENT ───────────────────────────────
  {
    url: "https://injep.fr/financements-experimentations-jeunesse/",
    title: "INJEP — Fonds d'Expérimentation pour la Jeunesse (FEJ)",
    summary:
      "Fonds piloté par l'INJEP pour expérimenter des dispositifs innovants en faveur des jeunes (éducation, insertion, engagement, santé). AAP nationaux récurrents.",
    themes: ["Jeunesse", "Éducation", "Innovation sociale"],
    funder: "INJEP",
    maxAmountEur: 200000,
  },
  {
    url: "https://www.service-civique.gouv.fr/page/devenez-organisme-d-accueil",
    title: "Service Civique — Agrément organisme d'accueil",
    summary:
      "Accueil de jeunes en mission de Service Civique (8 mois, indemnités prises en charge par l'État). Accessible aux associations, collectivités, services publics.",
    themes: ["Jeunesse", "Engagement"],
    funder: "Agence du Service Civique",
    eligibleEntities: ["association", "collectivite"],
    maxAmountEur: null,
  },
  {
    url: "https://www.jeunes.gouv.fr/eduquer-former-orienter-engager",
    title: "Jeunesse — Programmes d'éducation populaire et engagement",
    summary:
      "Soutien du ministère chargé de la Jeunesse aux structures d'éducation populaire (mouvements de jeunesse, colos apprenantes, séjours engagés, BAFA).",
    themes: ["Jeunesse", "Éducation"],
    funder: "Ministère chargé de la Jeunesse",
    eligibleEntities: ["association"],
    maxAmountEur: 50000,
  },
  {
    url: "https://www.jeunes.gouv.fr/colos-apprenantes-2",
    title: "Jeunesse — Colos apprenantes",
    summary:
      "Aide aux organisateurs de séjours de vacances proposant un projet pédagogique renforcé pour des jeunes prioritaires (QPV, ZRR, enfants protégés).",
    themes: ["Jeunesse", "Éducation"],
    funder: "Ministère chargé de la Jeunesse",
    maxAmountEur: 80000,
  },
  {
    url: "https://injep.fr/erasmus-jeunesse-sport/",
    title: "INJEP — Erasmus+ Jeunesse et Sport (Agence française)",
    summary:
      "L'Agence Erasmus+ France Jeunesse & Sport (INJEP) co-finance les projets de mobilité, échanges, volontariat européen, partenariats jeunesse et sport.",
    themes: ["Jeunesse", "International", "Sport"],
    funder: "Agence Erasmus+ France Jeunesse & Sport",
    maxAmountEur: 100000,
  },

  // ─── MEAE — COOPÉRATION INTERNATIONALE ───────────────────────────
  {
    url: "https://www.diplomatie.gouv.fr/fr/politique-etrangere-de-la-france/aide-au-developpement/dispositifs-pour-les-acteurs-de-la-cooperation/",
    title: "MEAE — Dispositifs pour les acteurs de la coopération",
    summary:
      "Portail du Ministère de l'Europe et des Affaires Étrangères : FSPI, dispositif des appels à initiatives, soutien aux ONG, partenariat avec les collectivités.",
    themes: ["Solidarité internationale", "Développement", "Coopération"],
    funder: "MEAE",
    maxAmountEur: 500000,
  },
  {
    url: "https://www.diplomatie.gouv.fr/fr/politique-etrangere-de-la-france/aide-au-developpement/dispositifs-pour-les-acteurs-de-la-cooperation/le-fonds-de-solidarite-pour-les-projets-innovants-fspi/",
    title: "MEAE — FSPI (Fonds Solidarité Projets Innovants)",
    summary:
      "Fonds géré par les ambassades de France pour financer des projets innovants à fort impact dans les pays partenaires. Cible : société civile locale, ONG, associations françaises.",
    themes: ["Solidarité internationale", "Développement", "Innovation sociale"],
    funder: "MEAE",
    maxAmountEur: 100000,
  },
  {
    url: "https://www.diplomatie.gouv.fr/fr/politique-etrangere-de-la-france/francophonie-et-langue-francaise/le-fonds-equipe-france/",
    title: "MEAE — Fonds Équipe France",
    summary:
      "Fonds bilatéral piloté par les ambassades pour soutenir des projets concrets de coopération (éducation, santé, gouvernance) en complément du FSPI.",
    themes: ["Solidarité internationale", "Coopération"],
    funder: "MEAE",
    maxAmountEur: 200000,
  },
  {
    url: "https://www.diplomatie.gouv.fr/fr/photos-videos-publications-infographies/publications/enjeux-planetaires-cooperation-internationale/le-soutien-aux-organisations-de-la-societe-civile/article/le-cofinancement-des-projets-des-ong",
    title: "MEAE — Cofinancement des projets ONG (via AFD)",
    summary:
      "Dispositif du MEAE de cofinancement des projets de développement portés par les ONG françaises, géré par la division OSC de l'AFD.",
    themes: ["Solidarité internationale", "Développement"],
    funder: "MEAE / AFD",
    eligibleEntities: ["association", "ong"],
    maxAmountEur: 1500000,
  },
  {
    url: "https://www.france-volontaires.org/financements/",
    title: "MEAE — France Volontaires (engagement international)",
    summary:
      "Plateforme nationale du volontariat international (VSI, VECI). Cofinancement des missions de volontaires d'associations françaises à l'étranger.",
    themes: ["Solidarité internationale", "Engagement", "Jeunesse"],
    funder: "France Volontaires",
    maxAmountEur: 30000,
  },
  {
    url: "https://www.francophonie.org/appels-projets",
    title: "OIF — Appels à projets francophonie",
    summary:
      "Organisation Internationale de la Francophonie : appels à projets sur la langue française, l'éducation, la culture, la jeunesse, le numérique dans les pays francophones.",
    themes: ["Culture", "Éducation", "Francophonie"],
    funder: "OIF",
    maxAmountEur: 100000,
  },
  {
    url: "https://www.diplomatie.gouv.fr/fr/dossiers-pays/europe/",
    title: "MEAE — Soutien aux acteurs européens et bilatéraux",
    summary:
      "Soutien du MEAE aux projets associatifs portant sur la coopération bilatérale européenne, la mémoire, l'amitié entre les peuples et les actions de société civile vers les pays voisins de l'UE.",
    themes: ["Europe", "Coopération", "Mémoire"],
    funder: "MEAE",
    eligibleEntities: ["association", "ong"],
    maxAmountEur: 100000,
  },
  {
    url: "https://www.diplomatie.gouv.fr/fr/politique-etrangere-de-la-france/diplomatie-feministe/",
    title: "MEAE — Diplomatie féministe & droits des femmes",
    summary:
      "Appels à projets du MEAE pour soutenir les organisations engagées sur les droits des femmes, l'égalité de genre et la lutte contre les violences sexistes à l'international.",
    themes: ["Droits humains", "Égalité", "Solidarité internationale"],
    funder: "MEAE",
    eligibleEntities: ["association", "ong"],
    maxAmountEur: 200000,
  },
  {
    url: "https://www.diplomatie.gouv.fr/fr/politique-etrangere-de-la-france/aide-au-developpement/dispositifs-pour-les-acteurs-de-la-cooperation/le-soutien-aux-collectivites-territoriales-engagees-dans-la-cooperation-decentralisee/",
    title: "MEAE — DCTIV / Coopération décentralisée des collectivités",
    summary:
      "Appels à projets de la DCTIV (Direction de la Coopération et de la Transformation Interministérielle Verte / délégation pour l'action extérieure des collectivités territoriales) pour cofinancer les projets de coopération décentralisée des collectivités françaises avec leurs partenaires étrangers.",
    themes: ["Coopération", "Solidarité internationale", "Transition écologique"],
    funder: "MEAE — DCTIV / DAECT",
    eligibleEntities: ["collectivite", "association"],
    maxAmountEur: 200000,
  },
  {
    url: "https://www.diplomatie.gouv.fr/fr/politique-etrangere-de-la-france/aide-au-developpement/dispositifs-pour-les-acteurs-de-la-cooperation/transition-ecologique-et-climat/",
    title: "MEAE — DCTIV : Transition écologique et climat",
    summary:
      "Volet « Transformation interministérielle verte » de la DCTIV : cofinancement des projets de coopération internationale des collectivités sur le climat, la biodiversité, l'eau et la transition énergétique.",
    themes: ["Environnement", "Climat", "Coopération"],
    funder: "MEAE — DCTIV",
    eligibleEntities: ["collectivite", "association", "ong"],
    maxAmountEur: 300000,
  },

  // ─── MINISTÈRE DE L'INTÉRIEUR / JUSTICE ─────────────────────────
  {
    url: "https://www.interieur.gouv.fr/le-ministere/lutte-contre-les-discriminations",
    title: "Intérieur — Aides aux associations de lutte contre les discriminations",
    summary:
      "Subventions du ministère de l'Intérieur (et délégations interministérielles DILCRAH) aux associations de lutte contre le racisme, l'antisémitisme, la haine anti-LGBT.",
    themes: ["Droits humains", "Égalité", "Antiracisme"],
    funder: "Ministère de l'Intérieur (DILCRAH)",
    eligibleEntities: ["association"],
    maxAmountEur: 50000,
  },
  {
    url: "https://www.interieur.gouv.fr/Le-ministere/Securite-civile/Documentation-technique/Aides-financieres",
    title: "Intérieur — Aides à la sécurité civile",
    summary:
      "Subventions aux associations de sécurité civile (Croix-Rouge, secouristes, agréés sécurité civile) pour formations et matériel.",
    themes: ["Sécurité", "Solidarité"],
    funder: "Ministère de l'Intérieur",
    eligibleEntities: ["association"],
    maxAmountEur: 30000,
  },
  {
    url: "https://www.interieur.gouv.fr/le-ministere/aide-aux-victimes",
    title: "Intérieur — Aide aux victimes (FIPDR)",
    summary:
      "Fonds Interministériel de Prévention de la Délinquance et de la Radicalisation (FIPDR) : subventions aux associations d'aide aux victimes, prévention et médiation.",
    themes: ["Sécurité", "Aide aux victimes", "Prévention"],
    funder: "Ministère de l'Intérieur (FIPDR)",
    maxAmountEur: 100000,
  },
  {
    url: "https://www.justice.gouv.fr/justice/parcours-d-acces-aux-aides-financieres",
    title: "Justice — Aides aux associations partenaires",
    summary:
      "Le ministère de la Justice subventionne les associations d'accès au droit, médiation, contrôle judiciaire socio-éducatif, aide aux victimes, accompagnement post-carcéral.",
    themes: ["Droit", "Justice", "Solidarité"],
    funder: "Ministère de la Justice",
    eligibleEntities: ["association"],
    maxAmountEur: 80000,
  },
  {
    url: "https://www.egalite-femmes-hommes.gouv.fr/financements",
    title: "MIPROF / SDFE — Aides pour l'égalité femmes-hommes",
    summary:
      "Aides du Service des Droits des Femmes et de l'Égalité (SDFE) : subventions aux associations luttant contre les violences faites aux femmes et pour l'égalité.",
    themes: ["Égalité", "Femmes", "Droits humains"],
    funder: "Ministère chargé de l'Égalité (SDFE)",
    eligibleEntities: ["association"],
    maxAmountEur: 50000,
  },

  // ─── COHÉSION DES TERRITOIRES / ANCT ─────────────────────────────
  {
    url: "https://agence-cohesion-territoires.gouv.fr/aides-financieres",
    title: "ANCT — Agence Nationale de la Cohésion des Territoires",
    summary:
      "Agence opérationnelle pilotant les programmes Action Cœur de Ville, Petites Villes de Demain, Territoires d'Industrie, France Services, France Ruralités.",
    themes: ["Territoires", "Aménagement", "Ruralité"],
    funder: "ANCT",
    eligibleEntities: ["collectivite", "association"],
    maxAmountEur: 500000,
  },
  {
    url: "https://agence-cohesion-territoires.gouv.fr/petites-villes-de-demain-45",
    title: "ANCT — Petites Villes de Demain",
    summary:
      "Programme national d'accompagnement des petites villes de moins de 20 000 habitants : revitalisation, ingénierie, financement de projets.",
    themes: ["Territoires", "Ruralité"],
    funder: "ANCT",
    eligibleEntities: ["collectivite"],
    maxAmountEur: 500000,
  },
  {
    url: "https://agence-cohesion-territoires.gouv.fr/action-coeur-de-ville",
    title: "ANCT — Action Cœur de Ville",
    summary:
      "Programme de revitalisation des centres-villes (245 villes moyennes). Subventions et accompagnement ingénierie sur 5 axes : habitat, commerce, mobilité, accès aux services, patrimoine.",
    themes: ["Territoires", "Logement", "Commerce"],
    funder: "ANCT",
    eligibleEntities: ["collectivite"],
    maxAmountEur: 1000000,
  },
  {
    url: "https://agence-cohesion-territoires.gouv.fr/france-ruralites",
    title: "ANCT — France Ruralités",
    summary:
      "Plan d'actions pour les territoires ruraux : Villages d'Avenir, Volontariat Territorial en Administration, Fabriques de Territoire.",
    themes: ["Territoires", "Ruralité"],
    funder: "ANCT",
    eligibleEntities: ["collectivite", "association"],
    maxAmountEur: 200000,
  },
  {
    url: "https://www.cohesion-territoires.gouv.fr/quartiers",
    title: "Politique de la Ville — Subventions ANCT (CGET)",
    summary:
      "Aides aux associations et porteurs de projets dans les Quartiers Prioritaires de la Politique de la Ville (QPV) : éducation, emploi, santé, lien social.",
    themes: ["Politique de la ville", "Inclusion", "Solidarité"],
    funder: "ANCT (Politique de la Ville)",
    eligibleEntities: ["association"],
    maxAmountEur: 50000,
  },
  {
    url: "https://agence-cohesion-territoires.gouv.fr/conseillers-numeriques-france-services-477",
    title: "ANCT — Conseillers Numériques France Services",
    summary:
      "Cofinancement État pour le recrutement et la formation de Conseillers Numériques (forfait jusqu'à 50 000 €/poste sur 2 ans). Cible structures d'inclusion numérique.",
    themes: ["Numérique", "Inclusion"],
    funder: "ANCT",
    eligibleEntities: ["association", "collectivite"],
    maxAmountEur: 50000,
  },

  // ─── TRAVAIL / EMPLOI / IAE ──────────────────────────────────────
  {
    url: "https://travail-emploi.gouv.fr/aides-financieres-et-mesures-pour-l-emploi",
    title: "Travail — Aides financières pour l'emploi",
    summary:
      "Portail des aides du ministère du Travail : Parcours Emploi Compétences, Aide au Poste IAE, Contrat d'Engagement Jeune, AFEST, FNE-Formation.",
    themes: ["Emploi", "Insertion", "Formation"],
    funder: "Ministère du Travail",
    maxAmountEur: 100000,
  },
  {
    url: "https://www.economie.gouv.fr/dge/aides-financieres-aux-acteurs-de-leconomie-sociale-et-solidaire-ess",
    title: "ESS — Aides aux acteurs de l'économie sociale et solidaire",
    summary:
      "Dispositifs Avise / DGE / France Active pour les structures de l'ESS : DLA, Pacte d'Émergence, prêts d'honneur, garantie.",
    themes: ["ESS", "Insertion"],
    funder: "DGE / Avise / France Active",
    maxAmountEur: 100000,
  },
  {
    url: "https://www.avise.org/financements",
    title: "Avise — Financements de l'innovation sociale",
    summary:
      "Plateforme de financement de l'innovation sociale : Fonds d'Innovation Sociale BPI, dispositifs ESS, accompagnement pluriannuel.",
    themes: ["Innovation sociale", "ESS"],
    funder: "Avise",
    maxAmountEur: 200000,
  },
  {
    url: "https://www.federation-iae.fr/aides-financieres/",
    title: "Travail — Aide au poste IAE",
    summary:
      "Aide forfaitaire de l'État aux Structures d'Insertion par l'Activité Économique (ACI, EI, AI, ETTI). Modulation socle + complément.",
    themes: ["Insertion", "Emploi", "ESS"],
    funder: "Ministère du Travail (DDETS)",
    eligibleEntities: ["association", "entreprise"],
    maxAmountEur: 500000,
  },

  // ─── COHÉSION SOCIALE / SANTÉ / SOLIDARITÉS ──────────────────────
  {
    url: "https://solidarites.gouv.fr/aides-financieres",
    title: "Solidarités — Aides aux associations",
    summary:
      "Aides du ministère des Solidarités aux associations : aide alimentaire, lutte contre la pauvreté, hébergement d'urgence, protection de l'enfance, accompagnement des personnes âgées.",
    themes: ["Solidarité", "Précarité", "Santé"],
    funder: "Ministère des Solidarités",
    eligibleEntities: ["association"],
    maxAmountEur: 200000,
  },
  {
    url: "https://solidarites-sante.gouv.fr/affaires-sociales/lutte-contre-l-exclusion",
    title: "Solidarités — Plan de lutte contre la pauvreté",
    summary:
      "Stratégie nationale de prévention et de lutte contre la pauvreté. Subventions aux associations de l'accompagnement social, accès aux droits, alimentation.",
    themes: ["Solidarité", "Précarité"],
    funder: "Ministère des Solidarités",
    eligibleEntities: ["association"],
    maxAmountEur: 100000,
  },
  {
    url: "https://www.cnsa.fr/financements",
    title: "CNSA — Caisse Nationale de Solidarité pour l'Autonomie",
    summary:
      "Financement des établissements et services médico-sociaux pour personnes âgées et personnes handicapées. AAP innovation, conférences des financeurs, transformation de l'offre.",
    themes: ["Santé", "Handicap", "Vieillissement"],
    funder: "CNSA",
    maxAmountEur: 500000,
  },
  {
    url: "https://www.santepubliquefrance.fr/appels-a-projets-et-marches-publics",
    title: "Santé — Appels à projets Santé Publique France",
    summary:
      "Subventions de Santé Publique France aux associations et chercheurs sur la prévention, la promotion de la santé, la santé environnementale, les addictions.",
    themes: ["Santé", "Prévention"],
    funder: "Santé Publique France",
    maxAmountEur: 200000,
  },
  {
    url: "https://www.fondation-recherche-medicale.fr/nos-programmes",
    title: "Recherche — Fondation pour la Recherche Médicale (FRM)",
    summary:
      "FRM (RUP) : appels à projets pour le financement de la recherche biomédicale (postes de chercheur, équipements, jeunes chercheurs, projets thématiques).",
    themes: ["Recherche", "Santé"],
    funder: "Fondation pour la Recherche Médicale",
    maxAmountEur: 500000,
  },

  // ─── AGRICULTURE / RURALITÉ ──────────────────────────────────────
  {
    url: "https://agriculture.gouv.fr/aides-et-soutiens-1",
    title: "Agriculture — Aides du ministère",
    summary:
      "Portail des aides du Ministère de l'Agriculture : France Relance volet agricole, plantation de haies, structuration des filières, alimentation de proximité.",
    themes: ["Agriculture", "Alimentation", "Ruralité"],
    funder: "Ministère de l'Agriculture",
    maxAmountEur: 500000,
  },
  {
    url: "https://www.franceagrimer.fr/aides",
    title: "Agriculture — FranceAgriMer (aides aux filières)",
    summary:
      "Aides nationales aux filières agricoles, agroalimentaires, pêche et aquaculture : modernisation, structuration, promotion, exportation.",
    themes: ["Agriculture", "Pêche", "Alimentation"],
    funder: "FranceAgriMer",
    maxAmountEur: 1000000,
  },
  {
    url: "https://agriculture.gouv.fr/le-programme-national-pour-lalimentation-pna",
    title: "Agriculture — Programme National pour l'Alimentation (PNA)",
    summary:
      "AAP national pour les Projets Alimentaires Territoriaux (PAT), justice alimentaire, éducation à l'alimentation et à la lutte contre le gaspillage.",
    themes: ["Alimentation", "Agriculture", "Solidarité"],
    funder: "Ministère de l'Agriculture",
    maxAmountEur: 100000,
  },

  // ─── ÉDUCATION NATIONALE / RECHERCHE ─────────────────────────────
  {
    url: "https://www.education.gouv.fr/appels-projets",
    title: "Éducation Nationale — Appels à projets",
    summary:
      "Appels à projets nationaux de l'Éducation Nationale : Cités Éducatives, Internats d'Excellence, Vacances Apprenantes, partenariats associatifs.",
    themes: ["Éducation"],
    funder: "Ministère de l'Éducation Nationale",
    maxAmountEur: 100000,
  },
  {
    url: "https://www.cite-educative.fr/",
    title: "Éducation — Cités Éducatives",
    summary:
      "Programme interministériel (Éducation, Ville) de coopération éducative dans les quartiers prioritaires. Subventions aux associations partenaires.",
    themes: ["Éducation", "Politique de la ville", "Jeunesse"],
    funder: "Ministère de l'Éducation Nationale / ANCT",
    eligibleEntities: ["association", "collectivite"],
    maxAmountEur: 100000,
  },
  {
    url: "https://anr.fr/fr/appels-a-projets/",
    title: "Recherche — Appels à projets ANR",
    summary:
      "Agence Nationale de la Recherche : 50+ AAP/an pour la recherche académique et partenariale (fondamentale, finalisée, internationale).",
    themes: ["Recherche", "Innovation"],
    funder: "ANR",
    eligibleEntities: ["recherche", "universite", "entreprise"],
    maxAmountEur: 1000000,
  },
];

export async function fetchMinisterialPrograms(): Promise<MinisterialProgram[]> {
  console.log(`[AAP Ministériels] ${MINISTERIAL_PROGRAMS.length} programmes curés`);
  return MINISTERIAL_PROGRAMS;
}

export function transformMinisterialToGrant(p: MinisterialProgram) {
  return {
    sourceUrl: p.url,
    sourceName: "AAP Ministériels",
    title: p.title,
    summary: p.summary,
    rawContent: p.summary,
    funder: p.funder,
    country: "FR",
    thematicAreas: p.themes,
    eligibleEntities: p.eligibleEntities ?? ["association", "collectivite"],
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
