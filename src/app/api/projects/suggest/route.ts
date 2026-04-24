import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { logAiUsage } from "@/lib/ai/usage-tracker";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * POST /api/projects/suggest — extract a structured project draft from a free
 * text description.
 *
 * The caller sends a paragraph or two describing what they want to do; we ask
 * Claude to populate the wizard fields. This is a *draft* — the UI still lets
 * the user edit everything before saving.
 *
 * Rationale: typing every wizard field is friction. Most NGO teams already
 * have 2-3 paragraphs about their project in an email or notes. This lets
 * them paste and keep going.
 */

const SUGGEST_SCHEMA_NOTE = `{
  "name": "string (nom court du projet)",
  "summary": "string (résumé en 2-3 phrases)",
  "problem": "string (le problème/besoin adressé, 2-3 phrases)",
  "themes": "string[] (1-4 thématiques parmi: Humanitaire, Éducation, Jeunesse, Inclusion, Culture, Santé, Environnement, Droits humains, Migration, Développement, Égalité, Numérique — AUTRE valeur libre possible)",
  "geography": "string[] (parmi: Local / Territorial, National (France), Europe, Afrique, Asie, Amérique latine, International — ou ville/région si précisé)",
  "budget": "number | null (en euros, sans symbole)",
  "duration_months": "number | null",
  "general_objective": "string (l'objectif général, 1 phrase)",
  "specific_objectives": "string[] (2-3 objectifs spécifiques, SMART)",
  "beneficiaries_direct": "string (qui bénéficie directement)",
  "beneficiaries_indirect": "string (bénéficiaires indirects)",
  "beneficiaries_count": "number | null (nombre estimé)",
  "activities": "string[] (2-4 activités concrètes)",
  "methodology": "string (comment vous allez procéder, 1-2 phrases)",
  "partners": "string (partenaires identifiés ou potentiels)",
  "expected_results": "[{ result: string, indicator: string }] (2-3 résultats mesurables)",
  "sustainability": "string (comment pérenniser après la subvention, 1-2 phrases)"
}`;

export async function POST(request: Request) {
  // Auth — this is a paid compute call, only for logged-in users.
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await checkRateLimit(
    user.id,
    "project_suggest",
    RATE_LIMITS.project_suggest
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited", message: rl.message },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      }
    );
  }

  let body: { description?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const description = (body.description || "").trim();
  if (description.length < 30) {
    return NextResponse.json(
      { error: "Décris ton projet en au moins quelques phrases (30 caractères)" },
      { status: 400 }
    );
  }
  if (description.length > 5000) {
    return NextResponse.json(
      { error: "Description trop longue (max 5000 caractères)" },
      { status: 400 }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Service IA non configuré" },
      { status: 503 }
    );
  }

  const prompt = `Tu es un consultant en financement de projet ONG. Voici la description brute d'un projet par un porteur. Structure-la au format cadre logique (logframe) pour aider l'équipe à la compléter.

DESCRIPTION DU PORTEUR:
"""
${description}
"""

INSTRUCTIONS:
- Remplis chaque champ au mieux à partir de la description. Si un champ n'est pas clair, propose une valeur raisonnable (le porteur éditera).
- Sois concis et concret, pas du jargon.
- Pour les tableaux (themes, activities, expected_results), propose 2 à 4 éléments pertinents.
- Pour les indicateurs, propose des indicateurs SMART mesurables (nb de X, % de Y, etc.).
- Ne JAMAIS inventer de chiffres (budget, bénéficiaires count) si la description n'en mentionne pas — renvoie null.
- Réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans prose avant/après.

SCHEMA ATTENDU:
${SUGGEST_SCHEMA_NOTE}`;

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
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const txt = await response.text();
      console.error("[projects/suggest] Claude error:", response.status, txt);
      return NextResponse.json(
        { error: "Le service IA n'a pas pu répondre, réessaye." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const text: string = data.content?.[0]?.text || "";

    // Track usage for billing / admin dashboard.
    if (data.usage) {
      logAiUsage({
        action: "project_suggest",
        model: "claude-sonnet-4-20250514",
        inputTokens: data.usage.input_tokens || 0,
        outputTokens: data.usage.output_tokens || 0,
      });
    }

    // Claude sometimes wraps JSON in ```json ... ``` even when asked not to.
    // Strip any such fences defensively before parsing.
    const cleaned = text
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "");

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Try to pull the first {...} block as a fallback.
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (!match) {
        return NextResponse.json(
          { error: "Réponse IA non structurée, réessaye." },
          { status: 502 }
        );
      }
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        return NextResponse.json(
          { error: "Réponse IA illisible, réessaye." },
          { status: 502 }
        );
      }
    }

    return NextResponse.json({ suggestion: parsed });
  } catch (e) {
    console.error("[projects/suggest] unexpected:", e);
    return NextResponse.json(
      { error: "Erreur serveur, réessaye." },
      { status: 500 }
    );
  }
}
