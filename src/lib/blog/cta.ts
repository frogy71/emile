/**
 * CTA injector — reads the active CTA template from the DB, contextualises
 * the headline via Haiku (cheap, fast), and renders the HTML block that
 * gets appended to the article body.
 *
 * The block is the conversion point: an embedded logframe form (or a link
 * to /try) so a reader who landed on the article from Google flows straight
 * into the funnel.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { logAiUsage } from "@/lib/ai/usage-tracker";

const HAIKU_MODEL = "claude-haiku-4-5-20251001";

interface CtaTemplate {
  id: string;
  title_template: string;
  body_text: string;
  cta_button_label: string;
  logframe_embed_url: string | null;
  reassurance_line: string;
}

export async function getActiveCtaTemplate(
  supabase: SupabaseClient
): Promise<CtaTemplate | null> {
  const { data, error } = await supabase
    .from("blog_cta_templates")
    .select(
      "id, title_template, body_text, cta_button_label, logframe_embed_url, reassurance_line"
    )
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as CtaTemplate | null) ?? null;
}

/**
 * Replace `{{thematic_tag}}` and ask Haiku for a sharper, contextualised
 * variant of the title. Falls back to the static template when Haiku is
 * unavailable.
 */
export async function buildContextualTitle(
  template: CtaTemplate,
  thematicTag: string
): Promise<string> {
  const baseline = template.title_template.replace(
    /\{\{\s*thematic_tag\s*\}\}/g,
    thematicTag
  );

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return baseline;

  const prompt = `Rewrite this French call-to-action headline so it feels native and conversion-friendly for an article about "${thematicTag}". Return ONE line, no quotes, max 90 characters, French language. Original: "${baseline}"`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: HAIKU_MODEL,
        max_tokens: 80,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return baseline;
    const data = await res.json();
    if (data.usage) {
      void logAiUsage({
        action: "project_suggest",
        model: HAIKU_MODEL,
        inputTokens: data.usage.input_tokens || 0,
        outputTokens: data.usage.output_tokens || 0,
        metadata: { kind: "blog_cta_title", thematic_tag: thematicTag },
      }).catch(() => {});
    }
    const text: string = data?.content?.[0]?.text || "";
    const cleaned = text.replace(/^["']+|["']+$/g, "").split("\n")[0].trim();
    if (cleaned.length > 0 && cleaned.length <= 120) return cleaned;
    return baseline;
  } catch {
    return baseline;
  }
}

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeText(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export interface CtaRenderInput {
  template: CtaTemplate;
  contextualTitle: string;
  thematicTag: string;
  /** Tracking parameter that ends up in /try?from=blog&slug=… */
  blogSlug: string;
  siteUrl: string;
}

/**
 * Renders the CTA block as HTML. Stays as a single `<section>` so the
 * article page can render it directly. The form preview is intentionally
 * minimal — for the embedded logframe we just iframe the configured URL.
 */
export function renderCtaBlock(input: CtaRenderInput): string {
  const { template, contextualTitle, blogSlug, siteUrl } = input;
  const tryUrl = `${siteUrl.replace(/\/$/, "")}/try?from=blog&slug=${encodeURIComponent(blogSlug)}`;

  const embed = template.logframe_embed_url
    ? `<iframe src="${escapeAttr(template.logframe_embed_url)}" class="emile-cta-embed" loading="lazy" title="Décrivez votre projet"></iframe>`
    : "";

  return `
<section class="emile-cta-block" data-cta-slug="${escapeAttr(blogSlug)}">
  <h2 class="emile-cta-title">${escapeText(contextualTitle)}</h2>
  <p class="emile-cta-body">${escapeText(template.body_text)}</p>
  ${embed}
  <p class="emile-cta-actions">
    <a href="${escapeAttr(tryUrl)}" class="emile-cta-button" data-blog-cta="primary">${escapeText(template.cta_button_label)}</a>
  </p>
  <p class="emile-cta-reassurance">${escapeText(template.reassurance_line)}</p>
</section>`.trim();
}

/**
 * High-level helper used by the cron and the admin regenerate endpoint:
 * pull the active template, contextualise the title, render the HTML.
 */
export async function buildCtaBlockForArticle(
  supabase: SupabaseClient,
  args: { thematicTag: string; blogSlug: string; siteUrl: string }
): Promise<string | null> {
  const template = await getActiveCtaTemplate(supabase);
  if (!template) return null;
  const contextualTitle = await buildContextualTitle(
    template,
    args.thematicTag
  );
  return renderCtaBlock({
    template,
    contextualTitle,
    thematicTag: args.thematicTag,
    blogSlug: args.blogSlug,
    siteUrl: args.siteUrl,
  });
}
