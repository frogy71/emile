/**
 * Parse a max EUR amount out of free-form French/English funding text.
 *
 * Handles:
 *  - "jusqu'à 500 000 €", "up to €5,000,000"
 *  - "maximum 50 000 €", "plafonné à 100 K€"
 *  - "1,5 M€", "1.5M EUR", "2 millions d'euros", "200 k€"
 *  - Range "entre 5 000 et 50 000 €" → returns the upper bound
 *  - Bare "5 000 €" / "50K€" mentions
 *
 * Returns the largest plausible euro amount found in the string, or null.
 */
export function parseMaxAmountEur(input: string | null | undefined): number | null {
  if (!input) return null;

  // Normalise unicode whitespace (NBSP, narrow NBSP) to plain space so a single
  // " " matches every "thousands separator" the source may use.
  const text = input
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&euro;/gi, "€")
    .replace(/[   ]/g, " ")
    .replace(/\s+/g, " ");

  const NUM = "\\d{1,3}(?: \\d{3})+(?:[.,]\\d+)?|\\d{1,3}(?:[.,]\\d{3})+(?:[.,]\\d+)?|\\d+(?:[.,]\\d+)?";
  const UNIT = "milliards?|millions?|k|m|md";
  const CUR = "(?:€|eur(?:os?)?\\b|d['’]euros)";

  const reSuffix = new RegExp(`(${NUM})\\s*(${UNIT})?\\s*${CUR}`, "gi");
  const rePrefix = new RegExp(`${CUR}\\s*(${NUM})\\s*(${UNIT})?`, "gi");

  const candidates: number[] = [];

  for (const re of [reSuffix, rePrefix]) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const raw = m[1];
      const unit = (m[2] || "").toLowerCase();

      let n: number;
      if (/^\d{1,3}(?: \d{3})+(?:[.,]\d+)?$/.test(raw)) {
        // "500 000" or "1 500 000,50"
        n = Number(raw.replace(/ /g, "").replace(",", "."));
      } else if (/^\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{1,2})?$/.test(raw)) {
        // "500.000" or "1,500,000.50" or "1.500.000,50" — strip group seps
        // We treat the LAST separator as decimal only if it precedes 1-2 digits.
        const m2 = raw.match(/^(.*)([.,])(\d{1,2})$/);
        if (m2 && m2[3].length <= 2 && !/[.,]\d{3}$/.test(raw)) {
          n = Number(m2[1].replace(/[.,]/g, "") + "." + m2[3]);
        } else {
          n = Number(raw.replace(/[.,]/g, ""));
        }
      } else {
        n = Number(raw.replace(",", "."));
      }
      if (!Number.isFinite(n) || n <= 0) continue;

      let multiplier = 1;
      if (unit.startsWith("milliard") || unit === "md") multiplier = 1_000_000_000;
      else if (unit.startsWith("million") || unit === "m") multiplier = 1_000_000;
      else if (unit === "k") multiplier = 1_000;

      const amount = Math.round(n * multiplier);
      // Sanity bounds: filter out years ("2030 €") and tiny per-day rates.
      if (amount >= 500 && amount <= 1_000_000_000) {
        candidates.push(amount);
      }
    }
  }

  if (!candidates.length) return null;
  return Math.max(...candidates);
}
