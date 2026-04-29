/**
 * Article generator — calls Claude Sonnet to produce blocks 1–5 of the
 * "Grant du Jour" article, plus SEO meta + slug + keywords.
 *
 * Why Claude returns a single JSON object: it lets us validate the shape
 * once and keeps the prompt simple. We prefer JSON over XML here because
 * we're already gluing the blocks to HTML afterwards.
 *
 * Anti-cannibalism: the prompt explicitly forbids the model from leaking
 * the application URL, contact emails, or step-by-step instructions that
 * would let a reader bypass Émile entirely. The CTA injector finishes the
 * conversion job.
 */

import { logAiUsage } from "@/lib/ai/usage-tracker";
import {
  buildGrantBriefForPrompt,
  formatAmountRange,
  formatDeadline,
  pickThematicTag,
  shortFunder,
} from "./format";
import { countWords, slugify } from "./slug";
import type {
  BlogGrantInput,
  FaqEntry,
  GeneratedArticle,
} from "./types";

const SONNET_MODEL = "claude-sonnet-4-20250514";

function getApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY missing");
  return key;
}

interface ClaudeJsonResponse {
  title: string;
  meta_title: string;
  meta_description: string;
  keywords: string[];
  thematic_tag: string;
  chapeau: string;
  fiche_rapide_html: string;
  presentation_html: string;
  apply_guide_html: string;
  similar_grants_html: string;
  faqs: { question: string; answer: string }[];
}

