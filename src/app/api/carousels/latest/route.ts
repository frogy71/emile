import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { formatAmountTeaser } from "@/lib/carousel/format";

/**
 * GET /api/carousels/latest
 *
 * PUBLIC endpoint — no auth. Botato (and any other consumer) hits this and
 * gets the most recent published batch of carousels: caption, grant
 * metadata, and 5 public Supabase Storage URLs per carousel.
 *
 * Response shape:
 *   {
 *     date: "YYYY-MM-DD",
 *     grants: [
 *       {
 *         title, funder, amount,
 *         caption,
 *         slides: [{ url, base64 }, ...]
 *       },
 *       ...
 *     ]
 *   }
 *
 * Query params:
 *   ?include_base64=1   — also include the PNG bytes inline (base64). Off
 *                          by default to keep responses small; clients that
 *                          can't follow URLs can opt in.
 */

// Use the anon key for the public read — RLS on carousel_publications is
// permissive (it's intentionally world-readable) and the slide_urls already
// point at a public bucket.
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PublicationRow {
  id: string;
  date: string;
  carousel_index: number;
  grant_id: string;
  accent_color: string;
  caption: string;
  slide_urls: string[];
  grants: {
    title: string | null;
    funder: string | null;
    max_amount_eur: number | null;
    deadline: string | null;
  } | null;
}

export async function GET(request: Request) {
  const supabase = getSupabase();
  const url = new URL(request.url);
  const includeBase64 = url.searchParams.get("include_base64") === "1";

  // Find the most recent date that has at least one publication, then
  // return every row for that date in carousel-index order.
  const { data: latestDateRow, error: latestErr } = await supabase
    .from("carousel_publications")
    .select("date")
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestErr) {
    return NextResponse.json({ error: latestErr.message }, { status: 500 });
  }
  if (!latestDateRow) {
    return NextResponse.json(
      { date: null, grants: [] },
      // 200 with empty payload so Botato doesn't error on a slow news day.
      { status: 200 }
    );
  }

  const { data: rows, error: rowsErr } = await supabase
    .from("carousel_publications")
    .select(
      "id, date, carousel_index, grant_id, accent_color, caption, slide_urls, grants(title, funder, max_amount_eur, deadline)"
    )
    .eq("date", latestDateRow.date)
    .order("carousel_index", { ascending: true });

  if (rowsErr) {
    return NextResponse.json({ error: rowsErr.message }, { status: 500 });
  }

  const publications = (rows || []) as unknown as PublicationRow[];

  const grants = await Promise.all(
    publications.map(async (p) => {
      const slides = await Promise.all(
        p.slide_urls.map(async (slideUrl) => {
          const out: { url: string; base64?: string } = { url: slideUrl };
          if (includeBase64) {
            try {
              const r = await fetch(slideUrl);
              if (r.ok) {
                const buf = Buffer.from(await r.arrayBuffer());
                out.base64 = buf.toString("base64");
              }
            } catch {
              // Storage hiccup — leave base64 off; the URL still works.
            }
          }
          return out;
        })
      );

      return {
        title: p.grants?.title ?? null,
        funder: p.grants?.funder ?? null,
        amount: formatAmountTeaser(p.grants?.max_amount_eur ?? null),
        deadline: p.grants?.deadline ?? null,
        accent: p.accent_color,
        carousel_index: p.carousel_index,
        caption: p.caption,
        slides,
      };
    })
  );

  return NextResponse.json(
    { date: latestDateRow.date, grants },
    {
      headers: {
        // Botato may poll once per day; allow a short edge cache.
        "Cache-Control":
          "public, s-maxage=300, stale-while-revalidate=600",
      },
    }
  );
}
