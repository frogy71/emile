import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/carousels/latest/[index]/[slide].png
 *
 * PUBLIC endpoint — no auth. Convenience direct-image URL for clients that
 * want a stable path instead of resolving the JSON first. We redirect to
 * the underlying Supabase Storage public URL (cheap, serves CDN-cached
 * bytes) rather than streaming the bytes through this function.
 *
 * `[slide]` is "1.png".."5.png" (1-indexed for human-friendly URLs). The
 * extension is ignored — we accept "1" or "1.png" and always look up
 * slide_urls[0]. We respond 404 if the index is out of bounds.
 */

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ index: string; slide: string }> }
) {
  const { index, slide } = await context.params;
  const carouselIdx = parseInt(index, 10);
  const slideNum = parseInt(slide.replace(/\.png$/i, ""), 10);

  if (
    !Number.isFinite(carouselIdx) ||
    carouselIdx < 0 ||
    !Number.isFinite(slideNum) ||
    slideNum < 1 ||
    slideNum > 10
  ) {
    return NextResponse.json({ error: "Invalid index or slide" }, { status: 400 });
  }

  const supabase = getSupabase();

  const { data: latestDateRow } = await supabase
    .from("carousel_publications")
    .select("date")
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latestDateRow) {
    return NextResponse.json({ error: "No carousel published yet" }, { status: 404 });
  }

  const { data: row, error } = await supabase
    .from("carousel_publications")
    .select("slide_urls")
    .eq("date", latestDateRow.date)
    .eq("carousel_index", carouselIdx)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "Carousel not found" }, { status: 404 });
  }

  const url = (row.slide_urls as string[])[slideNum - 1];
  if (!url) {
    return NextResponse.json({ error: "Slide out of range" }, { status: 404 });
  }

  // 302 — public storage URL is canonical, but slides may rotate daily, so
  // we don't want clients to permanent-cache the redirect itself.
  return NextResponse.redirect(url, 302);
}