function buildPrompt(grant: BlogGrantInput): string {
  const brief = buildGrantBriefForPrompt(grant);
  const fundLine = shortFunder(grant.funder);
  const amountLine = formatAmountRange(
    grant.min_amount_eur,
    grant.max_amount_eur
  );
  const deadlineLine = formatDeadline(grant.deadline);

  return `Tu es rédacteur SEO francophone spécialisé sur le financement des associations, ONG et porteurs de projets ESS. Tu écris pour le blog "Émile" — un copilote IA qui aide les associations à trouver des subventions et rédiger leurs dossiers.

OBJECTIF :
Produis un article SEO complet et pédagogique en français sur la subvention ci-dessous. L'article doit :
- Faire entre 1500 et 2500 mots au total (chapeau + fiche + présentation + guide + similaires)
- Être professionnel mais accessible (niveau associatif, pas juridique)
- Optimisé pour Google ET pour les LLM (réponses citables, structure claire)
- Répondre directement à la question "Qu'est-ce que ${grant.title} ?" dans les 300 premiers mots
- Ne JAMAIS révéler : URL de candidature, email de contact, étape-par-étape de soumission précise, formulaires exacts du bailleur. Toujours renvoyer ces points vers "Émile".

═══ DONNÉES DE LA SUBVENTION ═══
${brief}

Information clés à intégrer naturellement :
- Bailleur : ${fundLine}
- Montant : ${amountLine}
- Deadline : ${deadlineLine}

═══ STRUCTURE DEMANDÉE ═══

1. **title** : Un H1 accrocheur, ~60–80 caractères, format "[Nom du dispositif] : [angle/promesse]". Inclure le nom exact pour le SEO.

2. **meta_title** : 55–60 caractères max, optimisé Google.

3. **meta_description** : 150–155 caractères max, accrocheur, inclut la deadline si pertinente.

4. **keywords** : Exactement 5 keywords, mix exact-match + longue traîne.

5. **thematic_tag** : Un seul mot/expression courte qui catégorise le sujet (ex: "transition écologique", "santé", "jeunesse", "international", "innovation").

6. **chapeau** : Paragraphe d'introduction (~120–180 mots) qui répond directement à "Qu'est-ce que ${grant.title} ?" en une phrase principale, puis détaille les 2–3 angles clés. Utilisé pour les featured snippets et les réponses LLM.

7. **fiche_rapide_html** : Une <table> HTML "Fiche rapide" avec les colonnes : Bailleur, Montant, Deadline, Pays, Thématique, Type d'aide. Lignes <tr> avec <th> à gauche et <td> à droite. Aucune URL.

8. **presentation_html** : Présentation détaillée du dispositif. ~600–900 mots. Sous-titres <h2> et <h3>. Couvre : objectifs du bailleur, public visé, types de projets éligibles, critères clés, points d'attention. Utilise des <ul>/<li> pour les listes.

9. **apply_guide_html** : Guide pédagogique "Comment se positionner" — PAS un how-to procédural du bailleur. ~400–600 mots. Conseils : aligner le projet sur les priorités, structurer le budget, montrer l'impact, anticiper les pièces. Termine par une phrase qui pointe vers Émile pour la suite.

10. **similar_grants_html** : Section "Subventions similaires" — ~150–250 mots de contexte sur les autres financements de cette typologie en France/EU, sans citer d'URL ni de noms de plateformes concurrentes. Présente comme un panorama du paysage.

11. **faqs** : Exactement 5 questions formulées comme de vraies recherches Google ("Qui peut bénéficier de…", "Quel est le montant maximum de…", "Comment candidater à…", "Quelle est la deadline de…", "[autre angle pertinent]"). Réponses 60–120 mots, factuelles, autonomes (réutilisables en featured snippet).

═══ CONTRAINTES TECHNIQUES ═══
- Le HTML doit être propre : <h2>, <h3>, <p>, <ul>, <li>, <table>, <tr>, <th>, <td>, <strong>, <em>. Pas de classes CSS, pas de style inline, pas de JS.
- Pas de Markdown — uniquement HTML.
- Pas de placeholders [À COMPLÉTER] : si une donnée manque, contourne avec une formulation honnête ("Le bailleur ne précise pas publiquement…").
- Ton : professionnel, pédagogique, jamais commercial agressif. Pas d'emojis.

═══ FORMAT DE SORTIE ═══
Réponds UNIQUEMENT avec un objet JSON valide (pas de \`\`\`json fences, pas de texte avant/après) :

{
  "title": "...",
  "meta_title": "...",
  "meta_description": "...",
  "keywords": ["...", "...", "...", "...", "..."],
  "thematic_tag": "...",
  "chapeau": "...",
  "fiche_rapide_html": "...",
  "presentation_html": "...",
  "apply_guide_html": "...",
  "similar_grants_html": "...",
  "faqs": [
    {"question": "...", "answer": "..."},
    {"question": "...", "answer": "..."},
    {"question": "...", "answer": "..."},
    {"question": "...", "answer": "..."},
    {"question": "...", "answer": "..."}
  ]
}`;
}

function parseClaudeJson(raw: string): ClaudeJsonResponse {
  // Strip markdown fences if Claude added them despite instructions
  let s = raw.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  }
  // Extract first {...} block defensively
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    s = s.slice(start, end + 1);
  }
  return JSON.parse(s) as ClaudeJsonResponse;
}

function validateClaudeResponse(r: ClaudeJsonResponse): void {
  const required: (keyof ClaudeJsonResponse)[] = [
    "title",
    "meta_title",
    "meta_description",
    "keywords",
    "thematic_tag",
    "chapeau",
    "fiche_rapide_html",
    "presentation_html",
    "apply_guide_html",
    "similar_grants_html",
    "faqs",
  ];
  for (const k of required) {
    if (!(k in r) || r[k] == null || r[k] === "") {
      throw new Error(`Claude response missing field: ${k}`);
    }
  }
  if (!Array.isArray(r.keywords) || r.keywords.length < 3) {
    throw new Error("Claude response: keywords must be array of 3+");
  }
  if (!Array.isArray(r.faqs) || r.faqs.length < 4) {
    throw new Error("Claude response: faqs must contain at least 4 entries");
  }
  for (const f of r.faqs) {
    if (!f.question || !f.answer) {
      throw new Error("Claude response: faq entries must have question+answer");
    }
  }
}

function clamp(s: string, max: number): string {
  if (!s) return s;
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}

