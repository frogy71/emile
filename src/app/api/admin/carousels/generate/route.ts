import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateCarouselsInMemory } from "@/lib/carousel/generator";

/**
 * POST /api/admin/carousels/generate
 *
 * Generates a *preview* of today's carousels. Does NOT write to disk and
 * does NOT mark grants as published — that happens in /save once the user
 * confirms.
 *
 * Returns: { carousels: [{ grantId, grantTitle, funder, accent, caption,
 *                          slides: [base64png, ...] }] }
 */

const ADMIN_EMAILS = ["francois@tresorier.co", "tresorier.francois@gmail.com"];

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Rendering 5 slides × 2 carousels via Satori is fast but cold-start can
// stretch — keep generous headroom.
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
    const carousels = await generateCarouselsInMemory(supabase, {
      count: body.count ?? 2,
      markPublished: false,
    });

    if (carousels.length === 0) {
      return NextResponse.json(
        {
          error:
            "Aucune subvention disponible. Soit la base est vide, soit toutes ont déjà été publiées.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      carousels: carousels.map((c) => ({
        grantId: c.grantId,
        grantTitle: c.grantTitle,
        funder: c.funder,
        accent: c.accent,
        caption: c.caption,
        slides: c.slidesPng.map((b) => b.toString("base64")),
      })),
    });
  } catch (err) {
    console.error("[carousel-generate]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Erreur lors de la génération",
      },
      { status: 500 }
    );
  }
}
