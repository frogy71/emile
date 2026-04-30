import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateAndPublishCarousels } from "@/lib/carousel/generator";

/**
 * POST /api/admin/carousels/publish
 *
 * Production action (default in the admin UI): renders today's carousels,
 * uploads each PNG to the public `carousels` Supabase Storage bucket, and
 * persists a row in `carousel_publications` so GET /api/carousels/latest
 * can serve them to Botato.
 *
 * Also stamps the chosen grants with `carousel_published_at` so they don't
 * get re-picked tomorrow.
 *
 * Body: { count?: number } — defaults to 1 ("Grant du Jour").
 */

const ADMIN_EMAILS = ["francois@tresorier.co", "tresorier.francois@gmail.com"];

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export const maxDuration = 120;

export async function POST(request: Request) {
  const supabase = getSupabase();

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = authHeader.split("Bearer ")[1];
  const {
    data: { user },
  } = await supabase.auth.getUser(token);
  if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { count?: number } = {};
  try {
    body = await request.json();
  } catch {
    // empty body is fine
  }

  try {
    const published = await generateAndPublishCarousels(supabase, {
      count: body.count ?? 1,
      markPublished: true,
    });

    if (published.length === 0) {
      return NextResponse.json(
        { error: "Aucune subvention disponible." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      date: published[0].date,
      carousels: published.map((p) => ({
        id: p.id,
        carouselIndex: p.carouselIndex,
        grantId: p.grantId,
        grantTitle: p.grantTitle,
        funder: p.funder,
        accent: p.accent,
        slideUrls: p.slideUrls,
        captionPreview: p.caption.slice(0, 200),
      })),
    });
  } catch (err) {
    console.error("[carousel-publish]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Erreur lors de la publication",
      },
      { status: 500 }
    );
  }
}
