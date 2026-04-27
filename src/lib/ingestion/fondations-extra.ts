/**
 * Additional curated funding sources — fondations & opérateurs spécialisés.
 *
 * Complète `fondations-curated.ts` (~245 fondations) avec :
 *  - Des fondations supplémentaires non encore listées (territoriales,
 *    thématiques, internationales avec antenne FR).
 *  - Des opérateurs publics ou parapublics qui distribuent des subventions
 *    et qui ne rentrent pas dans les autres sources (CNDS legacy, CGET,
 *    INCa, ANRS, Fondation Hôpitaux de Paris, etc.).
 *  - Des fondations européennes / philantropies internationales qui
 *    financent en France.
 *
 * URLs déduplicées par rapport à fondations-curated.ts (le moteur de
 * matching dédupe sur source_url, donc même un doublon ne briserait pas
 * l'ingestion ; on évite quand même par propreté).
 */

export interface ExtraFoundation {
  name: string;
  themes: string[];
  url: string;
  summary: string;
  funder?: string;
  maxAmount: number;
  eligibleEntities?: string[];
}

const EXTRA_FOUNDATIONS: ExtraFoundation[] = [
  // ─── FONDATIONS SCIENTIFIQUES & DE RECHERCHE (compléments) ───────
  {
    name: "INCa — Institut National du Cancer",
    themes: ["Santé", "Cancer", "Recherche"],
    url: "https://www.e-cancer.fr/Institut-national-du-cancer/Appels-a-projets",
    summary:
      "Agence sanitaire et scientifique d'expertise en cancérologie. AAP nationaux : recherche fondamentale, translationnelle, clinique, en sciences humaines et sociales.",
    maxAmount: 1500000,
  },
  {
    name: "ANRS / Maladies Infectieuses Émergentes",
    themes: ["Santé", "Recherche", "VIH"],
    url: "https://anrs.fr/fr/appels-projets/",
    summary:
      "Agence Nationale de Recherche sur le SIDA et les hépatites virales (devenue ANRS-MIE en 2021). AAP recherche sur VIH, hépatites, tuberculose, COVID-19, maladies infectieuses émergentes.",
    maxAmount: 500000,
  },
  {
    name: "Fondation pour la Recherche Médicale (FRM)",
    themes: ["Santé", "Recherche", "Médecine"],
    url: "https://www.frm.org/recherche-medicale/financements/appels-a-projets",
    summary:
      "Fondation reconnue d'utilité publique. AAP spécifiques sur de nombreuses pathologies (oncologie, cardiologie, neurologie, maladies rares). Postes de chercheurs, équipements.",
    maxAmount: 500000,
  },
  {
    name: "Fondation ARC pour la Recherche sur le Cancer",
    themes: ["Santé", "Cancer", "Recherche"],
    url: "https://www.fondation-arc.org/appels-projets-cancer",
    summary:
      "Fondation dédiée au financement de la recherche sur le cancer. AAP réguliers : projets émergents, programmes labellisés, immunothérapie, soutien aux jeunes chercheurs.",
    maxAmount: 1000000,
  },
  {
    name: "Fondation Vaincre Alzheimer",
    themes: ["Santé", "Alzheimer", "Recherche"],
    url: "https://www.vaincrealzheimer.org/notre-action-financement-recherche/",
    summary:
      "Fondation dédiée à la recherche sur la maladie d'Alzheimer. AAP soutenant la recherche fondamentale et translationnelle.",
    maxAmount: 200000,
  },
  {
    name: "Fondation France Parkinson",
    themes: ["Santé", "Parkinson", "Recherche"],
    url: "https://www.franceparkinson.fr/financer-la-recherche/",
    summary:
      "Association reconnue d'utilité publique finançant la recherche sur la maladie de Parkinson, ainsi que des projets d'aide aux malades.",
    maxAmount: 100000,
  },
  {
    name: "Fondation pour l'Audition",
    themes: ["Santé", "Handicap", "Recherche"],
    url: "https://www.fondationpourlaudition.org/financer-projets",
    summary:
      "Fondation Bettencourt Schueller dédiée à l'audition. AAP recherche, accessibilité, prévention de la surdité.",
    maxAmount: 200000,
  },
  {
    name: "Fondation Médéric Alzheimer",
    themes: ["Santé", "Vieillissement", "Recherche"],
    url: "https://www.fondation-mederic-alzheimer.org/appels-projets",
    summary:
      "Fondation reconnue d'utilité publique. AAP recherche en sciences humaines et sociales sur la maladie d'Alzheimer et l'accompagnement des malades.",
    maxAmount: 150000,
  },
  {
    name: "Fondation Maladies Neurologiques",
    themes: ["Santé", "Neurosciences", "Recherche"],
    url: "https://www.fondation-maladies-neurologiques.fr/",
    summary:
      "Soutient la recherche sur les maladies neurologiques rares (SLA, Huntington, ataxies). Subventions de recherche et bourses post-doctorales.",
    maxAmount: 100000,
  },
  {
    name: "Fondation Recherche Cardio-Vasculaire (FRCV)",
    themes: ["Santé", "Recherche", "Cardiologie"],
    url: "https://www.fondationcoeur.com/financer-la-recherche/",
    summary:
      "Soutient la recherche sur les maladies cardio-vasculaires. AAP annuels, prix de recherche, bourses jeunes chercheurs.",
    maxAmount: 100000,
  },
  {
    name: "Fondation Médecine Patrick de Brou de Laurière",
    themes: ["Santé", "Recherche"],
    url: "https://www.fondationdelaresistance.org/",
    summary:
      "Fondation médicale soutenant des projets de recherche clinique innovants en France.",
    maxAmount: 80000,
  },

  // ─── FONDATIONS HOSPITALIÈRES / PATIENTS ─────────────────────────
  {
    name: "Fondation Hôpitaux de Paris (Pièces Jaunes)",
    themes: ["Santé", "Hôpitaux", "Enfance"],
    url: "https://www.fondationhopitaux.fr/projets-soutenus/",
    summary:
      "Fondation présidée par Brigitte Macron. Soutient des projets dans les hôpitaux pour améliorer le quotidien des enfants, adolescents et personnes âgées hospitalisés.",
    maxAmount: 50000,
  },
  {
    name: "Fondation APHP — Assistance Publique Hôpitaux de Paris",
    themes: ["Santé", "Hôpitaux", "Recherche"],
    url: "https://www.fondation-aphp.fr/",
    summary:
      "Fondation hospitalière de l'AP-HP. Financement de la recherche, des soins innovants, de l'humanisation des hôpitaux parisiens.",
    maxAmount: 200000,
  },
  {
    name: "Institut Curie — Programmes & financements",
    themes: ["Santé", "Cancer", "Recherche"],
    url: "https://institut-curie.org/page/financer-recherche",
    summary:
      "Centre de référence du cancer. AAP nationaux et internationaux pour la recherche oncologique, bourses post-doc et chaires.",
    maxAmount: 500000,
  },
  {
    name: "Institut Pasteur — Bourses & financements",
    themes: ["Santé", "Recherche", "Microbiologie"],
    url: "https://www.pasteur.fr/fr/bourses-financements",
    summary:
      "Fondation reconnue d'utilité publique. Bourses, post-docs et financements de recherche en biologie médicale, vaccinologie, maladies infectieuses.",
    maxAmount: 500000,
  },

  // ─── FONDATIONS ÉDUCATION / FORMATION (compléments) ──────────────
  {
    name: "Fondation Égalité des Chances Polytechnique",
    themes: ["Éducation", "Égalité des chances", "Sciences"],
    url: "https://www.polytechnique.edu/fondation",
    summary:
      "Fondation de l'École Polytechnique. Bourses étudiantes, programme « Une Grande École, Pourquoi pas Moi ? » pour l'égalité des chances dans l'enseignement supérieur.",
    maxAmount: 100000,
  },
  {
    name: "Fondation HEC",
    themes: ["Éducation", "Égalité", "Entrepreneuriat"],
    url: "https://www.hec.edu/fr/fondation-hec",
    summary:
      "Fondation d'HEC Paris. Bourses sociales, programme Eclore, recherche, soutien aux étudiants entrepreneurs.",
    maxAmount: 80000,
  },
  {
    name: "Fondation MINES Paris",
    themes: ["Éducation", "Recherche", "Ingénierie"],
    url: "https://www.fondationmines-paris.org/",
    summary:
      "Fondation de Mines Paris - PSL. Bourses étudiants, chaires d'enseignement et de recherche, projets innovation.",
    maxAmount: 100000,
  },
  {
    name: "Fondation INSA Lyon",
    themes: ["Éducation", "Ingénierie", "Recherche"],
    url: "https://fondation.insa-lyon.fr/",
    summary:
      "Fondation de l'INSA Lyon. Soutien aux étudiants, chaires d'entreprise, projets pédagogiques innovants.",
    maxAmount: 50000,
  },
  {
    name: "Fondation Centrale Supélec",
    themes: ["Éducation", "Recherche", "Ingénierie"],
    url: "https://www.fondation-centralesupelec.fr/",
    summary:
      "Fondation de CentraleSupélec. Bourses, chaires d'entreprise, soutien à la recherche et à l'innovation.",
    maxAmount: 60000,
  },
  {
    name: "Fondation Mines Saint-Étienne",
    themes: ["Éducation", "Ingénierie", "Recherche"],
    url: "https://www.fondation.mines-stetienne.fr/",
    summary:
      "Fondation de Mines Saint-Étienne. Soutien à la recherche, à la formation et à l'entrepreneuriat.",
    maxAmount: 50000,
  },
  {
    name: "Fondation Institut Mines-Télécom",
    themes: ["Numérique", "Éducation", "Recherche"],
    url: "https://www.fondation-mines-telecom.org/",
    summary:
      "Fondation IMT. Soutien aux écoles d'ingénieur du groupe IMT (formation, recherche, chaires industrielles).",
    maxAmount: 100000,
  },
  {
    name: "Fondation Université de Paris",
    themes: ["Éducation", "Recherche"],
    url: "https://www.fondation.u-paris.fr/",
    summary:
      "Fondation Université Paris Cité. Bourses, chaires, soutien aux projets pédagogiques et à la recherche.",
    maxAmount: 80000,
  },
  {
    name: "Fondation Sciences Po",
    themes: ["Éducation", "Recherche", "Société"],
    url: "https://www.sciencespo.fr/fondation/",
    summary:
      "Fondation Sciences Po. Bourses sociales, programmes d'égalité, chaires de recherche, soutien à l'innovation pédagogique.",
    maxAmount: 80000,
  },
  {
    name: "Fondation Aix-Marseille Université",
    themes: ["Éducation", "Recherche"],
    url: "https://fondation.univ-amu.fr/",
    summary:
      "Fondation d'Aix-Marseille Université. Bourses, chaires, recherche, soutien aux étudiants en difficulté.",
    maxAmount: 50000,
  },
  {
    name: "Fondation Lyon 1",
    themes: ["Éducation", "Recherche", "Sciences"],
    url: "https://fondation.univ-lyon1.fr/",
    summary:
      "Fondation de l'Université Claude Bernard Lyon 1. Soutien à la recherche, aux étudiants, aux projets innovants.",
    maxAmount: 50000,
  },
  {
    name: "Fondation Université Toulouse III Paul Sabatier",
    themes: ["Éducation", "Recherche", "Sciences"],
    url: "https://www.univ-tlse3.fr/fondation",
    summary:
      "Fondation de l'Université Paul Sabatier (Toulouse). Soutien à la recherche, chaires, projets de formation innovants.",
    maxAmount: 50000,
  },

  // ─── PHILANTHROPIES INTERNATIONALES / EUROPÉENNES ────────────────
  {
    name: "Open Society Foundations (Europe)",
    themes: ["Droits humains", "Démocratie", "Justice"],
    url: "https://www.opensocietyfoundations.org/grants",
    summary:
      "Réseau philanthropique international (Soros). Soutient les associations actives sur les droits humains, la démocratie, la lutte contre les discriminations, en Europe et ailleurs.",
    maxAmount: 1000000,
  },
  {
    name: "European Climate Foundation (ECF)",
    themes: ["Climat", "Environnement", "Énergie"],
    url: "https://europeanclimate.org/our-grantmaking/",
    summary:
      "Philanthropie européenne dédiée à la transition climatique. Soutient les ONG, think-tanks et campagnes pour décarboner l'Europe.",
    maxAmount: 500000,
  },
  {
    name: "Charles Léopold Mayer pour le Progrès de l'Homme (FPH)",
    themes: ["Démocratie", "Société civile", "Transitions"],
    url: "https://www.fph.ch/programmes",
    summary:
      "Fondation suisse intervenant largement en France. Soutient les acteurs de la transition écologique, démocratique, sociale.",
    maxAmount: 100000,
  },
  {
    name: "Mott Foundation",
    themes: ["Société civile", "Démocratie", "Environnement"],
    url: "https://www.mott.org/grants/",
    summary:
      "Fondation philanthropique américaine soutenant la société civile en Europe (notamment l'Est) et dans les pays partenaires.",
    maxAmount: 500000,
  },
  {
    name: "Oak Foundation",
    themes: ["Droits humains", "Environnement", "Femmes"],
    url: "https://oakfnd.org/programmes/",
    summary:
      "Fondation philanthropique suisse. Programmes : violences faites aux femmes, environnement, justice internationale, enseignement spécialisé.",
    maxAmount: 1000000,
  },
  {
    name: "King Baudouin Foundation United States (KBFUS)",
    themes: ["Solidarité", "Philanthropie"],
    url: "https://kbfus.org/",
    summary:
      "Fondation Roi Baudouin USA : soutien et structuration de la philanthropie transatlantique. Subventions à des associations en France via fonds dédiés.",
    maxAmount: 500000,
  },
  {
    name: "Sigrid Rausing Trust",
    themes: ["Droits humains", "Démocratie", "Justice"],
    url: "https://www.sigrid-rausing-trust.org/Grants",
    summary:
      "Fondation philanthropique britannique. Soutient les organisations défendant les droits humains et la justice sociale en Europe et dans le monde.",
    maxAmount: 200000,
  },
  {
    name: "Robert Bosch Stiftung",
    themes: ["Éducation", "Société", "International"],
    url: "https://www.bosch-stiftung.de/en/funding-opportunities",
    summary:
      "Fondation allemande majeure. AAP en éducation, santé, société et international. Coopère avec des partenaires français.",
    maxAmount: 250000,
  },
  {
    name: "Fritt Ord Foundation",
    themes: ["Médias", "Liberté d'expression", "Démocratie"],
    url: "https://frittord.no/en/",
    summary:
      "Fondation norvégienne dédiée à la liberté d'expression et au journalisme. Subventions ouvertes aux médias et associations européennes.",
    maxAmount: 100000,
  },
  {
    name: "Fondation Hippocrène",
    themes: ["Jeunesse", "Europe", "International"],
    url: "https://www.fondationhippocrene.eu/aides-aux-projets/",
    summary:
      "Fondation française dédiée à la jeunesse européenne. Soutient les projets associatifs de mobilité européenne, citoyenneté et solidarité.",
    maxAmount: 30000,
  },
  {
    name: "Network of European Foundations (NEF)",
    themes: ["Société civile", "Démocratie", "Europe"],
    url: "https://www.nef-europe.org/",
    summary:
      "Réseau de fondations européennes (~40 membres). Plateforme de fonds collaboratifs : Civitates, EFT, Migration Fund, Refugees and Migrants.",
    maxAmount: 500000,
  },
  {
    name: "Civitates — Fund for Democracy and Solidarity in Europe",
    themes: ["Démocratie", "Médias", "Société civile"],
    url: "https://civitates-eu.org/grants/",
    summary:
      "Fonds philanthropique de NEF. Soutient le journalisme indépendant et la société civile dans 11 pays européens.",
    maxAmount: 500000,
  },

  // ─── FONDATIONS ENVIRONNEMENT / BIODIVERSITÉ (compléments) ───────
  {
    name: "Fondation pour la Nature et l'Homme (FNH)",
    themes: ["Environnement", "Biodiversité"],
    url: "https://www.fnh.org/programmes/appel-projets/",
    summary:
      "Fondation Nicolas Hulot. AAP « MyPositiveImpact » et programmes spécifiques (océan, agriculture, modes de vie).",
    maxAmount: 50000,
  },
  {
    name: "WWF France — Programme partenariats",
    themes: ["Environnement", "Biodiversité"],
    url: "https://www.wwf.fr/qui-nous-sommes/nos-partenaires",
    summary:
      "WWF France soutient ponctuellement des projets associatifs locaux en partenariat (préservation, sensibilisation, terrain).",
    maxAmount: 100000,
  },
  {
    name: "FNRPN — Fédération des Réserves Naturelles",
    themes: ["Environnement", "Biodiversité"],
    url: "https://www.reserves-naturelles.org/",
    summary:
      "Réseau des 357 réserves naturelles françaises. Co-financement de projets de gestion, restauration, sensibilisation, recherche.",
    maxAmount: 50000,
  },
  {
    name: "Fondation Le Pal Nature",
    themes: ["Environnement", "Biodiversité"],
    url: "https://lepalnaturefondation.com/",
    summary:
      "Fondation du parc Le PAL. Soutient des programmes de conservation des espèces menacées en France et à l'étranger.",
    maxAmount: 30000,
  },
  {
    name: "Fondation IRIS",
    themes: ["Environnement", "Biodiversité", "Mer"],
    url: "https://fondationiris.org/",
    summary:
      "Fondation IRIS (océans, biodiversité, jeunesse). Subventions à des associations et programmes éducatifs.",
    maxAmount: 50000,
  },
  {
    name: "Fondation Prince Albert II de Monaco — France",
    themes: ["Environnement", "Climat", "Biodiversité"],
    url: "https://www.fpa2.org/fr/projets",
    summary:
      "Fondation Prince Albert II : protection de l'environnement et développement durable. Trois priorités : climat, biodiversité, eau.",
    maxAmount: 200000,
  },

  // ─── FONDATIONS SOLIDARITÉ / EXCLUSION (compléments) ─────────────
  {
    name: "Fondation Le Refuge — LGBTQI+",
    themes: ["LGBT+", "Jeunesse", "Hébergement"],
    url: "https://www.le-refuge.org/nous-soutenir/partenaires/",
    summary:
      "Le Refuge accompagne et héberge les jeunes LGBT+ en rupture familiale. Partenariats et fonds dédiés pour des projets associatifs LGBT+.",
    maxAmount: 30000,
  },
  {
    name: "Fondation des Apprentis d'Auteuil — Jeunesse Espoir",
    themes: ["Jeunesse", "Insertion", "Précarité"],
    url: "https://www.apprentis-auteuil.org/qui-sommes-nous/notre-modele/notre-fondation/",
    summary:
      "Fondation des Apprentis d'Auteuil — protection de l'enfance et insertion. AAP nationaux pour les associations partenaires.",
    maxAmount: 80000,
  },
  {
    name: "Fondation Vincent de Paul",
    themes: ["Précarité", "Solidarité", "Sans-abri"],
    url: "https://www.fondationvincentdepaul.org/",
    summary:
      "Sous égide de la Fondation Notre-Dame. Soutient les actions auprès des plus démunis (alimentation, hébergement, accompagnement).",
    maxAmount: 30000,
  },
  {
    name: "Fondation Petits Frères des Pauvres",
    themes: ["Solidarité", "Vieillissement", "Isolement"],
    url: "https://www.petitsfreresdespauvres.fr/nous-soutenir/devenir-partenaire-/",
    summary:
      "Soutient l'isolement des personnes âgées. Partenariats associatifs pour des projets de lien social et d'accompagnement.",
    maxAmount: 50000,
  },
  {
    name: "Fondation Notre-Dame",
    themes: ["Solidarité", "Patrimoine", "Éducation"],
    url: "https://fondationnotredame.fr/",
    summary:
      "Fondation Notre-Dame (RUP) : abrite plus de 70 fondations sous égide. Solidarité, éducation, culture, communication chrétienne.",
    maxAmount: 50000,
  },
  {
    name: "Fondation pour le Logement Social",
    themes: ["Logement", "Précarité"],
    url: "https://www.fondationdulogementsocial.fr/",
    summary:
      "Fondation issue d'Habitat & Humanisme. Construit et rénove des logements pour les plus démunis. Partenariats associatifs.",
    maxAmount: 100000,
  },
  {
    name: "Fondation Habitat et Humanisme",
    themes: ["Logement", "Précarité"],
    url: "https://www.habitat-humanisme.org/le-mouvement-habitat-et-humanisme/le-financement-des-projets/",
    summary:
      "Mouvement national d'insertion par le logement. Soutient les projets locaux d'hébergement, d'accompagnement, de pension de famille.",
    maxAmount: 100000,
  },
  {
    name: "Fondation Croix-Rouge Française",
    themes: ["Humanitaire", "Santé", "Solidarité"],
    url: "https://www.fondation-croix-rouge.fr/appels-projets/",
    summary:
      "Fondation reconnue d'utilité publique. AAP recherche en action humanitaire et sociale, jeunes chercheurs, post-docs.",
    maxAmount: 100000,
  },
  {
    name: "Fondation Restos du Cœur",
    themes: ["Précarité", "Aide alimentaire"],
    url: "https://www.restosducoeur.org/nous-aider/devenir-partenaire/",
    summary:
      "Restos du Cœur : 70+ M€/an de programmes. Partenariats associatifs sur l'aide alimentaire, l'insertion, la lutte contre la précarité.",
    maxAmount: 100000,
  },
  {
    name: "Fondation Secours Populaire",
    themes: ["Précarité", "Solidarité", "Aide alimentaire"],
    url: "https://www.secourspopulaire.fr/devenir-partenaire/",
    summary:
      "Secours Populaire — fondation et association. Soutient les projets d'urgence alimentaire, d'accès aux loisirs, à la santé, à la culture.",
    maxAmount: 100000,
  },

  // ─── FONDATIONS CULTURE / PATRIMOINE (compléments) ───────────────
  {
    name: "Fondation Stéphane Bern",
    themes: ["Culture", "Patrimoine"],
    url: "https://www.fondationstephanebern.org/projets",
    summary:
      "Fondation présidée par Stéphane Bern, abrité à l'Institut de France. Sauvegarde du patrimoine français en péril (associée au Loto du Patrimoine).",
    maxAmount: 200000,
  },
  {
    name: "Fondation BNP Paribas — Programme Dissonances",
    themes: ["Culture", "Musique"],
    url: "https://group.bnpparibas/communique-de-presse/dissonances",
    summary:
      "Programme musical de la Fondation BNP Paribas pour soutenir les ensembles musicaux innovants.",
    maxAmount: 80000,
  },
  {
    name: "FNAC — Fondation FNAC pour la photographie",
    themes: ["Culture", "Photographie", "Arts"],
    url: "https://groupe-fnac-darty.com/groupe/fondation-fnac/",
    summary:
      "Fondation FNAC : soutient la photographie d'auteur (acquisitions, prix, expositions, publications).",
    maxAmount: 30000,
  },
  {
    name: "Centre National des Arts Plastiques (CNAP)",
    themes: ["Culture", "Arts plastiques"],
    url: "https://www.cnap.fr/aides-financieres-et-bourses",
    summary:
      "Établissement public sous tutelle du ministère de la Culture. Bourses et aides aux artistes plasticiens, théoriciens, restaurateurs.",
    maxAmount: 30000,
  },
  {
    name: "Fondation Banque Populaire — Musique",
    themes: ["Culture", "Musique"],
    url: "https://fondation-banquepopulaire.fr/",
    summary:
      "Fondation BPCE soutenant les jeunes musiciens classiques (bourses pluriannuelles), les artisans d'art (Métiers d'Art), les sportifs paralympiques.",
    maxAmount: 50000,
  },
  {
    name: "Drahi — Fondation pour le Cinéma Méditerranéen",
    themes: ["Culture", "Cinéma"],
    url: "https://drahifoundation.com/",
    summary:
      "Fondation Patrick Drahi (groupe Altice) : soutien à l'éducation, l'art et la culture en France et Israël.",
    maxAmount: 100000,
  },
  {
    name: "Fondation Beaumarchais — SACD",
    themes: ["Culture", "Spectacle vivant"],
    url: "https://www.fondationbeaumarchais.com/",
    summary:
      "Fondation de la SACD pour les jeunes auteurs. Bourses d'écriture théâtrale, audiovisuelle, animation.",
    maxAmount: 15000,
  },
  {
    name: "SCAM — Brouillon d'un Rêve",
    themes: ["Culture", "Audiovisuel", "Édition"],
    url: "https://www.scam.fr/detail/Article/brouillon-dun-r%C3%AAve",
    summary:
      "Société Civile des Auteurs Multimedia. Bourses d'écriture pour des projets documentaires, romans graphiques, podcasts, écritures innovantes.",
    maxAmount: 7000,
  },

  // ─── FONDATIONS HANDICAP (compléments) ───────────────────────────
  {
    name: "Fondation Handicap Malakoff Humanis",
    themes: ["Handicap", "Inclusion"],
    url: "https://newsroom.malakoffhumanis.com/handicap/",
    summary:
      "Fondation engagée pour l'autonomie et l'inclusion des personnes en situation de handicap. AAP réguliers.",
    maxAmount: 50000,
  },
  {
    name: "Fondation Visio",
    themes: ["Handicap", "Cécité", "Recherche"],
    url: "https://www.fondationvisio.org/",
    summary:
      "Fondation dédiée aux personnes déficientes visuelles. Recherche, autonomie, accessibilité numérique.",
    maxAmount: 80000,
  },
  {
    name: "Fondation Hartmann",
    themes: ["Handicap", "Inclusion"],
    url: "https://fondation-hartmann.org/",
    summary:
      "Fondation reconnue d'utilité publique. Soutien aux personnes en situation de handicap (établissements, recherche).",
    maxAmount: 50000,
  },
  {
    name: "Klesia — Fondation Handicap",
    themes: ["Handicap", "Insertion"],
    url: "https://www.klesia.fr/handicap-et-emploi-salarie",
    summary:
      "Fondation Klesia. Insertion professionnelle des personnes en situation de handicap, accompagnement.",
    maxAmount: 30000,
  },
  {
    name: "Fondation Garches — Handicap Moteur",
    themes: ["Handicap", "Recherche"],
    url: "https://www.fondationgarches.org/",
    summary:
      "Fondation hospitalière (Hôpital R. Poincaré). Recherche et innovation autour du handicap moteur.",
    maxAmount: 60000,
  },

  // ─── FONDATIONS ÉDUCATION & JEUNESSE (compléments) ──────────────
  {
    name: "Fondation Article 1",
    themes: ["Éducation", "Jeunesse", "Égalité des chances"],
    url: "https://www.article-1.eu/nos-partenaires/",
    summary:
      "Fondation issue de la fusion Frateli + Passeport Avenir. Égalité des chances dans l'enseignement supérieur, mentorat, premier emploi.",
    maxAmount: 80000,
  },
  {
    name: "Fondation Robert Schuman (jeunesse européenne)",
    themes: ["Éducation", "Europe", "Citoyenneté"],
    url: "https://www.robert-schuman.eu/fr/",
    summary:
      "Think-tank et fondation pour l'éducation européenne. Bourses étudiantes et soutien à l'engagement citoyen européen.",
    maxAmount: 20000,
  },
  {
    name: "Fondation Énergie Jeunes",
    themes: ["Éducation", "Jeunesse"],
    url: "https://www.energiejeunes.fr/",
    summary:
      "Association reconnue d'utilité publique. Programmes de motivation scolaire en collège REP/REP+. Partenariats avec les associations éducatives locales.",
    maxAmount: 30000,
  },
  {
    name: "Fondation Wikimédia France",
    themes: ["Éducation", "Numérique", "Connaissance libre"],
    url: "https://www.wikimedia.fr/microfis/",
    summary:
      "Wikimédia France — micro-financements et partenariats pour des projets de partage de la connaissance libre (édition Wikipédia, communs).",
    maxAmount: 10000,
  },
  {
    name: "Fondation Mozaïk — Diversité",
    themes: ["Égalité des chances", "Emploi", "Diversité"],
    url: "https://www.mozaikrh.com/",
    summary:
      "Fondation Mozaïk — emploi des jeunes diplômés issus de la diversité. Partenariats associatifs pour le mentorat et l'insertion professionnelle.",
    maxAmount: 30000,
  },
  {
    name: "Fondation Un Monde par Tous (Charles Léopold Mayer)",
    themes: ["Société civile", "Éducation populaire"],
    url: "https://www.fondationcharlesleopoldmayer.org/",
    summary:
      "Fondation suisse Charles Léopold Mayer pour le Progrès de l'Homme. Soutient les acteurs de la transition démocratique et écologique.",
    maxAmount: 50000,
  },
  {
    name: "Fondation Make-A-Wish France",
    themes: ["Santé", "Enfance"],
    url: "https://www.makeawishfrance.org/devenir-partenaire/",
    summary:
      "Make-A-Wish France réalise les rêves des enfants gravement malades. Partenariats hospitaliers et associatifs.",
    maxAmount: 20000,
  },

  // ─── OPÉRATEURS PUBLICS / PARAPUBLICS ────────────────────────────
  {
    name: "France Active — Pacte d'Émergence",
    themes: ["ESS", "Innovation sociale", "Insertion"],
    url: "https://www.franceactive.org/nos-solutions-financieres/",
    summary:
      "Réseau France Active : prêts et garanties pour les entrepreneurs sociaux et associations. Pacte d'Émergence, FAC, Apport Associatif.",
    maxAmount: 200000,
  },
  {
    name: "ADIE — Association pour le Droit à l'Initiative Économique",
    themes: ["Insertion", "Microcrédit", "Emploi"],
    url: "https://www.adie.org/",
    summary:
      "Microcrédits jusqu'à 12 000 € + accompagnement pour la création d'entreprise par des publics éloignés de l'emploi.",
    maxAmount: 12000,
  },
  {
    name: "Initiative France",
    themes: ["Entrepreneuriat", "Emploi"],
    url: "https://www.initiative-france.fr/",
    summary:
      "Réseau national de financement et d'accompagnement des entrepreneurs (prêts d'honneur 0 %).",
    maxAmount: 50000,
  },
  {
    name: "Réseau Entreprendre",
    themes: ["Entrepreneuriat", "Emploi"],
    url: "https://www.reseau-entreprendre.org/",
    summary:
      "Réseau d'accompagnement des créateurs d'entreprise (mentorat + prêts d'honneur jusqu'à 50 000 €).",
    maxAmount: 50000,
  },
  {
    name: "BGE — Réseau d'appui aux entrepreneurs",
    themes: ["Entrepreneuriat", "Insertion"],
    url: "https://www.bge.asso.fr/",
    summary:
      "Réseau associatif d'accompagnement à la création d'entreprise et à l'insertion professionnelle.",
    maxAmount: 30000,
  },
  {
    name: "Pro Bono Lab",
    themes: ["Solidarité", "Bénévolat de compétences"],
    url: "https://www.probonolab.org/devenir-partenaire/",
    summary:
      "Plateforme de bénévolat de compétences pour les associations. Mission gratuite avec experts pro bono.",
    maxAmount: 0,
  },
  {
    name: "Centre Français des Fonds et Fondations",
    themes: ["Philanthropie", "Société civile"],
    url: "https://www.centre-francais-fondations.org/",
    summary:
      "Réseau national des fonds et fondations. Plateforme d'information, formation et plaidoyer pour le secteur philanthropique français.",
    maxAmount: 0,
  },

  // ─── FONDATIONS GENRE / FÉMINISMES (compléments) ─────────────────
  {
    name: "Fonds pour les Femmes en Méditerranée",
    themes: ["Femmes", "Solidarité internationale", "Méditerranée"],
    url: "https://www.medwomensfund.org/",
    summary:
      "Fonds dédié aux organisations féministes du pourtour méditerranéen. Subventions de fonctionnement et de projets.",
    maxAmount: 30000,
  },
  {
    name: "Mama Cash",
    themes: ["Femmes", "Droits humains", "International"],
    url: "https://www.mamacash.org/en/grants",
    summary:
      "Fonds néerlandais finançant les mouvements féministes et les organisations LGBTI+ dans le monde. Cible les groupes émergents et de plaidoyer.",
    maxAmount: 100000,
  },
  {
    name: "Fonds pour l'Emancipation des Femmes (FEM)",
    themes: ["Femmes", "Égalité", "Insertion"],
    url: "https://emancipation.federations.fr/",
    summary:
      "Soutient les associations féministes françaises (lutte contre les violences, accès aux droits, égalité professionnelle).",
    maxAmount: 30000,
  },

  // ─── FONDATIONS NUMÉRIQUE / IA / DATA ────────────────────────────
  {
    name: "Fondation Free / Iliad",
    themes: ["Numérique", "Inclusion numérique"],
    url: "https://www.iliad.fr/fondation",
    summary:
      "Fondation Iliad. Soutient des projets sur l'éducation numérique, l'égalité des chances dans les filières tech.",
    maxAmount: 80000,
  },
  {
    name: "Fondation Société Numérique",
    themes: ["Numérique", "Inclusion numérique"],
    url: "https://societenumerique.gouv.fr/fr/financement/",
    summary:
      "Programme national de l'ANCT pour l'inclusion numérique. Aides aux structures (médiateurs, lieux d'accès, France Services).",
    maxAmount: 100000,
  },
  {
    name: "Code.org / La Fabrique Académique",
    themes: ["Numérique", "Éducation"],
    url: "https://magic.makers/fondation/",
    summary:
      "Magic Makers / La Fabrique Académique : éducation au numérique pour les jeunes. Partenariats associatifs.",
    maxAmount: 30000,
  },
  {
    name: "Fondation Internet Nouvelle Génération (FING)",
    themes: ["Numérique", "Recherche", "Société"],
    url: "https://fing.org/",
    summary:
      "Think-tank dédié aux transformations numériques. Partenariats et appels à contributions.",
    maxAmount: 30000,
  },

  // ─── FONDATIONS LUTTE CONTRE LA PAUVRETÉ (compléments) ───────────
  {
    name: "Fonds Européen d'Aide aux plus Démunis (FEAD/FSE+)",
    themes: ["Précarité", "Aide alimentaire"],
    url: "https://travail-emploi.gouv.fr/le-fonds-social-europeen-fse",
    summary:
      "Volet aide alimentaire du FSE+ géré par la DGCS. Cofinancement aux têtes de réseau et grandes associations d'aide alimentaire.",
    maxAmount: 5000000,
    eligibleEntities: ["association"],
  },
  {
    name: "ANSA — Agence Nouvelle des Solidarités Actives",
    themes: ["Solidarité", "Innovation sociale"],
    url: "https://www.solidarites-actives.com/",
    summary:
      "Association d'innovation sociale. Expérimentation de dispositifs de lutte contre la pauvreté, mise en réseau d'acteurs.",
    maxAmount: 100000,
  },
  {
    name: "Fonds Nominoë (Bretagne)",
    themes: ["Territoires", "Solidarité"],
    url: "https://nominoe.org/",
    summary:
      "Fonds de dotation breton territorial. Soutien aux projets associatifs solidaires en Bretagne.",
    maxAmount: 15000,
  },
];

export async function fetchExtraFoundations(): Promise<ExtraFoundation[]> {
  const seen = new Set<string>();
  const unique = EXTRA_FOUNDATIONS.filter((f) => {
    if (seen.has(f.url)) return false;
    seen.add(f.url);
    return true;
  });
  console.log(`[Fondations curated extra] ${unique.length} fondations`);
  return unique;
}

export function transformExtraFoundationToGrant(f: ExtraFoundation) {
  return {
    sourceUrl: f.url,
    sourceName: "Fondations & opérateurs (curated extra)",
    title: f.name,
    summary: f.summary,
    rawContent: f.summary,
    funder: f.funder ?? f.name,
    country: "FR",
    thematicAreas: f.themes,
    eligibleEntities: f.eligibleEntities ?? ["association", "ong"],
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
