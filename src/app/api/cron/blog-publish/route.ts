import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { publishOneArticle } from "@/lib/blog/publish";
import { getWritablePoolSize } from "@/lib/blog/selector";
import { resend, FROM_EMAIL } from "@/lib/resend";

/**
 * CRON: daily blog publish (06:00 UTC).
 *
 * 1. Selects a grant via the priority rules
 * 2. Generates the article via Claude Sonnet
 * 3. Injects the CTA block (with Haiku-contextualised title)
 * 4. Renders + uploads the cover image
 * 5. Saves to blog_posts (status depends on BLOG_AUTO_PUBLISH env)
 * 6. Stamps grant.blog_published_at
 * 7. Pings IndexNow with the new article URL
 * 8. Logs to blog_generation_logs
 * 9. Alerts via email if the writable pool drops below 14 articles
 *
 * Auth: same pattern as the other crons — Vercel sends Bearer CRON_SECRET.
 */

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const POOL_LOW_THRESHOLD = 14;

export const maxDuration = 300;

async function alertLowPool(poolSize: number): Promise<void> {
  const to = process.env.BLOG_ALERT_EMAIL || "francois@tresorier.co";
  if (!process.env.RESEND_API_KEY) return;
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `[Émile] Blog: pool de subventions à ${poolSize} (seuil ${POOL_LOW_THRESHOLD})`,
      html: `<p>Le pool de subventions disponibles pour le blog est descendu à <strong>${poolSize}</strong>. Pense à enrichir ou élargir la fenêtre de deadline avant qu'on tombe à zéro.</p>`,
    });
  } catch (err) {
    console.error("[cron/blog-publish] alert send failed", err);
  }
}

async function handle(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  const startedAt = Date.now();

  // BLOG_AUTO_PUBLISH defaults to true. Set "false" in prod to keep articles
  // as drafts until an admin reviews them.
  const autoPublish = process.env.BLOG_AUTO_PUBLISH !== "false";

  try {
    const result = await publishOneArticle(supabase, { autoPublish });
    const durationMs = Date.now() - startedAt;

    if (!result.ok) {
      console.error("[cron/blog-publish] failed", result.reason);
      return NextResponse.json(
        {
          success: false,
          error: result.reason,
          poolRemaining: result.poolRemaining,
          duration_ms: durationMs,
        },
        { status: 500 }
      );
    }

    // Pool alert — fire-and-forget after we already responded successfully.
    const poolNow = await getWritablePoolSize(supabase).catch(
      () => result.poolRemaining
    );
    if (poolNow < POOL_LOW_THRESHOLD) {
      void alertLowPool(poolNow);
    }

    console.log("[cron/blog-publish] success", {
      slug: result.slug,
      status: result.status,
      wordCount: result.wordCount,
      poolRemaining: poolNow,
      indexNowOk: result.indexNow?.ok ?? false,
      coverUploaded: result.coverUploaded,
      durationMs,
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      slug: result.slug,
      title: result.title,
      status: result.status,
      word_count: result.wordCount,
      pool_remaining: poolNow,
      index_now: result.indexNow,
      cover_uploaded: result.coverUploaded,
      duration_ms: durationMs,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[cron/blog-publish] exception", err);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}

export const GET = handle;
export const POST = handle;
