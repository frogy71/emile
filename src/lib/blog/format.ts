/**
 * Helpers shared by the generator and the rendered article. Anti-cannibalism
 * is enforced here: we surface enough to rank on Google but never the
 * application URL, full eligibility, or contact details. Those live behind
 * the Émile login.
 */

import type { BlogGrantInput } from "./types";

export function formatAmountRange(
  min: number | null | undefined,
  max: number | null | undefined
): string {
  if (!min && !max) return "Montant variable selon les projets";
  if (max && !min) return `Jusqu'à ${formatAmount(max)}`;
  if (min && !max) return `À partir de ${formatAmount(min)}`;
  if (min && max && min === max) return formatAmount(max);
  return `Entre ${formatAmount(min!)} et ${formatAmount(max!)}`;
}

export function formatAmount(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    const rounded = m >= 10 ? Math.round(m) : Math.round(m * 10) / 10;
    return `${rounded.toString().replace(".", ",")} M€`;
  }
  if (n >= 1_000) return `${Math.round(n / 1_000)} k€`;
  return `${n} €`;
}

export function formatDeadline(iso: string | null | undefined): string {
  if (!iso) return "Variable — voir détails sur Émile";
  const d = new Date(iso);
  if (!isFinite(d.getTime())) return "Date variable";
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function shortFunder(funder: string | null | undefined): string {
  if (!funder) return "Bailleur";
  return funder.length > 80 ? funder.slice(0, 77) + "…" : funder;
}

/**
 * Pick a single thematic tag for the article. Used for SEO grouping and the
 * CTA contextualization.
 */
export function pickThematicTag(grant: BlogGrantInput): string {
  if (grant.thematic_areas && grant.thematic_areas[0]) {
    return grant.thematic_areas[0];
  }
  if (grant.grant_type) return grant.grant_type;
  return "subvention";
}

/**
 * Format the grant data block we feed to Claude. Long-form, structured —
 * the model needs every signal we have to write a real article.
 */
export function buildGrantBriefForPrompt(grant: BlogGrantInput): string {
  const lines: string[] = [];
  lines.push(`Titre: ${grant.title}`);
  if (grant.funder) lines.push(`Bailleur: ${grant.funder}`);
  if (grant.country) lines.push(`Pays: ${grant.country}`);
  if (grant.grant_type) lines.push(`Type d'aide: ${grant.grant_type}`);
  if (grant.deadline) lines.push(`Deadline: ${formatDeadline(grant.deadline)}`);
  lines.push(
    `Montant: ${formatAmountRange(grant.min_amount_eur, grant.max_amount_eur)}`
  );
  if (grant.co_financing_required != null) {
    lines.push(
      `Cofinancement requis: ${grant.co_financing_required ? "oui" : "non"}`
    );
  }
  if (grant.thematic_areas?.length) {
    lines.push(`Thématiques: ${grant.thematic_areas.join(", ")}`);
  }
  if (grant.eligible_entities?.length) {
    lines.push(`Entités éligibles: ${grant.eligible_entities.join(", ")}`);
  }
  if (grant.eligible_countries?.length) {
    lines.push(`Pays éligibles: ${grant.eligible_countries.join(", ")}`);
  }
  if (grant.summary) lines.push(`\nRésumé:\n${grant.summary}`);
  if (grant.eligibility_conditions) {
    lines.push(`\nÉligibilité:\n${grant.eligibility_conditions}`);
  }
  if (grant.ai_summary) {
    lines.push(`\nNotes additionnelles:\n${grant.ai_summary}`);
  }
  return lines.join("\n");
}
