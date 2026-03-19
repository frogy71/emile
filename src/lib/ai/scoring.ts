/**
 * GrantScore — AI-powered grant matching
 *
 * Uses Claude API to compute a compatibility score between
 * an organization/project profile and a grant opportunity.
 *
 * Returns a structured score with explanation.
 */

export interface MatchScoreResult {
  score: number; // 0-100
  difficulty: "easy" | "medium" | "hard" | "very_hard"; // How hard it is to get the grant
  difficultyLabel: string; // Human-readable difficulty
  recommendation: "pursue" | "maybe" | "skip";
  strengths: string[];
  weaknesses: string[];
  risks: string[];
  summary: string;
}

export interface OrgProfile {
  name: string;
  mission?: string;
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

/**
 * Compute match score using Claude API
 */
export async function computeMatchScore(
  org: OrgProfile,
  grant: GrantProfile,
  project?: ProjectProfile
): Promise<MatchScoreResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    // Fallback: simple heuristic scoring when no API key
    return computeHeuristicScore(org, grant, project);
  }

  const prompt = buildScoringPrompt(org, grant, project);

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
      return computeHeuristicScore(org, grant, project);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        score: Math.max(0, Math.min(100, result.score || 50)),
        difficulty: result.difficulty || "medium",
        difficultyLabel: result.difficultyLabel || "Modéré",
        recommendation: result.recommendation || "maybe",
        strengths: result.strengths || [],
        weaknesses: result.weaknesses || [],
        risks: result.risks || [],
        summary: result.summary || "",
      };
    }
  } catch (error) {
    console.error("Scoring error:", error);
  }

  return computeHeuristicScore(org, grant, project);
}

/**
 * Build the scoring prompt for Claude
 */
function buildScoringPrompt(
  org: OrgProfile,
  grant: GrantProfile,
  project?: ProjectProfile
): string {
  return `Tu es un expert en matching de subventions pour les ONG européennes.

PROFIL DE L'ORGANISATION:
- Nom: ${org.name}
- Mission: ${org.mission || "Non spécifiée"}
- Thématiques: ${org.thematicAreas?.join(", ") || "Non spécifiées"}
- Bénéficiaires: ${org.beneficiaries?.join(", ") || "Non spécifiés"}
- Zones géographiques: ${org.geographicFocus?.join(", ") || "Non spécifiées"}
- Budget annuel: ${org.annualBudgetEur ? org.annualBudgetEur + "€" : "Non spécifié"}
- Taille équipe: ${org.teamSize || "Non spécifiée"}
- Langues: ${org.languages?.join(", ") || "Non spécifiées"}
- Expérience grants: ${org.priorGrants || "Non spécifiée"}

${project ? `PROJET:
- Nom: ${project.name}
- Résumé: ${project.summary || "Non spécifié"}
- Objectifs: ${project.objectives?.join("; ") || "Non spécifiés"}
- Bénéficiaires cibles: ${project.targetBeneficiaries?.join(", ") || "Non spécifiés"}
- Géographie cible: ${project.targetGeography?.join(", ") || "Non spécifiée"}
- Montant demandé: ${project.requestedAmountEur ? project.requestedAmountEur + "€" : "Non spécifié"}
- Durée: ${project.durationMonths ? project.durationMonths + " mois" : "Non spécifiée"}` : ""}

SUBVENTION:
- Titre: ${grant.title}
- Résumé: ${grant.summary || "Non spécifié"}
- Bailleur: ${grant.funder || "Non spécifié"}
- Pays: ${grant.country || "Non spécifié"}
- Thématiques: ${grant.thematicAreas?.join(", ") || "Non spécifiées"}
- Entités éligibles: ${grant.eligibleEntities?.join(", ") || "Non spécifiées"}
- Montant max: ${grant.maxAmountEur ? grant.maxAmountEur + "€" : "Non spécifié"}
- Cofinancement requis: ${grant.coFinancingRequired ? "Oui" : "Non / Non spécifié"}
- Deadline: ${grant.deadline || "Non spécifiée"}

Score cette correspondance de 0 à 100. Évalue aussi la difficulté d'obtention.
Retourne UNIQUEMENT un JSON valide:
{
  "score": number,
  "difficulty": "easy" | "medium" | "hard" | "very_hard",
  "difficultyLabel": "Accessible" | "Modéré" | "Compétitif" | "Très compétitif",
  "recommendation": "pursue" | "maybe" | "skip",
  "strengths": ["raison 1", "raison 2"],
  "weaknesses": ["point faible 1"],
  "risks": ["risque 1"],
  "summary": "Résumé en 1-2 phrases"
}

Sois honnête. Un score de 70+ = bon match. Ne gonfle pas les scores.
Pour la difficulté: easy = subvention simple/FDVA, medium = AAP régional, hard = EU/gros montants, very_hard = Horizon Europe/gros consortium.`;
}

