/**
 * GrantScore — grant ↔ project matching
 *
 * Three paths:
 *  - computeHeuristicScore   : deterministic, fast, scores one grant
 *  - computeMatchScore       : Claude-powered, single grant, runs on demand
 *  - refineTopMatchesWithAI  : Claude-powered, BATCH-refines the top N
 *                              candidates in a single API call (used by the
 *                              3-stage funnel match endpoint)
 *
 * All paths produce the same MatchScoreResult so the UI doesn't care which
 * path produced a given score.
 *
 * ## Heuristic design
 *
 * Score is additive out of 100, with hard gates that zero-out ineligible
 * grants rather than letting them score 40+ like the old heuristic did:
 *
 *   HARD GATES (score = 0, recommendation = "skip"):
 *     - deadline passed
 *     - eligible_entities specified and org/project doesn't match
 *     - eligible_countries specified and no geographic overlap
 *     - grant min_amount exceeds project requested_amount
 *     - audience mismatch (e.g. youth-only grant for a seniors project)
 *
 *   COMPONENTS (max 100):
 *     - Thematic alignment       : 0-40   (structured themes + free-text)
 *     - Geographic fit           : 0-20
 *     - Entity eligibility       : 0-15
 *     - Budget fit               : 0-15
 *     - Deadline runway          :  0-5
 *     - Experience & capacity    :  0-5
 *
 * Why additive with hard gates? It gives a real 0-100 spread (good matches
 * actually hit 80+, bad matches actually drop below 30) and eliminates the
 * "every grant scores 40-70" bug the old heuristic had.
 */

import { logAiUsage } from "./usage-tracker";

export interface MatchScoreResult {
  score: number; // 0-100
  difficulty: "easy" | "medium" | "hard" | "very_hard";
  difficultyLabel: string;
  recommendation: "pursue" | "maybe" | "skip";
  strengths: string[];
  weaknesses: string[];
  risks: string[];
  summary: string;
  /** Which hard gate zeroed the score (debugging + UI context). */
  gatedBy?: string;
}

export interface OrgProfile {
  name: string;
  mission?: string;
  legalStatus?: string;
  thematicAreas?: string[];
  beneficiaries?: string[];
  geographicFocus?: string[];
  annualBudgetEur?: number;
  teamSize?: number;
  languages?: string[];
  priorGrants?: string;
}

export interface ProjectProfile {
  name: string;
  summary?: string;
  objectives?: string[];
  targetBeneficiaries?: string[];
  targetGeography?: string[];
  requestedAmountEur?: number;
  durationMonths?: number;
  indicators?: string[];
}

export interface GrantProfile {
  title: string;
  summary?: string;
  funder?: string;
  country?: string;
  thematicAreas?: string[];
  eligibleEntities?: string[];
  eligibleCountries?: string[];
  minAmountEur?: number;
  maxAmountEur?: number;
  coFinancingRequired?: boolean;
  deadline?: string;
  grantType?: string;
}

// ─── Normalization helpers ───────────────────────────────────────

