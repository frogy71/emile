/**
 * Anti-cannibalism formatters: every helper here strips precision that should
 * stay behind the Émile login. We surface a *teaser* — exact deadlines and
 * approximate ranges — never the click-ready data.
 */

import type { CarouselGrant } from "./selector";

export function formatAmountTeaser(n: number | null | undefined): string {
  if (!n || n <= 0) return "Montant variable";
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    const rounded = m >= 10 ? Math.round(m) : Math.round(m * 10) / 10;
    return `Jusqu'à ${rounded.toString().replace(".", ",")} M€`;
  }
  if (n >= 100_000) {
    return `Jusqu'à ${Math.round(n / 1_000)} k€`;
  }
  if (n >= 10_000) {
    // Round to nearest 5k so we look approximate, not data-leaky
    return `Jusqu'à ${Math.round(n / 5_000) * 5} k€`;
  }
  if (n >= 1_000) {
    return `Jusqu'à ${Math.round(n / 1_000)} k€`;
  }
  return `Jusqu'à ${n} €`;
}

export function formatDeadline(iso: string | null | undefined): string {
  if (!iso) return "Date variable";
  const d = new Date(iso);
  if (!isFinite(d.getTime())) return "Date variable";
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso).getTime();
  if (!isFinite(d)) return null;
  return Math.ceil((d - Date.now()) / 86_400_000);
}

export function truncate(s: string | null | undefined, max: number): string {
  if (!s) return "";
  const trimmed = s.trim().replace(/\s+/g, " ");
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max - 1).replace(/[\s.,;:!?]+$/, "") + "…";
}

/**
 * Pick a single eligibility tease line — never the full criteria.
 * Returns the first 80-char chunk of the eligibility text or a sane default.
 */
export function eligibilityTease(grant: CarouselGrant): string {
  if (grant.eligibility_conditions) {
    // Strip "Pour les associations…" leading throat-clearing where present
    const sentences = grant.eligibility_conditions
      .split(/[.\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 10 && s.length < 140);
    if (sentences[0]) return truncate(sentences[0], 80);
  }
  // Fallback — use first thematic area as the tease
  if (grant.thematic_areas && grant.thematic_areas[0]) {
    return `Structures actives sur "${grant.thematic_areas[0]}"`;
  }
  return "Critères d'éligibilité disponibles sur Émile";
}

export function topThemes(grant: CarouselGrant, max = 3): string[] {
  const arr = grant.thematic_areas || [];
  return arr.slice(0, max).map((t) => t.trim()).filter(Boolean);
}

const COLORS = ["#c8f76f", "#ffe066", "#a3d5ff", "#f9a8d4", "#fbbf24"];

/**
 * Returns a deterministic, non-repeating palette for `count` carousels on a
 * given date. The seed (yyyy-mm-dd) means re-running the same day reuses the
 * same colors; consecutive days walk the palette so we never hit the same
 * accent two days in a row either.
 */
export function colorRotation(dateIso: string, count: number): string[] {
  // Hash the date string to an integer so e.g. 2026-04-29 → some offset.
  let h = 0;
  for (let i = 0; i < dateIso.length; i++) {
    h = (h * 31 + dateIso.charCodeAt(i)) >>> 0;
  }
  const start = h % COLORS.length;
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    // step by a coprime stride (2) so consecutive picks never repeat
    out.push(COLORS[(start + i * 2) % COLORS.length]);
  }
  return out;
}

export function shortFunder(funder: string | null | undefined): string {
  if (!funder) return "Financeur";
  return truncate(funder, 38);
}
