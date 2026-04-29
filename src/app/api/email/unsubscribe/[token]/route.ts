import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { skipPendingForOrg, skipPendingForUser } from "@/lib/email/send-engine";

/**
 * GET /api/email/unsubscribe/[token]
 *
 * Marks the user's organization as unsubscribed (`email_unsubscribed = true`)
 * and skips the rest of the queue. Returns a tiny confirmation page.
 *
 * POST /api/email/unsubscribe/[token]
 *
 * Same effect, used by Gmail's one-click unsubscribe (RFC 8058) — the
 * mailbox provider POSTs to the URL we put in the List-Unsubscribe header.
 */

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

async function unsubscribe(token: string): Promise<{
  ok: boolean;
  orgName: string | null;
  alreadyUnsubscribed: boolean;
}> {
  if (!token) return { ok: false, orgName: null, alreadyUnsubscribed: false };
  const supabase = getSupabase();

  const { data: row } = await supabase
    .from("email_sequence_queue")
    .select("user_id, organization_id")
    .eq("tracking_token", token)
    .maybeSingle();

  if (!row) return { ok: false, orgName: null, alreadyUnsubscribed: false };

  let orgName: string | null = null;
  let alreadyUnsubscribed = false;

  if (row.organization_id) {
    const { data: org } = await supabase
      .from("organizations")
      .select("name, email_unsubscribed")
      .eq("id", row.organization_id)
      .maybeSingle();
    orgName = org?.name ?? null;
    alreadyUnsubscribed = !!org?.email_unsubscribed;

    await supabase
      .from("organizations")
      .update({ email_unsubscribed: true })
      .eq("id", row.organization_id);
    await skipPendingForOrg(row.organization_id, "unsubscribed");
  } else {
    await skipPendingForUser(row.user_id, "unsubscribed");
  }

  return { ok: true, orgName, alreadyUnsubscribed };
}

function confirmationPage(params: {
  ok: boolean;
  orgName: string | null;
  alreadyUnsubscribed: boolean;
}): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const headline = !params.ok
    ? "Lien invalide"
    : params.alreadyUnsubscribed
    ? "Vous étiez déjà désabonné"
    : "Désabonnement confirmé";
  const message = !params.ok
    ? "Ce lien de désabonnement n'a pas pu être validé. Si vous receviez encore des emails, contactez-nous à hello@emile.fr."
    : `Nous n'enverrons plus d'emails de la séquence à ${
        params.orgName || "votre organisation"
      }. Vous continuerez à recevoir les notifications transactionnelles (alertes deadline, confirmations) sauf si vous les désactivez dans vos paramètres.`;
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Émile — Désabonnement</title>
<style>
  body { margin: 0; padding: 0; background: #faf9f6; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1a1a1a; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
  .card { background: #faf9f6; border: 2px solid #1a1a1a; border-radius: 16px; box-shadow: 4px 4px 0px 0px #1a1a1a; padding: 32px; max-width: 480px; margin: 16px; }
  h1 { font-size: 24px; font-weight: 900; margin: 0 0 8px; }
  .brand { color: #1a1a1a; font-weight: 900; }
  .brand span { color: #c8f76f; }
  p { line-height: 1.55; color: #444; }
  a.cta { display: inline-block; background: #1a1a1a; color: #faf9f6; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 800; margin-top: 8px; }
</style>
</head>
<body>
  <div class="card">
    <p class="brand">Émile<span>.</span></p>
    <h1>${headline}</h1>
    <p>${message}</p>
    ${appUrl ? `<a class="cta" href="${appUrl}">Retour sur Émile →</a>` : ""}
  </div>
</body>
</html>`;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const result = await unsubscribe(token);
  return new NextResponse(confirmationPage(result), {
    status: result.ok ? 200 : 404,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const result = await unsubscribe(token);
  return NextResponse.json({ ok: result.ok });
}
