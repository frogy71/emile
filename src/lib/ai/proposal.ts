/**
 * One-Click Proposal™ — AI proposal draft generation
 *
 * Uses Claude API to generate a structured first-draft proposal
 * based on the org profile, project data, and grant description.
 */

import { logAiUsage } from "./usage-tracker";

export interface ProposalDraft {
  sections: {
    title: string;
    content: string;
  }[];
  language: string;
  generatedAt: string;
}

export interface ProposalInput {
  organization: {
    name: string;
    mission?: string;
    thematicAreas?: string[];
    beneficiaries?: string[];
    geographicFocus?: string[];
    priorGrants?: string;
  };
  project?: {
    name: string;
    summary?: string;
    objectives?: string[];
    targetBeneficiaries?: string[];
    targetGeography?: string[];
    requestedAmountEur?: number;
    durationMonths?: number;
    indicators?: string[];
  };
  grant: {
    title: string;
    summary?: string;
    funder?: string;
    country?: string;
    language?: string;
  };
  matchAnalysis?: {
    score: number;
    strengths: string[];
    weaknesses: string[];
  };
}

/**
 * Generate a proposal draft using Claude API
 */
export async function generateProposal(
  input: ProposalInput
): Promise<ProposalDraft> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return generateFallbackProposal(input);
  }

  const language = input.grant.language === "en" ? "anglais" : "français";
  const prompt = buildProposalPrompt(input, language);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      console.error("Claude API error:", response.status);
      return generateFallbackProposal(input);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";

    // Track AI usage
    const usage = data.usage;
    if (usage) {
      logAiUsage({
        action: "proposal",
        model: "claude-sonnet-4-20250514",
        inputTokens: usage.input_tokens || 0,
        outputTokens: usage.output_tokens || 0,
      });
    }

    // Parse sections from the response
    const sections = parseSections(text);

    return {
      sections,
      language,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Proposal generation error:", error);
    return generateFallbackProposal(input);
  }
}

function buildProposalPrompt(input: ProposalInput, language: string): string {
  const { organization: org, project, grant, matchAnalysis } = input;

  return `Tu es un expert en rédaction de propositions de subventions pour les ONG européennes.

Rédige un PREMIER BROUILLON de proposition structuré pour la subvention suivante.

ORGANISATION: ${org.name}
Mission: ${org.mission || "[À COMPLÉTER]"}
Thématiques: ${org.thematicAreas?.join(", ") || "[À COMPLÉTER]"}
Bénéficiaires: ${org.beneficiaries?.join(", ") || "[À COMPLÉTER]"}
Expérience: ${org.priorGrants || "[À COMPLÉTER]"}

${project ? `PROJET: ${project.name}
Résumé: ${project.summary || "[À COMPLÉTER]"}
Objectifs: ${project.objectives?.join("; ") || "[À COMPLÉTER]"}
Bénéficiaires cibles: ${project.targetBeneficiaries?.join(", ") || "[À COMPLÉTER]"}
Montant: ${project.requestedAmountEur ? project.requestedAmountEur + "€" : "[À COMPLÉTER]"}
Durée: ${project.durationMonths ? project.durationMonths + " mois" : "[À COMPLÉTER]"}
Indicateurs: ${project.indicators?.join("; ") || "[À COMPLÉTER]"}` : ""}

SUBVENTION: ${grant.title}
Bailleur: ${grant.funder || "Non spécifié"}
Résumé: ${grant.summary || "Non spécifié"}

${matchAnalysis ? `ANALYSE: Score ${matchAnalysis.score}/100. Points forts: ${matchAnalysis.strengths.join(", ")}. Points faibles: ${matchAnalysis.weaknesses.join(", ")}.` : ""}

Rédige en ${language} les sections suivantes. Pour chaque section, commence par "## [Titre de la section]" suivi du contenu.
Utilise "[À COMPLÉTER]" quand une information manque.

## Résumé exécutif
(150 mots max)

## Contexte et problématique
(200 mots)

## Objectifs
(Format SMART, 3-5 objectifs)

## Activités et méthodologie
(250 mots)

## Bénéficiaires cibles
(100 mots)

## Résultats attendus et indicateurs
(150 mots)

## Durabilité
(100 mots)

## Budget prévisionnel
(100 mots — grandes lignes)

## Partenariats et capacités
(100 mots)

Style: professionnel, clair, orienté bailleur. Sois spécifique aux données fournies. N'invente rien — utilise [À COMPLÉTER] si une info manque.`;
}

function parseSections(text: string): { title: string; content: string }[] {
  const sections: { title: string; content: string }[] = [];
  const parts = text.split(/^## /gm).filter(Boolean);

  for (const part of parts) {
    const lines = part.trim().split("\n");
    const title = lines[0]?.trim() || "Section";
    const content = lines.slice(1).join("\n").trim();
    if (content) {
      sections.push({ title, content });
    }
  }

  return sections.length > 0
    ? sections
    : [{ title: "Brouillon", content: text }];
}

function generateFallbackProposal(input: ProposalInput): ProposalDraft {
  const { organization: org, project, grant } = input;

  return {
    sections: [
      {
        title: "Résumé exécutif",
        content: `${org.name} propose ${project ? `le projet "${project.name}"` : "un projet"} dans le cadre de l'appel "${grant.title}" (${grant.funder || "bailleur"}). ${project?.summary || "[À COMPLÉTER : résumé du projet]"}`,
      },
      {
        title: "Contexte et problématique",
        content: `[À COMPLÉTER : Décrivez le contexte et le problème que votre projet adresse. Appuyez-vous sur des données et sources fiables.]`,
      },
      {
        title: "Objectifs",
        content: project?.objectives?.map((o, i) => `${i + 1}. ${o}`).join("\n") || "[À COMPLÉTER : Listez 3-5 objectifs SMART]",
      },
      {
        title: "Activités et méthodologie",
        content: `[À COMPLÉTER : Décrivez les activités principales et la méthodologie d'intervention.]`,
      },
      {
        title: "Bénéficiaires cibles",
        content: project?.targetBeneficiaries?.join(", ") || "[À COMPLÉTER : Décrivez les bénéficiaires directs et indirects]",
      },
      {
        title: "Résultats attendus et indicateurs",
        content: project?.indicators?.map((ind, i) => `- Indicateur ${i + 1}: ${ind}`).join("\n") || "[À COMPLÉTER : Résultats attendus avec indicateurs mesurables]",
      },
      {
        title: "Durabilité",
        content: "[À COMPLÉTER : Comment les résultats seront maintenus après le financement]",
      },
      {
        title: "Budget prévisionnel",
        content: project?.requestedAmountEur
          ? `Budget total demandé : ${project.requestedAmountEur.toLocaleString("fr-FR")}€\nDurée : ${project.durationMonths || "[À COMPLÉTER]"} mois\n\n[À COMPLÉTER : Ventilation du budget par poste]`
          : "[À COMPLÉTER : Budget détaillé]",
      },
      {
        title: "Partenariats et capacités",
        content: `${org.name} dispose d'une expérience de ${org.priorGrants || "[À COMPLÉTER]"}.\n\n[À COMPLÉTER : Partenaires impliqués et leurs rôles]`,
      },
    ],
    language: grant.language === "en" ? "en" : "fr",
    generatedAt: new Date().toISOString(),
  };
}
