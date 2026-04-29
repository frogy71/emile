import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateAndSaveCarousels } from "@/lib/carousel/generator";

/**
 * POST /api/admin/carousels/save
 *
 * Production action: re-generates today's carousels, writes the PNGs and
 * caption.txt to the configured Dropbox folder, AND stamps the chosen grants
 * with carousel_published_at so they don't get republished.
 *
 * Why re-generate vs. accepting bytes from /generate? The bytes already shown
 * in the preview were rendered without the publish stamp. Re-running here
 * with the same selection logic against the same DB state is deterministic
 * enough — and avoids trusting client-supplied PNGs (which would be a tiny
 * but real arbitrary-file-write surface).
 *
 * Body: { outputRoot?: string }
 *   - outputRoot lets a future cron pass a custom path; defaults to
 *     ~/Dropbox/Emile/Carousels/.
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

  let body: { outputRoot?: string; count?: number } = {};
  try {
    body = await request.json();
  } catch {
    // empty body is fine
  }

  try {
    const result = await generateAndSaveCarousels(supabase, {
      outputRoot: body.outputRoot,
      count: body.count ?? 2,
      markPublished: true,
    });

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Aucune subvention disponible." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      outputDir: result[0].outputDir,
      carousels: result.map((c) => ({
        grantId: c.grantId,
        grantTitle: c.grantTitle,
        funder: c.funder,
        accent: c.accent,
        slidePaths: c.slidePaths,
        captionPath: c.captionPath,
      })),
    });
  } catch (err) {
    console.error("[carousel-save]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Erreur lors de la sauvegarde",
      },
      { status: 500 }
    );
  }
}
