/**
 * Slug helpers for the blog engine.
 *
 * The selector and generator both need to derive a stable URL slug from the
 * grant title; the slug must be:
 *   - lowercase, ASCII, hyphen-separated
 *   - <= 80 chars (Google still indexes longer but the snippet truncates)
 *   - unique → callers append a short suffix when there's a collision
 */

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/**
 * Append a short numeric suffix to keep slugs unique. We deliberately don't
 * use random tokens — readability matters for SEO.
 */
export function ensureUniqueSlug(
  base: string,
  taken: Set<string>
): string {
  if (!taken.has(base)) return base;
  for (let i = 2; i < 50; i++) {
    const candidate = `${base}-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export function countWords(html: string): number {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z]+;/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}
