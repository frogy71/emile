/**
 * AFD — Agence Française de Développement & Expertise France
 *
 * L'AFD finance les ONG françaises, les acteurs locaux et les
 * organisations de la société civile à l'international, à travers
 * plusieurs guichets thématiques. Couvre aussi sa filiale Expertise
 * France (coopération technique) et le groupe Proparco (secteur privé).
 */

export interface AFDProgram {
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

const AFD_PROGRAMS: AFDProgram[] = [
  {
    url: "https://www.afd.fr/fr/page-thematique-axe/societe-civile",
    title: "AFD — Soutien à la société civile",
    summary:
      "L'AFD finance les ONG françaises et leurs partenaires du Sud à travers plusieurs dispositifs (I-OSC, OSC PROJET, OSC Convention-Programme). 12+ M€ alloués chaque année.",
    themes: ["Solidarité internationale", "Développement", "Société civile"],
    funder: "AFD",
    eligibleEntities: ["association", "ong"],
    eligibleCountries: ["FR"],
    maxAmountEur: 1500000,
  },
  {
    url: "https://www.afd.fr/fr/initiatives-osc-financement-projets-terrain",
    title: "AFD — Initiatives OSC (I-OSC)",
    summary:
      "Financement de projets de terrain portés par les ONG françaises (cofinancement de 50 % à 75 %, 100 k€ à 4 M€). Éducation, santé, eau, gouvernance, climat, droits humains.",
    themes: ["Solidarité internationale", "Développement"],
    funder: "AFD (Division OSC)",
    eligibleEntities: ["association", "ong"],
    eligibleCountries: ["FR"],
    minAmountEur: 100000,
    maxAmountEur: 4000000,
  },
  {
    url: "https://www.afd.fr/fr/conventions-programme-cp-osc",
    title: "AFD — Conventions Programme (CP-OSC)",
    summary:
      "Cofinancement pluriannuel (3 ans, 1 à 6 M€) pour les ONG d'envergure et leurs partenaires Sud. Stratégie d'intervention multi-pays multi-thématique.",
    themes: ["Solidarité internationale", "Développement"],
    funder: "AFD (Division OSC)",
    eligibleEntities: ["ong"],
    eligibleCountries: ["FR"],
    minAmountEur: 1000000,
    maxAmountEur: 6000000,
  },
  {
    url: "https://www.afd.fr/fr/initiatives-osc-jeunesse",
    title: "AFD — Initiatives Jeunesse (Jeunesse / VI / Engagement)",
    summary:
      "Soutien aux projets d'ONG françaises sur la jeunesse, le volontariat international et l'engagement citoyen.",
    themes: ["Solidarité internationale", "Jeunesse", "Engagement"],
    funder: "AFD",
    eligibleEntities: ["association", "ong"],
    eligibleCountries: ["FR"],
    maxAmountEur: 1500000,
  },
  {
    url: "https://www.afd.fr/fr/page-thematique-axe/cooperation-decentralisee",
    title: "AFD — Coopération décentralisée (FICOL)",
    summary:
      "Facilité de Financement des Collectivités Territoriales Françaises (FICOL) : co-financement (jusqu'à 80 %) des projets de coopération décentralisée portés par les collectivités françaises avec une autorité locale du Sud.",
    themes: ["Solidarité internationale", "Coopération décentralisée"],
    funder: "AFD",
    eligibleEntities: ["collectivite"],
    eligibleCountries: ["FR"],
    maxAmountEur: 1500000,
  },
  {
    url: "https://www.afd.fr/fr/cas/recherche",
    title: "AFD — Programmes de recherche",
    summary:
      "Soutien à la recherche en développement (économie, climat, santé). AAP récurrents en partenariat avec l'ANRS, l'IRD, le CIRAD.",
    themes: ["Recherche", "Développement", "Solidarité internationale"],
    funder: "AFD",
    eligibleEntities: ["recherche", "universite"],
    eligibleCountries: ["FR"],
    maxAmountEur: 500000,
  },
  {
    url: "https://www.afd.fr/fr/financement-prive-developpement",
    title: "Proparco — Financement secteur privé pays en développement",
    summary:
      "Filiale du Groupe AFD dédiée au financement du secteur privé dans les pays en développement (prêts, garanties, prises de participation). Cible PME locales, infrastructures, climat.",
    themes: ["Développement", "Entreprises", "Climat"],
    funder: "Proparco (groupe AFD)",
    eligibleEntities: ["entreprise"],
    eligibleCountries: ["FR"],
    maxAmountEur: 50000000,
  },
  {
    url: "https://www.expertisefrance.fr/appels-a-propositions",
    title: "Expertise France — Appels à propositions",
    summary:
      "Agence de coopération technique (groupe AFD). AAP pour mobiliser des experts français sur des projets de gouvernance, santé, sécurité, climat, économie dans les pays partenaires.",
    themes: ["Coopération", "Développement", "Expertise"],
    funder: "Expertise France",
    eligibleEntities: ["entreprise", "association", "recherche"],
    eligibleCountries: ["FR"],
    maxAmountEur: 5000000,
  },
  {
    url: "https://www.afd.fr/fr/cas/marin-kit-doceans",
    title: "AFD — Initiative Kiwa pour la résilience climatique",
    summary:
      "Initiative Kiwa : 65 M€ pour les Solutions fondées sur la Nature dans le Pacifique (Polynésie, Nouvelle-Calédonie, Vanuatu, Fidji). AAP grants spécifiques aux ONG.",
    themes: ["Climat", "Biodiversité", "Outre-mer"],
    funder: "AFD (Initiative Kiwa)",
    eligibleEntities: ["association", "ong"],
    eligibleCountries: ["FR"],
    maxAmountEur: 1500000,
  },
  {
    url: "https://www.afd.fr/fr/initiative-marianne",
    title: "AFD — Initiative Marianne pour les défenseurs des droits humains",
    summary:
      "Programme de protection et soutien à 15 défenseurs des droits humains menacés/an (visa long séjour + soutien financier). Cible défenseurs internationaux.",
    themes: ["Droits humains", "International"],
    funder: "AFD / MEAE (Initiative Marianne)",
    maxAmountEur: 30000,
  },
  {
    url: "https://www.afd.fr/fr/cas/equipe-france",
    title: "AFD — Aide humanitaire d'urgence",
    summary:
      "Aide humanitaire d'urgence et post-crise gérée par l'AFD pour le compte du MEAE (CDCS). Mobilisation rapide en cas de crise (catastrophe, conflit).",
    themes: ["Humanitaire", "Urgence"],
    funder: "AFD / MEAE (CDCS)",
    eligibleEntities: ["ong", "association"],
    eligibleCountries: ["FR"],
    maxAmountEur: 2000000,
  },
  {
    url: "https://www.afd.fr/fr/cas/transition-juste-egalite-femmes-hommes",
    title: "AFD — Fonds de soutien aux organisations féministes (FSOF)",
    summary:
      "Fonds dédié aux organisations féministes des pays partenaires de l'AFD. 250 M€ engagés pour 2023-2027 sur l'égalité de genre et le renforcement des mouvements féministes.",
    themes: ["Égalité", "Femmes", "Droits humains"],
    funder: "AFD (FSOF)",
    eligibleEntities: ["association", "ong"],
    eligibleCountries: ["FR"],
    maxAmountEur: 2000000,
  },
];

export async function fetchAFDPrograms(): Promise<AFDProgram[]> {
  console.log(`[AFD] ${AFD_PROGRAMS.length} programmes curés`);
  return AFD_PROGRAMS;
}

export function transformAFDToGrant(p: AFDProgram) {
  return {
    sourceUrl: p.url,
    sourceName: "AFD — Agence Française de Développement",
    title: p.title,
    summary: p.summary,
    rawContent: p.summary,
    funder: p.funder,
    country: "FR",
    thematicAreas: p.themes,
    eligibleEntities: p.eligibleEntities ?? ["ong", "association"],
    eligibleCountries: p.eligibleCountries ?? ["FR"],
    minAmountEur: p.minAmountEur ?? 50000,
    maxAmountEur: p.maxAmountEur ?? 1000000,
    coFinancingRequired: true,
    deadline: null,
    grantType: "subvention",
    language: "fr",
    status: "active",
    aiSummary: null,
  };
}
