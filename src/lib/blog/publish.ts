/**
 * High-level orchestrator: pick a grant → generate the article → inject the
 * CTA → render the cover → save the row → stamp the grant.
 *
 * Used by both the cron (`/api/cron/blog-publish`) and the admin
 * "regenerate" / "force publish" endpoints.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  pickBlogGrant,
  markGrantBlogPublished,
  getWritablePoolSize,
} from "./selector";
import {
  generateArticle,
  composeBodyHtml,
  buildFaqSchema,
} from "./generator";
import { buildCtaBlockForArticle } from "./cta";
import { renderAndUploadCover } from "./cover";
import { ensureUniqueSlug } from "./slug";
import { pingIndexNow } from "./indexnow";
import type { BlogGrantInput, GeneratedArticle } from "./types";

export interface PublishOptions {
  /** Override auto-publish — if false, status is "draft" instead. */
  autoPublish?: boolean;
  /** Override the grant selection — used by admin "publish for grant X". */
  overrideGrantId?: string;
  /** Site URL used for IndexNow + canonical CTA links. */
  siteUrl?: string;
}

export interface PublishOutcome {
  ok: true;
  postId: string;
  slug: string;
  title: string;
  status: "draft" | "published";
  wordCount: number;
  poolRemaining: number;
  indexNow: { ok: boolean; status: number; reason?: string } | null;
  coverUploaded: boolean;
}

export interface PublishFailure {
  ok: false;
  reason: string;
  poolRemaining: number;
}

function siteUrl(opts?: PublishOptions): string {
  return (
    opts?.siteUrl ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://grant-finder-kappa.vercel.app"
  );
}

async function fetchGrantById(
  supabase: SupabaseClient,
  id: string
): Promise<BlogGrantInput | null> {
  const { data } = await supabase
    .from("grants")
    .select(
      "id, title, summary, funder, country, thematic_areas, eligible_entities, eligible_countries, min_amount_eur, max_amount_eur, co_financing_required, deadline, grant_type, language, eligibility_conditions, ai_summary"
    )
    .eq("id", id)
    .maybeSingle();
  return (data as BlogGrantInput | null) ?? null;
}

async function takenSlugs(
  supabase: SupabaseClient,
  base: string
): Promise<Set<string>> {
  const { data } = await supabase
    .from("blog_posts")
    .select("slug")
    .like("slug", `${base}%`);
  return new Set((data || []).map((r) => r.slug));
}

async function logGenerationOutcome(
  supabase: SupabaseClient,
  args: {
    grantId: string | null;
    status: "success" | "error" | "skipped";
    wordCount?: number;
    error?: string;
  }
): Promise<void> {
  await supabase.from("blog_generation_logs").insert({
    grant_id: args.grantId,
    status: args.status,
    word_count: args.wordCount ?? null,
    error_message: args.error ?? null,
  });
}

async function tryRenderCover(
  supabase: SupabaseClient,
  args: {
    slug: string;
    title: string;
    thematicTag: string;
    funder: string | null;
  }
): Promise<string | null> {
  try {
    return await renderAndUploadCover(supabase, args);
  } catch (err) {
    console.error("[blog/publish] cover upload failed", err);
    return null;
  }
}

export async function publishOneArticle(
  supabase: SupabaseClient,
  options: PublishOptions = {}
): Promise<PublishOutcome | PublishFailure> {
  const autoPublish = options.autoPublish ?? true;

  // 1. Select grant
  let grant: BlogGrantInput | null = null;
  if (options.overrideGrantId) {
    grant = await fetchGrantById(supabase, options.overrideGrantId);
  } else {
    const picked = await pickBlogGrant(supabase);
    grant = picked.grant;
  }

  const poolRemaining = await getWritablePoolSize(supabase);

  if (!grant) {
    await logGenerationOutcome(supabase, {
      grantId: null,
      status: "skipped",
      error: "no eligible grant available",
    });
    return {
      ok: false,
      reason: "No eligible grant available for blog publication.",
      poolRemaining,
    };
  }

  // 2. Generate the article
  let article: GeneratedArticle;
  try {
    article = await generateArticle(grant);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "generation failed";
    await logGenerationOutcome(supabase, {
      grantId: grant.id,
      status: "error",
      error: msg,
    });
    return { ok: false, reason: msg, poolRemaining };
  }

  // 3. Pick a unique slug
  const taken = await takenSlugs(supabase, article.slug);
  const slug = ensureUniqueSlug(article.slug, taken);

  // 4. Build the CTA block
  const ctaBlock = await buildCtaBlockForArticle(supabase, {
    thematicTag: article.thematicTag,
    blogSlug: slug,
    siteUrl: siteUrl(options),
  });

  // 5. Render cover image
  const coverUrl = await tryRenderCover(supabase, {
    slug,
    title: article.title,
    thematicTag: article.thematicTag,
    funder: grant.funder,
  });

  // 6. Compose body HTML and persist
  const baseBody = composeBodyHtml(article);
  const bodyHtml = ctaBlock ? `${baseBody}\n${ctaBlock}` : baseBody;
  const status = autoPublish ? "published" : "draft";
  const publishedAt = autoPublish ? new Date().toISOString() : null;
  const faqSchema = buildFaqSchema(article.faqs);

  const { data: insertedRow, error: insertErr } = await supabase
    .from("blog_posts")
    .insert({
      grant_id: grant.id,
      title: article.title,
      slug,
      meta_title: article.metaTitle,
      meta_description: article.metaDescription,
      body_html: bodyHtml,
      cta_block: ctaBlock,
      faq_schema: faqSchema,
      cover_image_url: coverUrl,
      thematic_tag: article.thematicTag,
      keywords: article.keywords,
      status,
      published_at: publishedAt,
      word_count: article.wordCount,
    })
    .select("id")
    .single();

  if (insertErr || !insertedRow) {
    const msg = insertErr?.message || "insert failed";
    await logGenerationOutcome(supabase, {
      grantId: grant.id,
      status: "error",
      error: msg,
    });
    return { ok: false, reason: msg, poolRemaining };
  }

  // 7. Stamp the grant so the selector skips it next time
  await markGrantBlogPublished(supabase, grant.id);

  // 8. Log success
  await logGenerationOutcome(supabase, {
    grantId: grant.id,
    status: "success",
    wordCount: article.wordCount,
  });

  // 9. Ping IndexNow only when the post is actually live
  let indexNow: { ok: boolean; status: number; reason?: string } | null = null;
  if (autoPublish) {
    const articleUrl = `${siteUrl(options).replace(/\/$/, "")}/blog/${slug}`;
    indexNow = await pingIndexNow(articleUrl);
  }

  return {
    ok: true,
    postId: insertedRow.id as string,
    slug,
    title: article.title,
    status,
    wordCount: article.wordCount,
    poolRemaining,
    indexNow,
    coverUploaded: !!coverUrl,
  };
}
