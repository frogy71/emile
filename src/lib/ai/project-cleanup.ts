import { logAiUsage } from "@/lib/ai/usage-tracker";

/**
 * Server-side AI cleanup of user-typed project text.
 *
 * Why: porteurs type their project in a hurry — typos, regional shorthand
 * ("3e âge", "ZUS", "Zep"), inconsistent capitalization. Embeddings are
 * sensitive to this noise: a typo in "bénéficiaires" can move us 0.05
 * cosine units away from the right grants. We pass the user's text through
 * Claude once at create time to:
 *   1. Fix obvious typos and accents
 *   2. Normalize beneficiary terms (add synonyms — "seniors" gets expanded
 *      to "personnes âgées, seniors, troisième âge") so semantic match
 *      catches grant copy that uses any of them
 *   3. Standardize French case ("Ile-de-France" → "Île-de-France")
 *
 * Crucially we never *change the meaning*. The model is told to preserve
 * intent and return identical text when the input is already clean. The
 * raw user input is preserved separately under logframe_data.raw_input so
 * we can show it back to the user on the edit page if they want.
 *
 * Fail-soft: if the API errors, returns null and the caller uses the raw
 * input. Better to embed slightly noisy text than to block project creation.
 */

export interface CleanupInput {
  name?: string | null;
  summary?: string | null;
  problem?: string | null;
  beneficiaries_direct?: string | null;
  beneficiaries_indirect?: string | null;
  general_objective?: string | null;
  specific_objectives?: string[] | null;
  activities?: string[] | null;
  methodology?: string | null;
  partners?: string | null;
  themes?: string[] | null;
  geography?: string[] | null;
}

export interface CleanupOutput {
  name: string | null;
  summary: string | null;
  problem: string | null;
  beneficiaries_direct: string | null;
  beneficiaries_indirect: string | null;
  general_objective: string | null;
  specific_objectives: string[];
  activities: string[];
  methodology: string | null;
  partners: string | null;
  themes: string[];
  geography: string[];
}

const SCHEMA_HINT = `{
  "name": "string|null (titre court, propre)",
  "summary": "string|null (résumé fluide, mêmes idées que l'input)",
  "problem": "string|null (problématique, mêmes idées)",
  "beneficiaries_direct": "string|null (qui bénéficie + synonymes/termes équivalents inclus dans la phrase, ex: 'seniors (personnes âgées, troisième âge)')",
  "beneficiaries_indirect": "string|null",
  "general_objective": "string|null",
  "specific_objectives": "string[] (mêmes éléments, nettoyés)",
  "activities": "string[]",
  "methodology": "string|null",
  "partners": "string|null",
  "themes": "string[] (mêmes thématiques, capitalisation normalisée)",
  "geography": "string[] (mêmes zones, accents corrigés ex: 'Île-de-France')"
}`;

const PROMPT = (input: CleanupInput) => `Tu es un consultant qui nettoie le texte d'un porteur de projet ONG avant qu'il soit indexé pour matcher des subventions. La qualité du matching dépend de la précision sémantique du texte, pas de la créativité.

INPUT (à nettoyer):
\`\`\`json
${JSON.stringify(input, null, 2)}
\`\`\`

INSTRUCTIONS — IMPORTANT:
1. Corrige les fautes de frappe et d'orthographe.
2. Normalise les accents et la casse (ex: "ile de france" → "Île-de-France", "Personnes Agées" → "personnes âgées").
3. Pour les bénéficiaires, ajoute en parenthèses les termes équivalents/synonymes courants pour améliorer le matching. Ex: "seniors" → "seniors (personnes âgées, troisième âge, retraités)". "Jeunes des QPV" → "jeunes des quartiers prioritaires de la ville (QPV, banlieue, quartiers populaires)".
4. Garde le sens EXACTEMENT. Ne change pas les chiffres, lieux, dates, noms propres.
5. Si un champ est vide ou null, renvoie-le null/[] tel quel.
6. Ne reformule pas inutilement — si le texte est déjà propre, renvoie-le quasi à l'identique.
7. Ne JAMAIS ajouter d'information non présente dans l'input.
8. Réponds UNIQUEMENT avec un objet JSON valide qui suit ce schéma, sans markdown:
${SCHEMA_HINT}`;

const CLEANUP_MODEL = "claude-sonnet-4-20250514";
const CLEANUP_TIMEOUT_MS = 12_000;

/**
 * Clean a project payload via Claude. Returns null on any failure — caller
 * should fall back to the raw input.
 */
export async function cleanupProjectText(
  input: CleanupInput
): Promise<CleanupOutput | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  // If literally everything is empty, skip the call.
  const hasAnyText =
    (input.name && input.name.trim()) ||
    (input.summary && input.summary.trim()) ||
    (input.problem && input.problem.trim()) ||
    (input.beneficiaries_direct && input.beneficiaries_direct.trim());
  if (!hasAnyText) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CLEANUP_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: CLEANUP_MODEL,
        max_tokens: 2048,
        messages: [{ role: "user", content: PROMPT(input) }],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const txt = await response.text().catch(() => "");
      console.warn("[project-cleanup] Claude error:", response.status, txt.slice(0, 200));
      return null;
    }

    const data = await response.json();
    const text: string = data.content?.[0]?.text || "";

    if (data.usage) {
      logAiUsage({
        action: "project_cleanup",
        model: CLEANUP_MODEL,
        inputTokens: data.usage.input_tokens || 0,
        outputTokens: data.usage.output_tokens || 0,
      });
    }

    const cleaned = text
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "");

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (!match) return null;
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        return null;
      }
    }

    return normalize(parsed as Record<string, unknown>);
  } catch (e) {
    console.warn("[project-cleanup] failed:", e);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function normalize(raw: Record<string, unknown>): CleanupOutput {
  const str = (v: unknown): string | null => {
    if (typeof v !== "string") return null;
    const t = v.trim();
    return t.length ? t : null;
  };
  const arr = (v: unknown): string[] => {
    if (!Array.isArray(v)) return [];
    return v
      .map((x) => (typeof x === "string" ? x.trim() : ""))
      .filter((x) => x.length > 0);
  };

  return {
    name: str(raw.name),
    summary: str(raw.summary),
    problem: str(raw.problem),
    beneficiaries_direct: str(raw.beneficiaries_direct),
    beneficiaries_indirect: str(raw.beneficiaries_indirect),
    general_objective: str(raw.general_objective),
    specific_objectives: arr(raw.specific_objectives),
    activities: arr(raw.activities),
    methodology: str(raw.methodology),
    partners: str(raw.partners),
    themes: arr(raw.themes),
    geography: arr(raw.geography),
  };
}
