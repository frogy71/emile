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
 * POST/GET /api/alerts/new-match
 *
 * Fires a "nouveau match ≥ 85" email when a freshly ingested grant gets a
 * high match score for an existing project. The retention hack: users feel
 * Emile is actively working for them even when they don't log in.
 *
 * Flow (meant to run every few hours via cron):
 *  1. Find recent match_scores (computed in the last 24h) with score >= 85
 *  2. For each (org, grant, project) triplet not already in
 *     `new_match_alert_history`, send an email and record the row.
 *  3. Respect `alert_preferences.enabled` — if off, skip.
 *  4. Use `alert_preferences.min_score` only as a sanity floor; the route's
 *     own threshold is 85 (hard-coded as the "wow" bar).
 *
 * Auth: same dual scheme as /api/alerts/send.
 */

const HIGH_MATCH_THRESHOLD = 85;
const LOOKBACK_HOURS = 24;

function isAuthorized(request: Request): boolean {
  const bearer = request.headers.get("authorization");
  if (
    bearer &&
    process.env.CRON_SECRET &&
    bearer === `Bearer ${process.env.CRON_SECRET}`
  ) {
    return true;
  }
  const apiKey = request.headers.get("x-api-key");
  if (
    apiKey &&
    process.env.INGESTION_API_KEY &&
    apiKey === process.env.INGESTION_API_KEY
  ) {
    return true;
  }
  return false;
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}