/** Lowercase + strip diacritics + collapse whitespace. */
function normalize(s: string | undefined | null): string {
  if (!s) return "";
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * French NGO theme → keyword stems. Used to expand structured themes into
 * a larger keyword set that also matches free-text (titles, summaries, missions).
 *
 * Keep stems short enough to catch morphological variants via substring.
 * e.g. "educ" catches "éducation", "éducative", "éducateurs".
 */
const THEME_KEYWORDS: Record<string, string[]> = {
  humanitaire: ["humanitaire", "urgence", "crise", "secours", "catastrophe", "sinistre"],
  education: ["educ", "scolair", "ecole", "enseignement", "apprentissage", "formation", "pedagog", "alphabet"],
  jeunesse: ["jeunesse", "jeune", "adolescent", "enfance", "enfant", "mineur"],
  inclusion: ["inclusion", "handicap", "accessibilit", "integration", "insertion"],
  culture: ["cultur", "art", "patrimoine", "musee", "theatre", "spectacle", "musiqu", "litterat"],
  sante: ["sante", "soin", "medical", "hopital", "maladie", "prevention", "bien etre"],
  environnement: ["environnement", "ecolog", "climat", "biodiversit", "transition", "nature", "dechet", "pollution", "energie"],
  "droits humains": ["droits", "justice", "democrat", "liberte", "citoyennet"],
  migration: ["migration", "migrant", "refugi", "asile", "exil", "deplac"],
  developpement: ["developpement", "cooperation", "solidarit", "aide"],
  egalite: ["egalit", "parite", "femme", "genre", "feminis", "discrimin"],
  numerique: ["numerique", "digital", "tech", "informatique", "internet"],
  agriculture: ["agricult", "rural", "paysan", "alimentation", "alimentaire"],
  sport: ["sport", "activite physique"],
  social: ["social", "precarit", "pauvrete", "exclusion", "sans abri", "logement"],
  economie: ["economie", "emploi", "insertion", "entrepreneur", "ess"],
};

/** Expand structured theme names + free-text into a keyword set. */
function extractKeywords(
  structuredThemes: string[] | undefined,
  freeText: string[]
): Set<string> {
  const keywords = new Set<string>();

  for (const theme of structuredThemes || []) {
    const key = normalize(theme);
    // Direct theme keyword
    keywords.add(key);
    // Expand via dictionary — look up by normalized key AND by each entry's normalized form
    for (const [dictKey, stems] of Object.entries(THEME_KEYWORDS)) {
      if (key.includes(normalize(dictKey)) || normalize(dictKey).includes(key)) {
        for (const stem of stems) keywords.add(stem);
      }
    }
  }

  const allText = freeText.map(normalize).join(" ");
  // For free-text, check which dictionary stems appear — that's our free-text signal
  for (const [dictKey, stems] of Object.entries(THEME_KEYWORDS)) {
    for (const stem of stems) {
      if (allText.includes(stem)) {
        keywords.add(stem);
        keywords.add(normalize(dictKey));
      }
    }
  }

  return keywords;
}

/**
 * Geography hierarchy. Each token maps to a set of parent/equivalent regions.
 * When we check overlap we expand both sides and look for any intersection.
 */
const GEO_PARENTS: Record<string, string[]> = {
  world: ["world", "international"],
  international: ["world", "international"],
  europe: ["europe", "eu", "ue"],
  eu: ["europe", "eu", "ue"],
  ue: ["europe", "eu", "ue"],
  france: ["france", "fr", "europe", "eu"],
  fr: ["france", "fr", "europe", "eu"],
  afrique: ["afrique", "africa"],
  africa: ["afrique", "africa"],
  asie: ["asie", "asia"],
  asia: ["asie", "asia"],
  "amerique latine": ["amerique latine", "latin america"],
  "latin america": ["amerique latine", "latin america"],
  local: ["local", "territorial", "france", "fr"],
  territorial: ["local", "territorial", "france", "fr"],
  national: ["national", "france", "fr"],
};

function expandGeo(tokens: string[]): Set<string> {
  const out = new Set<string>();
  for (const raw of tokens) {
    const t = normalize(raw);
    out.add(t);
    // Look up any known parent
    for (const [key, parents] of Object.entries(GEO_PARENTS)) {
      if (t.includes(key) || key.includes(t)) {
        for (const p of parents) out.add(p);
      }
    }
  }
  return out;
}

function geoOverlap(orgGeo: string[] | undefined, grantGeo: string[] | undefined): {
  strength: "exact" | "partial" | "unknown" | "none";
} {
  if (!grantGeo || grantGeo.length === 0) return { strength: "unknown" };
  const orgSet = expandGeo(orgGeo || []);
  const grantSet = expandGeo(grantGeo);

  // "world"/"international" on the grant side = accessible to anyone
  if (grantSet.has("world") || grantSet.has("international")) {
    return { strength: "exact" };
  }

  if (orgSet.size === 0) return { strength: "unknown" };

  // Direct intersection?
  for (const g of grantSet) {
    if (orgSet.has(g)) return { strength: "exact" };
  }

  // Weaker overlap through parents (Europe ⊇ France)
  for (const g of grantSet) {
    for (const o of orgSet) {
      if (g.includes(o) || o.includes(g)) return { strength: "partial" };
    }
  }

  return { strength: "none" };
}

// ─── Audience detection ─────────────────────────────────────────
//
// A grant can be thematically aligned with a project yet structurally
// ineligible because it targets a *different audience*. Erasmus+ funds
// "inclusion numérique" only when the beneficiaries are young people, so a
// project about digital inclusion for seniors should score 0 against it
// regardless of topic overlap.
//
// We catch this with a hard gate. The detector scans every text source on
// each side (grant title/summary/themes/eligible_entities; project
// targetBeneficiaries/summary/objectives/name; org mission/beneficiaries
// when no project is supplied) for audience markers. When the grant
// audiences and project audiences are STRICTLY incompatible — i.e. one
// side has audience A only, the other has audience B only, and (A, B) is
// in the incompatible-pair list — we gate to 0. If either side has both
// audiences, or no audience at all, we don't gate (no evidence of
// mismatch).
//
// Why a hard gate instead of a penalty? Empirically these mismatches
// produced 60+ scoring grants because thematic overlap dominates. A soft
// penalty would still surface them in the top-N. The audience constraint
// is structural — the project is not eligible — so 0 is the correct score.

type AudienceType =
  | "youth"
  | "senior"
  | "association"
  | "entreprise"
  | "collectivite"
  | "particulier";

/**
 * Patterns are matched against NORMALIZED text (lowercase, no diacritics).
 * Use \b word boundaries to avoid spurious substring matches.
 */
const AUDIENCE_PATTERNS: Record<AudienceType, RegExp[]> = {
  youth: [
    /\bjeunes?\b/,
    /\bjeunesse\b/,
    /\badolescent/,
    /\bmineurs?\b/,
    /\betudiant/,
    /\blyceens?\b/,
    /\bcollegiens?\b/,
    /\byouth\b/,
    /\byoung\b/,
    /\berasmus/,
    /\bservice civique\b/,
    /\b1[68][ -]?a?[ -]?(2[0-9]|30)\s*ans?\b/,
    /\bmoins de (25|30) ans\b/,
    /\bnouvelle generation\b/,
  ],
  senior: [
    /\bseniors?\b/,
    /\bpersonnes? agees?\b/,
    /\bretraites?\b/,
    /\baines?\b/,
    /\btroisieme age\b/,
    /\bquatrieme age\b/,
    /\bgrand age\b/,
    /\bvieillesse\b/,
    /\baidants?\b/,
    /\belderly\b/,
    /\bperte d autonomie\b/,
    /\bcnsa\b/,
    /\bsilver economie\b/,
    /\bgerontolog/,
    /\behpad/,
    /\bplus de 6[05]\s*ans?\b/,
    /\b6[05]\s*ans? et plus\b/,
    /\bconference des financeurs\b/,
  ],
  association: [
    /\bassociations?\b/,
    /\bong\b/,
    /\bnonprofit/,
    /\bnon lucratif\b/,
    /\ba but non lucratif\b/,
  ],
  entreprise: [
    /\bentreprises?\b/,
    /\bpme\b/,
    /\bstart[ -]?ups?\b/,
    /\bsocietes? commerciales?\b/,
    /\btpe\b/,
  ],
  collectivite: [
    /\bcollectivites?\b/,
    /\bcommunes?\b/,
    /\bregions?\b/,
    /\bdepartements?\b/,
    /\bepci\b/,
    /\bintercommunal/,
  ],
  particulier: [
    /\bparticuliers?\b/,
    /\bcitoyens?\b/,
    /\bindividus?\b/,
  ],
};

/**
 * Pairs of audiences that cannot coexist on the same matching project.
 * Order doesn't matter — we check both directions.
 *
 * Note: association/entreprise mismatches are *also* caught by the entity
 * gate via legalStatus → eligibleEntities. We include them here for the
 * narrower case where the grant doesn't list eligibleEntities but the
 * summary makes it clear who's targeted.
 */
const INCOMPATIBLE_AUDIENCES: Array<[AudienceType, AudienceType]> = [
  ["youth", "senior"],
  ["association", "entreprise"],
  ["collectivite", "particulier"],
];

function detectAudiences(texts: Array<string | undefined | null>): Set<AudienceType> {
  const out = new Set<AudienceType>();
  const joined = texts.filter(Boolean).map((s) => normalize(s as string)).join(" ");
  if (!joined) return out;
  for (const [audience, patterns] of Object.entries(AUDIENCE_PATTERNS) as Array<[
    AudienceType,
    RegExp[]
  ]>) {
    if (patterns.some((p) => p.test(joined))) out.add(audience);
  }
  return out;
}

/** Flatten an array-of-strings into a single space-joined string for detection. */
function joinArr(arr: string[] | undefined): string {
  return (arr || []).filter(Boolean).join(" ");
}

/**
 * Returns the first incompatible (grant, project) pair found, or null when
 * audiences are compatible (or there's no evidence either way).
 *
 * "Strictly incompatible" means:
 *   - grant has audience A, NOT B
 *   - project has audience B, NOT A
 * If either side is mixed, we abstain (no gate).
 */
export function detectAudienceMismatch(
  grantAudiences: Set<AudienceType>,
  projectAudiences: Set<AudienceType>
): { grant: AudienceType; project: AudienceType } | null {
  for (const [a, b] of INCOMPATIBLE_AUDIENCES) {
    if (grantAudiences.has(a) && !grantAudiences.has(b) &&
        projectAudiences.has(b) && !projectAudiences.has(a)) {
      return { grant: a, project: b };
    }
    if (grantAudiences.has(b) && !grantAudiences.has(a) &&
        projectAudiences.has(a) && !projectAudiences.has(b)) {
      return { grant: b, project: a };
    }
  }
  return null;
}

const AUDIENCE_LABEL: Record<AudienceType, string> = {
  youth: "jeunes",
  senior: "seniors",
  association: "associations",
  entreprise: "entreprises",
  collectivite: "collectivités",
  particulier: "particuliers",
};

// ─── Entity eligibility ──────────────────────────────────────────

function checkEntityFit(
  orgLegalStatus: string | undefined,
  eligibleEntities: string[] | undefined
): { strength: "match" | "generic" | "unknown" | "mismatch"; label?: string } {
  if (!eligibleEntities || eligibleEntities.length === 0) {
    return { strength: "unknown" };
  }

  const eligible = eligibleEntities.map(normalize);
  const allText = eligible.join(" ");

  // "Tous publics" / "tout type" → generic accessibility
  if (/tous|tout type|ouvert|any/i.test(allText)) {
    return { strength: "generic" };
  }

  // Which entity types appear in eligible list?
  const accepts = {
    association: /associat|ong|nonprofit|non lucratif|a but non lucratif/.test(allText),
    fondation: /fondation|foundation/.test(allText),
    collectivite: /collectivit|commune|region|departement|epci|intercommunal/.test(allText),
    entreprise: /entreprise|societe|ess|economie sociale/.test(allText),
  };

  const status = normalize(orgLegalStatus || "association"); // default to association (most common)
  if (status.includes("associat") || status.includes("ong")) {
    return accepts.association
      ? { strength: "match", label: "Associations éligibles" }
      : { strength: "mismatch", label: "Associations non éligibles" };
  }
  if (status.includes("fondation")) {
    return accepts.fondation
      ? { strength: "match", label: "Fondations éligibles" }
      : { strength: "mismatch" };
  }
  if (status.includes("collectivite")) {
    return accepts.collectivite
      ? { strength: "match" }
      : { strength: "mismatch" };
  }
  if (status.includes("entreprise") || status.includes("ess")) {
    return accepts.entreprise ? { strength: "match" } : { strength: "mismatch" };
  }

  // Unknown status — if any NGO-ish type is eligible, give benefit of doubt
  return accepts.association || accepts.fondation
    ? { strength: "generic" }
    : { strength: "unknown" };
}

// ─── Budget fit ──────────────────────────────────────────────────

function checkBudgetFit(
  requested: number | undefined,
  min: number | undefined,
  max: number | undefined
): {
  strength: "fit" | "grant_too_big" | "grant_too_small" | "unknown";
  label?: string;
} {
  if (!requested || (!min && !max)) return { strength: "unknown" };

  if (max && requested > max) {
    return {
      strength: "grant_too_small",
      label: `Plafond ${max.toLocaleString("fr-FR")} € < besoin`,
    };
  }

  if (min && requested < min * 0.7) {
    // Project budget way below grant's minimum → probably not the right fit
    return {
      strength: "grant_too_big",
      label: `Minimum ${min.toLocaleString("fr-FR")} € > besoin`,
    };
  }

  return { strength: "fit" };
}

// ─── Deadline runway ─────────────────────────────────────────────

function daysUntilDeadline(deadline: string | undefined): number | null {
  if (!deadline) return null;
  const d = new Date(deadline).getTime();
  if (!isFinite(d)) return null;
  return Math.ceil((d - Date.now()) / (1000 * 60 * 60 * 24));
}

// ─── Main heuristic ──────────────────────────────────────────────

export function computeHeuristicScore(
  org: OrgProfile,
  grant: GrantProfile,
  project?: ProjectProfile
): MatchScoreResult {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const risks: string[] = [];

  // ─── HARD GATES ──────────────────────────────────────────────────
  const days = daysUntilDeadline(grant.deadline);
  if (days !== null && days < 0) {
    return gated(
      "deadline_passed",
      "Deadline passée",
      computeDifficulty(grant)
    );
  }

  // Entity gate
  const entityFit = checkEntityFit(org.legalStatus, grant.eligibleEntities);
  if (entityFit.strength === "mismatch") {
    return gated(
      "entity_mismatch",
      entityFit.label || "Profil juridique non éligible",
      computeDifficulty(grant)
    );
  }

  // Geographic gate
  const combinedGeo = [
    ...(org.geographicFocus || []),
    ...(project?.targetGeography || []),
  ];
  const geoFit = geoOverlap(combinedGeo, grant.eligibleCountries);
  if (geoFit.strength === "none") {
    return gated(
      "geo_mismatch",
      "Zones géographiques non couvertes",
      computeDifficulty(grant)
    );
  }

  // Audience gate — catches "Erasmus+ for our seniors project" cases that
  // pass the entity gate (both accept associations) but target wholly
  // different beneficiary groups.
  const grantAudiences = detectAudiences([
    grant.title,
    grant.summary,
    joinArr(grant.thematicAreas),
    joinArr(grant.eligibleEntities),
    grant.funder,
  ]);
  const projectAudiences = project
    ? detectAudiences([
        project.name,
        project.summary,
        joinArr(project.objectives),
        joinArr(project.targetBeneficiaries),
      ])
    : detectAudiences([
        org.mission,
        joinArr(org.thematicAreas),
        joinArr(org.beneficiaries),
      ]);

  const audienceMismatch = detectAudienceMismatch(grantAudiences, projectAudiences);
  if (audienceMismatch) {
    return gated(
      "audience_mismatch",
      `Public visé incompatible (subvention pour ${AUDIENCE_LABEL[audienceMismatch.grant]}, projet pour ${AUDIENCE_LABEL[audienceMismatch.project]})`,
      computeDifficulty(grant)
    );
  }

  // Budget gate (only when grant is clearly too big)
  const budgetFit = checkBudgetFit(
    project?.requestedAmountEur,
    grant.minAmountEur,
    grant.maxAmountEur
  );
  if (budgetFit.strength === "grant_too_big" && grant.minAmountEur) {
    // Don't zero — just apply as weakness. A project could scale up.
    weaknesses.push(budgetFit.label || "Plafond bas");
  }

  // ─── THEMATIC ALIGNMENT (0-40) ──────────────────────────────────
  // Include targetBeneficiaries + org.beneficiaries in the free-text pool so
  // beneficiary descriptors contribute to the keyword match (and are visible
  // to extractKeywords' free-text scan).
  const orgFreeText = [
    org.mission,
    joinArr(org.beneficiaries),
    ...(project
      ? [
          project.summary,
          joinArr(project.objectives),
          joinArr(project.targetBeneficiaries),
        ]
      : []),
  ].filter(Boolean) as string[];
  const grantFreeText = [grant.title, grant.summary, grant.funder].filter(Boolean) as string[];

  const orgKeywords = extractKeywords(org.thematicAreas, orgFreeText);
  const grantKeywords = extractKeywords(grant.thematicAreas, grantFreeText);

  let thematicHits = 0;
  for (const k of orgKeywords) {
    if (grantKeywords.has(k)) thematicHits++;
  }

  // 4 points per hit, capped at 40; requires at least 1 hit for any points.
  const thematicScore = Math.min(40, thematicHits * 4);

  if (thematicHits >= 5) {
    strengths.push("Thématiques très alignées");
  } else if (thematicHits >= 2) {
    strengths.push("Thématiques alignées");
  } else if (thematicHits === 1) {
    strengths.push("Une thématique commune");
  } else if (grant.thematicAreas?.length) {
    weaknesses.push("Thématiques peu alignées");
  }

  // ─── GEOGRAPHIC FIT (0-20) ───────────────────────────────────────
  let geoScore = 0;
  if (geoFit.strength === "exact") {
    geoScore = 20;
    strengths.push("Zone géographique parfaitement couverte");
  } else if (geoFit.strength === "partial") {
    geoScore = 12;
    strengths.push("Zone géographique partiellement couverte");
  } else if (geoFit.strength === "unknown") {
    geoScore = 12; // benefit of doubt when grant doesn't specify
  }

  // ─── ENTITY ELIGIBILITY (0-15) ───────────────────────────────────
  let entityScore = 0;
  if (entityFit.strength === "match") {
    entityScore = 15;
    if (entityFit.label) strengths.push(entityFit.label);
  } else if (entityFit.strength === "generic") {
    entityScore = 12;
  } else if (entityFit.strength === "unknown") {
    entityScore = 10; // benefit of doubt
  }

  // ─── BUDGET FIT (0-15) ───────────────────────────────────────────
  let budgetScore = 0;
  if (budgetFit.strength === "fit") {
    budgetScore = 15;
    if (project?.requestedAmountEur && grant.maxAmountEur) {
      strengths.push(
        `Budget adapté (plafond ${Math.round(grant.maxAmountEur / 1000)}k€)`
      );
    }
  } else if (budgetFit.strength === "grant_too_big") {
    budgetScore = 6;
  } else if (budgetFit.strength === "grant_too_small") {
    budgetScore = 3;
    if (budgetFit.label) weaknesses.push(budgetFit.label);
  } else {
    budgetScore = 8; // unknown → moderate
  }

  // ─── DEADLINE RUNWAY (0-5) ───────────────────────────────────────
  let deadlineScore = 0;
  if (days === null) {
    deadlineScore = 3; // rolling / unknown
  } else if (days >= 60) {
    deadlineScore = 5;
  } else if (days >= 30) {
    deadlineScore = 4;
  } else if (days >= 14) {
    deadlineScore = 2;
    risks.push(`Deadline dans ${days}j`);
  } else {
    deadlineScore = 0;
    risks.push(`Deadline urgente (${days}j)`);
  }

  // ─── EXPERIENCE & CAPACITY (0-5) ─────────────────────────────────
  let experienceScore = 0;
  const prior = normalize(org.priorGrants);
  const funderNorm = normalize(grant.funder);
  if (prior && funderNorm && prior.includes(funderNorm)) {
    experienceScore = 5;
    strengths.push(`Historique avec ${grant.funder}`);
  } else if (org.priorGrants && grant.grantType) {
    if (
      prior.includes(normalize(grant.grantType)) ||
      prior.includes("appel") ||
      prior.includes("fondation")
    ) {
      experienceScore = 2;
    }
  }

  // Co-financing penalty — small orgs without strong budget
  if (
    grant.coFinancingRequired &&
    (!org.annualBudgetEur || org.annualBudgetEur < 50_000)
  ) {
    risks.push("Cofinancement requis");
  }

  // ─── TOTAL ───────────────────────────────────────────────────────
  let total =
    thematicScore + geoScore + entityScore + budgetScore + deadlineScore + experienceScore;
  total = Math.max(0, Math.min(100, total));

  const difficulty = computeDifficulty(grant);
  const recommendation: "pursue" | "maybe" | "skip" =
    total >= 70 ? "pursue" : total >= 45 ? "maybe" : "skip";

  return {
    score: total,
    difficulty: difficulty.level,
    difficultyLabel: difficulty.label,
    recommendation,
    strengths,
    weaknesses,
    risks,
    summary: buildSummary(total, thematicHits, geoFit.strength, entityFit.strength),
  };
}

function gated(
  reason: string,
  label: string,
  difficulty: { level: "easy" | "medium" | "hard" | "very_hard"; label: string }
): MatchScoreResult {
  return {
    score: 0,
    difficulty: difficulty.level,
    difficultyLabel: difficulty.label,
    recommendation: "skip",
    strengths: [],
    weaknesses: [label],
    risks: [],
    summary: label,
    gatedBy: reason,
  };
}

function buildSummary(
  score: number,
  themeHits: number,
  geoStrength: string,
  entityStrength: string
): string {
  if (score >= 80) {
    return `Excellent match : critères clés alignés (${themeHits} thématiques, géographie et profil éligibles).`;
  }
  if (score >= 65) {
    return `Bon match : alignement thématique correct, à pousser si deadline compatible.`;
  }
  if (score >= 45) {
    return `Match partiel : quelques critères alignent, vérifier les détails d'éligibilité.`;
  }
  if (geoStrength === "none" || entityStrength === "mismatch") {
    return `Peu pertinent : critères d'éligibilité non remplis.`;
  }
  return `Peu pertinent : alignement thématique faible.`;
}

// ─── Difficulty ──────────────────────────────────────────────────

function computeDifficulty(grant: GrantProfile): {
  level: "easy" | "medium" | "hard" | "very_hard";
  label: string;
} {
  let d = 0;

  if (grant.country === "EU") d += 3;
  if (grant.coFinancingRequired) d += 1;
  if (grant.maxAmountEur) {
    if (grant.maxAmountEur > 500_000) d += 2;
    else if (grant.maxAmountEur > 100_000) d += 1;
  }
  if (grant.grantType === "appel_a_projets") d += 1;
  if (grant.grantType === "fondation") d -= 1;

  if (d <= 1) return { level: "easy", label: "Accessible" };
  if (d <= 3) return { level: "medium", label: "Modéré" };
  if (d <= 5) return { level: "hard", label: "Compétitif" };
  return { level: "very_hard", label: "Très compétitif" };
}

// ─── Claude-powered scoring (on-demand, single grant) ────────────

export async function computeMatchScore(
  org: OrgProfile,
  grant: GrantProfile,
  project?: ProjectProfile
): Promise<MatchScoreResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Always compute heuristic first — this seeds the AI with a baseline and
  // acts as our fallback if the API fails. Also lets the AI refine rather
  // than start from zero.
  const heuristic = computeHeuristicScore(org, grant, project);

  if (!apiKey) return heuristic;

  // Don't spend AI tokens on gated grants — the hard gate answer is correct.
  if (heuristic.gatedBy) return heuristic;

  const prompt = buildScoringPrompt(org, grant, project, heuristic);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20250315",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      console.error("Claude API error:", response.status);
      return heuristic;
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";

    const usage = data.usage;
    if (usage) {
      logAiUsage({
        action: "scoring",
        model: "claude-haiku-4-5-20250315",
        inputTokens: usage.input_tokens || 0,
        outputTokens: usage.output_tokens || 0,
      });
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return heuristic;

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      score: Math.max(0, Math.min(100, parsed.score ?? heuristic.score)),
      difficulty: parsed.difficulty || heuristic.difficulty,
      difficultyLabel: parsed.difficultyLabel || heuristic.difficultyLabel,
      recommendation: parsed.recommendation || heuristic.recommendation,
      strengths: parsed.strengths || heuristic.strengths,
      weaknesses: parsed.weaknesses || heuristic.weaknesses,
      risks: parsed.risks || heuristic.risks,
      summary: parsed.summary || heuristic.summary,
    };
  } catch (error) {
    console.error("Scoring error:", error);
    return heuristic;
  }
}