export interface GenerateOptions {
  /** Override the model — useful for tests or to dial cost. */
  model?: string;
}

export async function generateArticle(
  grant: BlogGrantInput,
  options: GenerateOptions = {}
): Promise<GeneratedArticle> {
  const apiKey = getApiKey();
  const model = options.model || SONNET_MODEL;
  const prompt = buildPrompt(grant);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => "");
    throw new Error(`Claude API error ${response.status}: ${errBody.slice(0, 400)}`);
  }

  const data = await response.json();
  const text: string = data?.content?.[0]?.text || "";
  if (!text) throw new Error("Claude returned empty content");

  // Track AI usage (best-effort, never blocks)
  if (data.usage) {
    void logAiUsage({
      action: "proposal", // closest existing action enum — extend later if needed
      model,
      inputTokens: data.usage.input_tokens || 0,
      outputTokens: data.usage.output_tokens || 0,
      metadata: { kind: "blog_article", grant_id: grant.id },
    }).catch(() => {});
  }

  const parsed = parseClaudeJson(text);
  validateClaudeResponse(parsed);

  const slug = slugify(parsed.title) || slugify(grant.title);
  const faqs: FaqEntry[] = parsed.faqs.map((f) => ({
    question: f.question.trim(),
    answer: f.answer.trim(),
  }));

  // Word count over the user-visible HTML blocks (chapeau + content)
  const visibleHtml = [
    parsed.chapeau,
    parsed.fiche_rapide_html,
    parsed.presentation_html,
    parsed.apply_guide_html,
    parsed.similar_grants_html,
    ...faqs.flatMap((f) => [f.question, f.answer]),
  ].join(" ");
  const wordCount = countWords(visibleHtml);

  return {
    title: parsed.title.trim(),
    metaTitle: clamp(parsed.meta_title.trim(), 65),
    metaDescription: clamp(parsed.meta_description.trim(), 158),
    slug,
    keywords: parsed.keywords.slice(0, 5).map((k) => k.trim()),
    thematicTag: parsed.thematic_tag.trim() || pickThematicTag(grant),
    chapeau: parsed.chapeau.trim(),
    ficheRapide: parsed.fiche_rapide_html.trim(),
    presentation: parsed.presentation_html.trim(),
    applyGuide: parsed.apply_guide_html.trim(),
    similarGrants: parsed.similar_grants_html.trim(),
    faqs,
    wordCount,
  };
}

/**
 * Compose the full body_html from the structured blocks. Stable, server-side
 * markup so the public page can render it directly with `dangerouslySetInnerHTML`.
 */
export function composeBodyHtml(article: GeneratedArticle): string {
  const faqsHtml = article.faqs
    .map(
      (f) => `
    <details class="emile-faq-item">
      <summary><strong>${escapeHtml(f.question)}</strong></summary>
      <div class="emile-faq-answer"><p>${escapeHtml(f.answer)}</p></div>
    </details>`
    )
    .join("\n");

  return [
    `<div class="emile-chapeau"><p>${article.chapeau.replace(/\n+/g, "</p><p>")}</p></div>`,
    `<div class="emile-fiche">`,
    `  <h2>Fiche rapide</h2>`,
    article.ficheRapide,
    `</div>`,
    `<section class="emile-presentation">`,
    article.presentation,
    `</section>`,
    `<section class="emile-apply">`,
    `<h2>Comment se positionner</h2>`,
    article.applyGuide,
    `</section>`,
    `<section class="emile-similar">`,
    `<h2>Subventions similaires</h2>`,
    article.similarGrants,
    `</section>`,
    `<section class="emile-faqs">`,
    `<h2>Questions fréquentes</h2>`,
    faqsHtml,
    `</section>`,
  ].join("\n");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * FAQPage schema.org structured data — emitted on the article page so Google
 * can render rich FAQ snippets in SERPs.
 */
export function buildFaqSchema(faqs: FaqEntry[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };
}
