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

export interface LogframeData {
  general_objective?: string;
  specific_objectives?: string[];
  beneficiaries_direct?: string;
  beneficiaries_indirect?: string;
  beneficiaries_count?: string;
  activities?: string[];
  methodology?: string;
  partners?: string;
  expected_results?: { result?: string; indicator?: string }[];
  sustainability?: string;
  problem?: string;
  themes?: string[];
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
    logframe?: LogframeData;
  };
  grant: {
    title: string;
    summary?: string;
    funder?: string;
    country?: string;
    language?: string;
    thematicAreas?: string[];
    eligibleEntities?: string[];
    maxAmountEur?: number;
    coFinancingRequired?: boolean;
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
  const lf = project?.logframe;

  let prompt = `Tu es un expert en rédaction de propositions de subventions pour les ONG européennes.
Tu dois rédiger un PREMIER BROUILLON complet et professionnel, adapté spécifiquement au bailleur et à l'appel à propositions.

═══ APPEL À PROPOSITIONS ═══
Titre: ${grant.title}
Bailleur: ${grant.funder || "Non spécifié"}
Résumé: ${grant.summary || "Non spécifié"}
Pays: ${grant.country || "Non spécifié"}`;

  if (grant.thematicAreas?.length) {
    prompt += `\nThématiques prioritaires du bailleur: ${grant.thematicAreas.join(", ")}`;
  }
  if (grant.eligibleEntities?.length) {
    prompt += `\nEntités éligibles: ${grant.eligibleEntities.join(", ")}`;
  }
  if (grant.maxAmountEur) {
    prompt += `\nMontant max: ${grant.maxAmountEur.toLocaleString("fr-FR")}€`;
  }
  if (grant.coFinancingRequired) {
    prompt += `\nCofinancement requis: Oui`;
  }

  prompt += `

═══ ORGANISATION SOUMISSIONNAIRE ═══
Nom: ${org.name}
Mission: ${org.mission || "[À COMPLÉTER]"}
Thématiques: ${org.thematicAreas?.join(", ") || "[À COMPLÉTER]"}
Zone géographique: ${org.geographicFocus?.join(", ") || "[À COMPLÉTER]"}
Expérience subventions: ${org.priorGrants || "[À COMPLÉTER]"}`;

  if (project) {
    prompt += `

═══ PROJET — CADRE LOGIQUE ═══
Nom du projet: ${project.name}
Résumé: ${project.summary || "[À COMPLÉTER]"}`;

    if (lf?.problem) {
      prompt += `\nProblématique identifiée: ${lf.problem}`;
    }
    if (lf?.general_objective) {
      prompt += `\nObjectif général: ${lf.general_objective}`;
    }
    if (lf?.specific_objectives?.length) {
      prompt += `\nObjectifs spécifiques:\n${lf.specific_objectives.filter(Boolean).map((o, i) => `  ${i + 1}. ${o}`).join("\n")}`;
    }
    if (lf?.activities?.length) {
      prompt += `\nActivités prévues:\n${lf.activities.filter(Boolean).map((a, i) => `  ${i + 1}. ${a}`).join("\n")}`;
    }
    if (lf?.methodology) {
      prompt += `\nMéthodologie: ${lf.methodology}`;
    }
    if (lf?.beneficiaries_direct || lf?.beneficiaries_indirect) {
      prompt += `\nBénéficiaires directs: ${lf.beneficiaries_direct || "[À COMPLÉTER]"}`;
      prompt += `\nBénéficiaires indirects: ${lf.beneficiaries_indirect || "[À COMPLÉTER]"}`;
      if (lf.beneficiaries_count) {
        prompt += `\nNombre estimé: ${lf.beneficiaries_count}`;
      }
    }
    if (lf?.expected_results?.length) {
      prompt += `\nRésultats attendus:`;
      for (const r of lf.expected_results) {
        if (r.result) prompt += `\n  - Résultat: ${r.result}${r.indicator ? ` | Indicateur: ${r.indicator}` : ""}`;
      }
    }
    if (lf?.partners) {
      prompt += `\nPartenaires: ${lf.partners}`;
    }
    if (lf?.sustainability) {
      prompt += `\nStratégie de durabilité: ${lf.sustainability}`;
    }

    prompt += `\nMontant demandé: ${project.requestedAmountEur ? project.requestedAmountEur.toLocaleString("fr-FR") + "€" : "[À COMPLÉTER]"}`;
    prompt += `\nDurée: ${project.durationMonths ? project.durationMonths + " mois" : "[À COMPLÉTER]"}`;
  }

  if (matchAnalysis) {
    prompt += `

═══ ANALYSE DE COMPATIBILITÉ ═══
Score: ${matchAnalysis.score}/100
Points forts: ${matchAnalysis.strengths.join("; ")}
Points faibles à adresser: ${matchAnalysis.weaknesses.join("; ")}
→ IMPORTANT: La proposition doit capitaliser sur les points forts et atténuer les faiblesses identifiées.`;
  }

  prompt += `

═══ INSTRUCTIONS ═══
Rédige en ${language}. Pour chaque section, commence par "## [Titre]" suivi du contenu.
Utilise "[À COMPLÉTER]" UNIQUEMENT quand une information manque vraiment.

IMPORTANT:
- Adapte le vocabulaire et le ton au bailleur (${grant.funder || "bailleur"})
- Utilise les données du cadre logique pour alimenter chaque section
- Relie explicitement les activités aux objectifs et aux résultats
- Chaque indicateur doit être mesurable (SMART)

## Résumé exécutif
(150 mots — pitch concis reliant le projet à l'appel)

## Contexte et problématique
(250 mots — problème adressé, données chiffrées, lien avec les priorités du bailleur)

## Objectifs
(Objectif général + objectifs spécifiques SMART, issus du cadre logique)

## Cadre logique
(Tableau: Objectif → Résultats → Activités → Indicateurs → Sources de vérification. Format texte avec tirets alignés.)

## Activités et méthodologie
(300 mots — description détaillée, chronologie, approche)

## Bénéficiaires cibles
(150 mots — directs/indirects, critères de sélection, nombre)

## Résultats attendus et indicateurs
(200 mots — résultats mesurables, indicateurs quantitatifs et qualitatifs)

## Budget prévisionnel
(Ventilation par poste: RH, activités, équipement, frais généraux${grant.coFinancingRequired ? ", cofinancement" : ""}. Total cohérent avec le montant demandé.)

## Durabilité et pérennisation
(150 mots — comment les résultats perdurent après le financement)

## Partenariats et capacités organisationnelles
(150 mots — partenaires, rôles, track record de l'organisation)

Style: professionnel, orienté bailleur, spécifique. N'invente JAMAIS de données — utilise [À COMPLÉTER] si une info manque.`;

  return prompt;
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
  const lf = project?.logframe;

  const sections: { title: string; content: string }[] = [
    {
      title: "Résumé exécutif",
      content: `${org.name} propose ${project ? `le projet "${project.name}"` : "un projet"} dans le cadre de l'appel "${grant.title}" (${grant.funder || "bailleur"}). ${project?.summary || "[À COMPLÉTER : résumé du projet]"}`,
    },
    {
      title: "Contexte et problématique",
      content: lf?.problem
        ? `${lf.problem}\n\n[À COMPLÉTER : données chiffrées et sources]`
        : "[À COMPLÉTER : Décrivez le contexte et le problème adressé.]",
    },
    {
      title: "Objectifs",
      content: [
        lf?.general_objective ? `Objectif général : ${lf.general_objective}` : null,
        lf?.specific_objectives?.filter(Boolean).length
          ? `Objectifs spécifiques :\n${lf.specific_objectives.filter(Boolean).map((o, i) => `${i + 1}. ${o}`).join("\n")}`
          : project?.objectives?.length
            ? project.objectives.map((o, i) => `${i + 1}. ${o}`).join("\n")
            : null,
      ].filter(Boolean).join("\n\n") || "[À COMPLÉTER : Objectifs SMART]",
    },
    {
      title: "Cadre logique",
      content: buildFallbackLogframe(lf, project),
    },
    {
      title: "Activités et méthodologie",
      content: [
        lf?.activities?.filter(Boolean).length
          ? `Activités :\n${lf.activities.filter(Boolean).map((a, i) => `${i + 1}. ${a}`).join("\n")}`
          : null,
        lf?.methodology ? `\nMéthodologie : ${lf.methodology}` : null,
      ].filter(Boolean).join("\n") || "[À COMPLÉTER : Activités et méthodologie]",
    },
    {
      title: "Bénéficiaires cibles",
      content: [
        lf?.beneficiaries_direct ? `Bénéficiaires directs : ${lf.beneficiaries_direct}` : null,
        lf?.beneficiaries_indirect ? `Bénéficiaires indirects : ${lf.beneficiaries_indirect}` : null,
        lf?.beneficiaries_count ? `Nombre estimé : ${lf.beneficiaries_count}` : null,
      ].filter(Boolean).join("\n") || project?.targetBeneficiaries?.join(", ") || "[À COMPLÉTER : Bénéficiaires directs et indirects]",
    },
    {
      title: "Résultats attendus et indicateurs",
      content: lf?.expected_results?.length
        ? lf.expected_results.map((r, i) => `- Résultat ${i + 1}: ${r.result || "[À COMPLÉTER]"}\n  Indicateur: ${r.indicator || "[À COMPLÉTER]"}`).join("\n")
        : project?.indicators?.map((ind, i) => `- Indicateur ${i + 1}: ${ind}`).join("\n") || "[À COMPLÉTER : Résultats avec indicateurs mesurables]",
    },
    {
      title: "Budget prévisionnel",
      content: project?.requestedAmountEur
        ? `Budget total demandé : ${project.requestedAmountEur.toLocaleString("fr-FR")}€\nDurée : ${project.durationMonths || "[À COMPLÉTER]"} mois${grant.coFinancingRequired ? "\nCofinancement requis par le bailleur." : ""}\n\n[À COMPLÉTER : Ventilation par poste]`
        : "[À COMPLÉTER : Budget détaillé]",
    },
    {
      title: "Durabilité et pérennisation",
      content: lf?.sustainability || "[À COMPLÉTER : Stratégie de pérennisation après financement]",
    },
    {
      title: "Partenariats et capacités organisationnelles",
      content: [
        lf?.partners ? `Partenaires : ${lf.partners}` : null,
        `${org.name} dispose d'une expérience de ${org.priorGrants || "[À COMPLÉTER]"}.`,
      ].filter(Boolean).join("\n\n"),
    },
  ];

  return {
    sections,
    language: grant.language === "en" ? "en" : "fr",
    generatedAt: new Date().toISOString(),
  };
}

function buildFallbackLogframe(lf?: LogframeData, project?: ProposalInput["project"]): string {
  if (!lf && !project) return "[À COMPLÉTER : Cadre logique]";

  const lines: string[] = [];
  lines.push("Objectif général : " + (lf?.general_objective || "[À COMPLÉTER]"));
  lines.push("");

  const objectives = lf?.specific_objectives?.filter(Boolean) || project?.objectives || [];
  const results = lf?.expected_results || [];
  const activities = lf?.activities?.filter(Boolean) || [];

  for (let i = 0; i < Math.max(objectives.length, 1); i++) {
    lines.push(`Objectif spécifique ${i + 1} : ${objectives[i] || "[À COMPLÉTER]"}`);
    if (results[i]) {
      lines.push(`  → Résultat : ${results[i].result || "[À COMPLÉTER]"}`);
      lines.push(`  → Indicateur : ${results[i].indicator || "[À COMPLÉTER]"}`);
    }
    if (activities[i]) {
      lines.push(`  → Activité : ${activities[i]}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