// ─── Batched AI refinement (Stage 3 of funnel matching) ─────────
//
// Sends the top N (default 30) heuristic candidates to Claude in a SINGLE
// API call. Returns refined scores keyed by grant id. Falls back silently
// to the heuristic results when the API key is missing or the call fails —
// the funnel pipeline keeps the heuristic as ground truth either way.

export interface ScoredCandidate {
  grantId: string;
  grant: GrantProfile;
  heuristic: MatchScoreResult;
}

export interface AiRefinementOutcome {
  /** Refined results keyed by grantId. Missing entries → fall back to heuristic. */
  results: Map<string, MatchScoreResult>;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  model: string;
  /** Human-readable reason if the call was skipped or failed. */
  skippedReason?: string;
}

const BATCH_REFINE_MODEL = "claude-haiku-4-5";

export async function refineTopMatchesWithAI(
  org: OrgProfile,
  project: ProjectProfile | undefined,
  candidates: ScoredCandidate[],
  options?: { userId?: string; orgId?: string }
): Promise<AiRefinementOutcome> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const empty = (reason: string): AiRefinementOutcome => ({
    results: new Map(),
    inputTokens: 0,
    outputTokens: 0,
    costUsd: 0,
    model: BATCH_REFINE_MODEL,
    skippedReason: reason,
  });

  if (!apiKey) return empty("missing_api_key");
  if (candidates.length === 0) return empty("no_candidates");

  const prompt = buildBatchScoringPrompt(org, project, candidates);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: BATCH_REFINE_MODEL,
        // Each candidate gets ~80-120 output tokens for {score, reco, summary,
        // strengths, weaknesses, risks}. 30 candidates → ~3.6k tokens. We
        // budget 6k to leave headroom for verbose explanations.
        max_tokens: 6000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      console.error("[refineTopMatchesWithAI] Claude API error:", response.status);
      return empty(`api_error_${response.status}`);
    }

    const data = await response.json();
    const text: string = data.content?.[0]?.text || "";
    const usage = data.usage || {};
    const inputTokens = usage.input_tokens || 0;
    const outputTokens = usage.output_tokens || 0;

    const costUsd = await logAiUsage({
      userId: options?.userId,
      orgId: options?.orgId,
      action: "scoring",
      model: BATCH_REFINE_MODEL,
      inputTokens,
      outputTokens,
      metadata: { mode: "batch_refine", candidates: String(candidates.length) },
    });

    const parsed = parseBatchResponse(text, candidates);

    return {
      results: parsed,
      inputTokens,
      outputTokens,
      costUsd: costUsd || 0,
      model: BATCH_REFINE_MODEL,
      skippedReason: parsed.size === 0 ? "parse_failed" : undefined,
    };
  } catch (error) {
    console.error("[refineTopMatchesWithAI] error:", error);
    return empty("exception");
  }
}

