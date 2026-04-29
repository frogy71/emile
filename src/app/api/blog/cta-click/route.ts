import { NextResponse } from "next/server";
import { incrementCtaClicks } from "@/lib/blog/queries";

/**
 * POST /api/blog/cta-click
 * Body: { slug: string }
 *
 * Lightweight beacon endpoint hit when a reader clicks the CTA on a blog
 * article. Returns 204 fast — the count is best-effort.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const slug = body?.slug;
    if (typeof slug !== "string" || slug.length === 0) {
      return NextResponse.json({ error: "slug required" }, { status: 400 });
    }
    void incrementCtaClicks(slug).catch(() => {});
    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}
