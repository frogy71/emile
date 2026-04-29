import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { publishOneArticle } from "@/lib/blog/publish";

/**
 * POST /api/admin/blog/generate
 * Body: { autoPublish?: boolean, grantId?: string }
 *
 * Triggers a fresh article generation right now. Used by the admin
 * "Générer maintenant" button. Defaults: status=draft (admin reviews),
 * grant=auto-selected.
 */

export const maxDuration = 300;

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json().catch(() => ({}));
  const autoPublish = !!body.autoPublish;
  const grantId =
    typeof body.grantId === "string" && body.grantId.length > 0
      ? body.grantId
      : undefined;

  try {
    const result = await publishOneArticle(supabaseAdmin, {
      autoPublish,
      overrideGrantId: grantId,
    });
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.reason, poolRemaining: result.poolRemaining },
        { status: 422 }
      );
    }
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "generation failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