function parseBatchResponse(
  text: string,
  candidates: ScoredCandidate[]
): Map<string, MatchScoreResult> {
  const out = new Map<string, MatchScoreResult>();

  // Find the JSON array in the model response. Models occasionally wrap
  // it in ```json fences or prose — strip both.
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (!arrayMatch) return out;

  let parsed: unknown;
  try {
    parsed = JSON.parse(arrayMatch[0]);
  } catch {
    return out;
  }
  if (!Array.isArray(parsed)) return out;

  for (const entry of parsed) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;

    // Two ways to identify the candidate: by "i" (1-based index) or by
    // "grantId". Prefer grantId when present.
    let candidate: ScoredCandidate | undefined;
    if (typeof e.grantId === "string") {
      candidate = candidates.find((c) => c.grantId === e.grantId);
    } else if (typeof e.i === "number") {
      candidate = candidates[e.i - 1];
    }
    if (!candidate) continue;

    const heuristic = candidate.heuristic;
    const score = clamp(num(e.score, heuristic.score), 0, 100);
    const recommendation =
      e.recommendation === "pursue" || e.recommendation === "maybe" || e.recommendation === "skip"
        ? e.recommendation
        : score >= 70 ? "pursue" : score >= 45 ? "maybe" : "skip";

    out.set(candidate.grantId, {
      score,
      difficulty: heuristic.difficulty,
      difficultyLabel: heuristic.difficultyLabel,
      recommendation,
      strengths: strArr(e.strengths, heuristic.strengths),
      weaknesses: strArr(e.weaknesses, heuristic.weaknesses),
      risks: strArr(e.risks, heuristic.risks),
      summary: typeof e.summary === "string" && e.summary.trim() ? e.summary : heuristic.summary,
    });
  }

  return out;
}