async function handle(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "RESEND_API_KEY non configurée" },
      { status: 500 }
    );
  }

  const supabase = getSupabase();

  const since = new Date(Date.now() - LOOKBACK_HOURS * 3600_000).toISOString();

  const { data: recent, error } = await supabase
    .from("match_scores")
    .select(
      "score, organization_id, project_id, grant_id, computed_at, grants!inner(id, title, funder, deadline, max_amount_eur, status), projects(id, name)"
    )
    .gte("score", HIGH_MATCH_THRESHOLD)
    .gte("computed_at", since)
    .eq("grants.status", "active")
    .order("score", { ascending: false })
    .limit(500);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!recent || recent.length === 0) {
    return NextResponse.json({ sent: 0, message: "Aucun nouveau match ≥ 85" });
  }

  // Group by organization_id to send a single email per user even if several
  // high matches came in together.
  type Hit = {
    score: number;
    grantId: string;
    grantTitle: string;
    funder: string | null;
    deadline: string | null;
    maxAmount: number | null;
    projectId: string | null;
    projectName: string | null;
  };
  const byOrg = new Map<string, Hit[]>();
  for (const r of recent) {
    const g = (r as unknown as {
      grants: {
        id: string;
        title: string;
        funder: string | null;
        deadline: string | null;
        max_amount_eur: number | null;
      };
    }).grants;
    const p = (r as unknown as {
      projects: { id: string; name: string } | null;
    }).projects;
    if (!g) continue;
    const hits = byOrg.get((r as { organization_id: string }).organization_id) || [];
    hits.push({
      score: (r as { score: number }).score,
      grantId: g.id,
      grantTitle: g.title,
      funder: g.funder,
      deadline: g.deadline,
      maxAmount: g.max_amount_eur,
      projectId: p?.id || null,
      projectName: p?.name || null,
    });
    byOrg.set((r as { organization_id: string }).organization_id, hits);
  }

  // Fetch alert preferences + orgs in one shot.
  const orgIds = Array.from(byOrg.keys());
  const { data: prefs } = await supabase
    .from("alert_preferences")
    .select("id, enabled, min_score, organizations(id, name, user_id)")
    .in("organization_id", orgIds);

  if (!prefs || prefs.length === 0) {
    return NextResponse.json({
      sent: 0,
      message: "Aucune pref d'alerte pour les orgs concernées",
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  let sent = 0;
  const perOrg: { org: string; sent: boolean; count: number; error?: string }[] = [];

  for (const pref of prefs) {
    if (!pref.enabled) continue;
    const org = (pref as unknown as {
      organizations: { id: string; name: string | null; user_id: string } | null;
    }).organizations;
    if (!org) continue;

    const hits = byOrg.get(org.id) || [];
    if (hits.length === 0) continue;

    // Dedup: remove any (pref, grant) already notified.
    const { data: already } = await supabase
      .from("new_match_alert_history")
      .select("grant_id")
      .eq("alert_preference_id", (pref as { id: string }).id)
      .in(
        "grant_id",
        hits.map((h) => h.grantId)
      );
    const alreadyGrants = new Set((already || []).map((r) => r.grant_id));
    const fresh = hits.filter((h) => !alreadyGrants.has(h.grantId));
    if (fresh.length === 0) continue;

    // De-dup same grant surfaced through multiple projects — keep the
    // project with the highest score for display purposes.
    const byGrant = new Map<string, Hit>();
    for (const h of fresh) {
      const prev = byGrant.get(h.grantId);
      if (!prev || h.score > prev.score) byGrant.set(h.grantId, h);
    }
    const display = Array.from(byGrant.values()).sort((a, b) => b.score - a.score).slice(0, 5);

    const { data: userData } = await supabase.auth.admin.getUserById(
      org.user_id
    );
    const userEmail = userData?.user?.email;
    if (!userEmail) {
      perOrg.push({
        org: org.name || "(sans nom)",
        sent: false,
        count: display.length,
        error: "No email",
      });
      continue;
    }

    const orgName = org.name || "votre organisation";
    const rowsHtml = display
      .map(
        (h) => `
        <tr>
          <td style="padding: 14px 12px; border-bottom: 1px solid #eee;">
            <div style="display: inline-block; background: #c8f76f; color: #1a1a1a; padding: 4px 10px; border-radius: 8px; font-weight: 900; font-size: 13px; margin-bottom: 4px;">Score ${h.score}/100</div>
            <br/>
            <a href="${appUrl}/grants/${h.grantId}" style="color: #1a1a1a; text-decoration: none; font-weight: bold; font-size: 15px;">${h.grantTitle}</a><br/>
            <span style="color: #666; font-size: 13px;">${h.funder || "Financeur"}${h.projectName ? ` · projet <strong>${h.projectName}</strong>` : ""}</span>
          </td>
          <td style="padding: 14px 12px; border-bottom: 1px solid #eee; white-space: nowrap; text-align: right;">
            ${h.maxAmount ? `<strong>${h.maxAmount.toLocaleString("fr-FR")} €</strong><br/>` : ""}
            ${h.deadline ? `<span style="font-size: 12px; color: #666;">avant le ${new Date(h.deadline).toLocaleDateString("fr-FR")}</span>` : ""}
          </td>
        </tr>`
      )
      .join("");

    const top = display[0];
    const subject = `Emile — ${top ? `match ${top.score}/100 : ${top.grantTitle}` : `${display.length} nouveau(x) match(s) pour ${orgName}`}`;

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: userEmail,
        subject,
        html: `
          <div style="font-family: Inter, sans-serif; max-width: 640px; margin: 0 auto;">
            <div style="background: #1a1a1a; color: #faf9f6; padding: 20px 24px; border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">Emile<span style="color: #c8f76f;">.</span></h1>
            </div>
            <div style="padding: 24px; background: #faf9f6; border: 2px solid #1a1a1a; border-top: none; border-radius: 0 0 16px 16px;">
              <p style="font-size: 16px; margin: 0 0 8px;">Bonjour ${orgName},</p>
              <p style="font-size: 16px; margin: 0 0 16px;"><strong>On a trouvé ${display.length === 1 ? "une subvention" : `${display.length} subventions`} très alignée${display.length > 1 ? "s" : ""}</strong> avec ${display.length > 1 ? "vos projets" : "votre projet"}. ${top && top.score >= 95 ? "Un score ≥ 95 : contact direct recommandé." : "Ne laissez pas passer cette fenêtre."}</p>
              <table style="width: 100%; border-collapse: collapse; margin: 16px 0; border: 2px solid #1a1a1a; border-radius: 12px; overflow: hidden;">
                <tbody>${rowsHtml}</tbody>
              </table>
              <a href="${appUrl}/matching" style="display: inline-block; background: #c8f76f; color: #1a1a1a; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 900; margin-top: 8px; border: 2px solid #1a1a1a;">
                Voir tous mes matches →
              </a>
              <p style="color: #666; font-size: 12px; margin-top: 24px;">
                Notification envoyée quand un nouveau financement matche à ≥ ${HIGH_MATCH_THRESHOLD}/100.
                <a href="${appUrl}/settings">Gérer mes alertes</a>
              </p>
            </div>
          </div>
        `,
      });

      const rows = display.map((h) => ({
        alert_preference_id: (pref as { id: string }).id,
        grant_id: h.grantId,
        score: h.score,
      }));
      await supabase.from("new_match_alert_history").insert(rows);

      sent++;
      perOrg.push({
        org: org.name || "(sans nom)",
        sent: true,
        count: display.length,
      });
    } catch (err) {
      perOrg.push({
        org: org.name || "(sans nom)",
        sent: false,
        count: display.length,
        error: String(err),
      });
    }
  }

  return NextResponse.json({ sent, total: prefs.length, perOrg });
}
