import { NextResponse } from "next/server";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * POST /api/alerts/send — Send deadline alerts to users
 * Called by cron job or manually
 * Requires INGESTION_API_KEY header for security
 */
export async function POST(request: Request) {
  // Verify API key
  const apiKey = request.headers.get("x-api-key");
  if (apiKey !== process.env.INGESTION_API_KEY) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "RESEND_API_KEY non configurée" },
      { status: 500 }
    );
  }

  const supabase = getSupabase();

  // Get all alert preferences
  const { data: prefs } = await supabase
    .from("alert_preferences")
    .select("*, organizations(name, user_id)");

  if (!prefs || prefs.length === 0) {
    return NextResponse.json({ sent: 0, message: "Aucune préférence d'alerte" });
  }

  // Get upcoming grants (next 14 days)
  const now = new Date().toISOString().split("T")[0];
  const in14 = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];

  const { data: upcomingGrants } = await supabase
    .from("grants")
    .select("id, title, funder, deadline, max_amount_eur, source_name")
    .eq("status", "active")
    .gte("deadline", now)
    .lte("deadline", in14)
    .order("deadline", { ascending: true })
    .limit(20);

  if (!upcomingGrants || upcomingGrants.length === 0) {
    return NextResponse.json({ sent: 0, message: "Aucune deadline proche" });
  }

  let sent = 0;

  for (const pref of prefs) {
    // Get user email from Supabase auth
    const userId = pref.organizations?.user_id;
    if (!userId) continue;

    const { data: userData } = await supabase.auth.admin.getUserById(userId);
    if (!userData?.user?.email) continue;

    const orgName = pref.organizations?.name || "votre organisation";
    const grantsHtml = upcomingGrants
      .map(
        (g) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">
            <strong>${g.title}</strong><br/>
            <span style="color: #666; font-size: 13px;">${g.funder}</span>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; white-space: nowrap;">
            ${g.deadline ? new Date(g.deadline).toLocaleDateString("fr-FR") : "—"}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; white-space: nowrap;">
            ${g.max_amount_eur ? `${g.max_amount_eur.toLocaleString("fr-FR")} €` : "—"}
          </td>
        </tr>
      `
      )
      .join("");

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: userData.user.email,
        subject: `Emile — ${upcomingGrants.length} deadline(s) dans les 14 prochains jours`,
        html: `
          <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1a1a1a; color: #faf9f6; padding: 20px 24px; border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">Emile<span style="color: #c8f76f;">.</span></h1>
            </div>
            <div style="padding: 24px; background: #faf9f6; border: 2px solid #1a1a1a; border-top: none; border-radius: 0 0 16px 16px;">
              <p>Bonjour ${orgName},</p>
              <p><strong>${upcomingGrants.length} subvention(s)</strong> arrivent à échéance dans les 14 prochains jours :</p>
              <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <thead>
                  <tr style="background: #c8f76f;">
                    <th style="padding: 10px 12px; text-align: left; font-size: 13px;">Subvention</th>
                    <th style="padding: 10px 12px; text-align: left; font-size: 13px;">Deadline</th>
                    <th style="padding: 10px 12px; text-align: left; font-size: 13px;">Montant max</th>
                  </tr>
                </thead>
                <tbody>
                  ${grantsHtml}
                </tbody>
              </table>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/grants" style="display: inline-block; background: #1a1a1a; color: #faf9f6; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; margin-top: 8px;">
                Voir toutes les subventions →
              </a>
              <p style="color: #666; font-size: 12px; margin-top: 24px;">
                Vous recevez cet email car vous êtes inscrit aux alertes Emile.
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings">Gérer mes alertes</a>
              </p>
            </div>
          </div>
        `,
      });
      sent++;
    } catch {
      // Continue sending to other users
    }
  }

  return NextResponse.json({ sent, total: prefs.length });
}