function num(v: unknown, fallback: number): number {
  return typeof v === "number" && isFinite(v) ? v : fallback;
}
function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
function strArr(v: unknown, fallback: string[]): string[] {
  if (!Array.isArray(v)) return fallback;
  return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

function buildBatchScoringPrompt(
  org: OrgProfile,
  project: ProjectProfile | undefined,
  candidates: ScoredCandidate[]
): string {
  const orgBlock = `ORGANISATION:
- Nom: ${org.name}
- Statut: ${org.legalStatus || "—"}
- Mission: ${truncate(org.mission, 400)}
- Thématiques: ${org.thematicAreas?.join(", ") || "—"}
- Bénéficiaires: ${org.beneficiaries?.join(", ") || "—"}
- Zones: ${org.geographicFocus?.join(", ") || "—"}
- Budget annuel: ${org.annualBudgetEur ? org.annualBudgetEur + " €" : "—"}
- Équipe: ${org.teamSize || "—"}
- Historique: ${truncate(org.priorGrants, 200)}`;

  const projectBlock = project
    ? `PROJET:
- Nom: ${project.name}
- Résumé: ${truncate(project.summary, 400)}
- Objectifs: ${project.objectives?.slice(0, 5).join("; ") || "—"}
- Bénéficiaires: ${project.targetBeneficiaries?.join(", ") || "—"}
- Géographie: ${project.targetGeography?.join(", ") || "—"}
- Budget demandé: ${project.requestedAmountEur ? project.requestedAmountEur + " €" : "—"}
- Durée: ${project.durationMonths ? project.durationMonths + " mois" : "—"}`
    : `PROJET: pas de projet ciblé — analyse au niveau organisation.`;

  // For each candidate include the heuristic baseline so the model can
  // adjust up/down rather than start from scratch. Keep summaries trimmed
  // to keep input tokens predictable: 30 candidates × ~250 chars summary
  // ≈ 7.5k chars input.
  const grantsBlock = candidates
    .map((c, idx) => {
      const g = c.grant;
      const h = c.heuristic;
      return `[${idx + 1}] grantId=${c.grantId}
  Titre: ${g.title}
  Bailleur: ${g.funder || "—"} | Type: ${g.grantType || "—"} | Pays éligibles: ${g.eligibleCountries?.join(", ") || "—"}
  Entités: ${g.eligibleEntities?.join(", ") || "—"} | Plafond: ${g.maxAmountEur ? g.maxAmountEur + " €" : "—"} | Deadline: ${g.deadline || "—"}
  Thématiques: ${g.thematicAreas?.join(", ") || "—"}
  Résumé: ${truncate(g.summary, 350)}
  Heuristique: ${h.score}/100 (${h.recommendation}) — forces: ${h.strengths.slice(0, 3).join("; ") || "—"} / faiblesses: ${h.weaknesses.slice(0, 2).join("; ") || "—"}`;
    })
    .join("\n\n");

  return `Tu es un expert en financement pour les ONG francophones. Tu reçois ${candidates.length} subventions pré-sélectionnées par un filtre heuristique. Ta mission: ré-évaluer chacune avec un œil expert et produire un JSON.

${orgBlock}

${projectBlock}

SUBVENTIONS CANDIDATES (${candidates.length}):
${grantsBlock}

Ajuste les scores à la hausse ou à la baisse selon ton analyse réelle. N'inflate PAS pour faire plaisir — sois honnête sur la pertinence et la compétition. Tiens compte de:
- l'alignement thématique réel (titre + résumé + bailleur, pas juste les tags)
- la cohérence du profil avec le bailleur
- les critères implicites dans le résumé (taille minimale, expérience requise, partenaires…)
- la deadline et la lourdeur du dossier

Retourne UNIQUEMENT un tableau JSON (pas de markdown, pas de prose), une entrée par subvention, dans l'ordre fourni:
[
  {
    "i": 1,
    "grantId": "<grantId fourni>",
    "score": <0-100>,
    "recommendation": "pursue" | "maybe" | "skip",
    "summary": "<1-2 phrases concrètes>",
    "strengths": ["raison spécifique 1", "raison 2"],
    "weaknesses": ["point faible concret"],
    "risks": ["risque opérationnel ou compétitif"]
  },
  ...
]

Règles:
- 80+ = match excellent (pursue)
- 60-79 = bon match (pursue)
- 45-59 = match partiel (maybe)
- <45 = peu pertinent (skip)
- Cite des éléments précis du résumé dans strengths/weaknesses, pas de blabla.`;
}

function truncate(s: string | undefined, n: number): string {
  if (!s) return "—";
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function buildScoringPrompt(
  org: OrgProfile,
  grant: GrantProfile,
  project: ProjectProfile | undefined,
  heuristic: MatchScoreResult
): string {
  return `Tu es un expert en financement pour les ONG francophones. Tu évalues si une subvention est pertinente pour une organisation.

ORGANISATION:
- Nom: ${org.name}
- Statut: ${org.legalStatus || "Non spécifié"}
- Mission: ${org.mission || "Non spécifiée"}
- Thématiques: ${org.thematicAreas?.join(", ") || "—"}
- Bénéficiaires: ${org.beneficiaries?.join(", ") || "—"}
- Zones: ${org.geographicFocus?.join(", ") || "—"}
- Budget annuel: ${org.annualBudgetEur ? org.annualBudgetEur + " €" : "—"}
- Taille équipe: ${org.teamSize || "—"}
- Historique subventions: ${org.priorGrants || "—"}

${project ? `PROJET:
- Nom: ${project.name}
- Résumé: ${project.summary || "—"}
- Objectifs: ${project.objectives?.join("; ") || "—"}
- Bénéficiaires: ${project.targetBeneficiaries?.join(", ") || "—"}
- Géographie: ${project.targetGeography?.join(", ") || "—"}
- Budget demandé: ${project.requestedAmountEur ? project.requestedAmountEur + " €" : "—"}
- Durée: ${project.durationMonths ? project.durationMonths + " mois" : "—"}` : "PROJET: Pas de projet ciblé — scoring sur la base du profil organisation."}

SUBVENTION:
- Titre: ${grant.title}
- Résumé: ${grant.summary?.slice(0, 800) || "—"}
- Bailleur: ${grant.funder || "—"}
- Thématiques: ${grant.thematicAreas?.join(", ") || "—"}
- Pays éligibles: ${grant.eligibleCountries?.join(", ") || "—"}
- Entités éligibles: ${grant.eligibleEntities?.join(", ") || "—"}
- Plafond: ${grant.maxAmountEur ? grant.maxAmountEur + " €" : "—"}
- Cofinancement: ${grant.coFinancingRequired ? "requis" : "non requis / non précisé"}
- Deadline: ${grant.deadline || "—"}
- Type: ${grant.grantType || "—"}

SCORE HEURISTIQUE DE RÉFÉRENCE: ${heuristic.score}/100 (${heuristic.recommendation})
Points forts détectés: ${heuristic.strengths.join("; ") || "—"}
Points faibles détectés: ${heuristic.weaknesses.join("; ") || "—"}

Ajuste ce score à la hausse ou à la baisse en fonction de ton analyse plus fine. N'augmente PAS le score artificiellement — sois honnête. Tiens compte de la compétition réelle et des critères d'éligibilité implicites dans le résumé.

Retourne UNIQUEMENT un JSON valide (pas de markdown):
{
  "score": number (0-100),
  "difficulty": "easy" | "medium" | "hard" | "very_hard",
  "difficultyLabel": "Accessible" | "Modéré" | "Compétitif" | "Très compétitif",
  "recommendation": "pursue" | "maybe" | "skip",
  "strengths": ["raison concrète et spécifique 1", "raison 2"],
  "weaknesses": ["point faible concret 1"],
  "risks": ["risque 1"],
  "summary": "Résumé en 1-2 phrases, sans blabla"
}

Règles:
- 80+ = match excellent, à poursuivre absolument
- 60-79 = bon match, recommandation "pursue"
- 45-59 = match partiel, recommandation "maybe"
- <45 = peu pertinent, recommandation "skip"
- Cite des éléments précis du résumé de la subvention dans les strengths/weaknesses.`;
}