/**
 * Fallback heuristic scoring (no API needed)
 */
function computeHeuristicScore(
  org: OrgProfile,
  grant: GrantProfile,
  project?: ProjectProfile
): MatchScoreResult {
  let score = 40; // Base score
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const risks: string[] = [];

  // Thematic match
  const orgThemes = new Set(
    (org.thematicAreas || []).map((t) => t.toLowerCase())
  );
  const grantThemes = (grant.thematicAreas || []).map((t) => t.toLowerCase());
  const themeOverlap = grantThemes.filter((t) =>
    [...orgThemes].some(
      (ot) => t.includes(ot) || ot.includes(t)
    )
  );
  if (themeOverlap.length > 0) {
    score += 15 + Math.min(themeOverlap.length * 5, 15);
    strengths.push("Thématique alignée");
  } else if (grantThemes.length > 0) {
    weaknesses.push("Thématique partielle");
  }

  // Geographic match
  const orgGeo = new Set(
    (org.geographicFocus || []).map((g) => g.toLowerCase())
  );
  const grantCountries = (grant.eligibleCountries || []).map((c) =>
    c.toLowerCase()
  );
  if (
    grantCountries.some(
      (c) => c === "fr" || [...orgGeo].some((g) => g.includes("france"))
    )
  ) {
    score += 10;
    strengths.push("Éligibilité géographique");
  }

  // Entity type match
  const eligibleTypes = (grant.eligibleEntities || []).map((e) =>
    e.toLowerCase()
  );
  if (
    eligibleTypes.some(
      (e) =>
        e.includes("association") ||
        e.includes("ong") ||
        e.includes("nonprofit")
    )
  ) {
    score += 10;
    strengths.push("Profil éligible");
  }

  // Budget match
  if (project?.requestedAmountEur && grant.maxAmountEur) {
    if (project.requestedAmountEur <= grant.maxAmountEur) {
      score += 5;
      strengths.push("Budget compatible");
    } else {
      score -= 5;
      weaknesses.push("Budget trop élevé");
    }
  }

  // Co-financing risk
  if (grant.coFinancingRequired) {
    risks.push("Cofinancement requis");
  }

  // Deadline check
  if (grant.deadline) {
    const daysLeft = Math.ceil(
      (new Date(grant.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysLeft < 30) {
      risks.push("Deadline proche");
    }
    if (daysLeft > 180) {
      strengths.push("Deadline éloignée");
    }
  }

  score = Math.max(10, Math.min(95, score));

  const recommendation =
    score >= 70 ? "pursue" : score >= 50 ? "maybe" : "skip";

  // Compute difficulty based on grant characteristics
  const difficulty = computeDifficulty(grant);

  return {
    score,
    difficulty: difficulty.level,
    difficultyLabel: difficulty.label,
    recommendation,
    strengths,
    weaknesses,
    risks,
    summary:
      score >= 70
        ? "Bonne correspondance — cette subvention mérite d'être poursuivie."
        : score >= 50
          ? "Correspondance partielle — à évaluer selon vos priorités."
          : "Correspondance faible — autres opportunités probablement plus pertinentes.",
  };
}

/**
 * Compute grant difficulty level
 * Based on: grant type, funding source, amount, co-financing, competition level
 */
function computeDifficulty(grant: GrantProfile): {
  level: "easy" | "medium" | "hard" | "very_hard";
  label: string;
} {
  let difficultyScore = 0; // 0 = easy, higher = harder

  // EU grants are harder (competition, consortium, co-financing)
  if (grant.country === "EU") {
    difficultyScore += 3;
  }

  // Co-financing required = harder
  if (grant.coFinancingRequired) {
    difficultyScore += 1;
  }

  // Large amounts = more competition = harder
  if (grant.maxAmountEur) {
    if (grant.maxAmountEur > 500000) difficultyScore += 2;
    else if (grant.maxAmountEur > 100000) difficultyScore += 1;
  }

  // Appels à projets are more competitive than subventions
  if (grant.grantType === "appel_a_projets") {
    difficultyScore += 1;
  }

  // Fondation = generally more accessible
  if (grant.grantType === "fondation") {
    difficultyScore -= 1;
  }

  if (difficultyScore <= 1) {
    return { level: "easy", label: "Accessible" };
  } else if (difficultyScore <= 3) {
    return { level: "medium", label: "Modéré" };
  } else if (difficultyScore <= 5) {
    return { level: "hard", label: "Compétitif" };
  } else {
    return { level: "very_hard", label: "Très compétitif" };
  }
}
