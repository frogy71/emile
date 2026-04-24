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
 * Weekly digest (Monday morning) — "X nouvelles subventions ≥ 90 pour ton projet".
 *
 * This is the retention hack: even if the user doesn't log in, Emile shows up
 * every Monday with a crisp summary of the best new opportunities.
 *
 * Unlike /api/alerts (POST), this route does NOT call Claude — it only reads
 * pre-computed `match_scores`. Safe to run weekly at zero AI cost.
 *
 * Flow:
 *   1. Read all enabled alert_preferences
 *   2. For each org, find match_scores computed since last_sent_at (or 14d ago)
 *      with score >= max(pref.min_score, 80)
 *   3. De-dupe by grant, keep top 8
 *   4. Send email via Resend; update last_sent_at
 */

const DIGEST_MIN_SCORE = 80;
const DEFAULT_LOOKBACK_DAYS = 14;
const TOP_N = 8;

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

  const { data: prefs } = await supabase
    .from("alert_preferences")
    .select("*, organizations(id, name, user_id)")
    .eq("enabled", true);

  if (!prefs || prefs.length === 0) {
    return NextResponse.json({ sent: 0, message: "Aucune pref active" });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  let sent = 0;
  const perOrg: { org: string; sent: boolean; count: number; error?: string }[] = [];

  for (const pref of prefs) {
    const org = pref.organizations as
      | { id: string; name: string | null; user_id: string }
      | null;
    if (!org) continue;

    const sinceIso = pref.last_sent_at
      ? (pref.last_sent_at as string)
      : new Date(
          Date.now() - DEFAULT_LOOKBACK_DAYS * 86400_000
        ).toISOString();

    const threshold = Math.max(pref.min_score ?? 0, DIGEST_MIN_SCORE);

    const { data: rows } = await supabase
      .from("match_scores")
      .select(
        "score, recommendation, computed_at, grant_id, project_id, grants!inner(id, title, funder, deadline, max_amount_eur, status), projects(id, name)"
      )
      .eq("organization_id", org.id)
      .gte("score", threshold)
      .gte("computed_at", sinceIso)
      .eq("grants.status", "active")
      .order("score", { ascending: false })
      .limit(50);

    if (!rows || rows.length === 0) {
      perOrg.push({ org: org.name || "(sans nom)", sent: false, count: 0 });
      continue;
    }

    // De-dupe by grant — keep highest score
    type Entry = {
      grantId: string;
      title: string;
      funder: string | null;
      deadline: string | null;
      maxAmount: number | null;
      score: number;
      projectName: string | null;
    };
    const byGrant = new Map<string, Entry>();
    for (const r of rows) {
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
      const prev = byGrant.get(g.id);
      const score = (r as { score: number }).score;
      if (!prev || score > prev.score) {
        byGrant.set(g.id, {
          grantId: g.id,
          title: g.title,
          funder: g.funder,
          deadline: g.deadline,
          maxAmount: g.max_amount_eur,
          score,
          projectName: p?.name || null,
        });
      }
    }
    const top = Array.from(byGrant.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_N);

    if (top.length === 0) continue;

    const { data: userData } = await supabase.auth.admin.getUserById(
      org.user_id
    );
    const userEmail = userData?.user?.email || pref.email;
    if (!userEmail) {
      perOrg.push({
        org: org.name || "(sans nom)",
        sent: false,
        count: top.length,
        error: "No email",
      });
      continue;
    }

    const orgName = org.name || "votre organisation";
    const rowsHtml = top
      .map(
        (t) => `
        <tr>
          <td style="padding: 14px 12px; border-bottom: 1px solid #eee;">
            <div style="display: inline-block; background: ${t.score >= 90 ? "#c8f76f" : "#f5f5f5"}; color: #1a1a1a; padding: 3px 10px; border-radius: 8px; font-weight: 900; font-size: 13px; margin-bottom: 4px;">Score ${t.score}/100</div>
            <br/>
            <a href="${appUrl}/grants/${t.grantId}" style="color: #1a1a1a; text-decoration: none; font-weight: bold; font-size: 15px;">${t.title}</a><br/>
            <span style="color: #666; font-size: 13px;">${t.funder || "Financeur"}${t.projectName ? ` · projet <strong>${t.projectName}</strong>` : ""}</span>
          </td>
          <td style="padding: 14px 12px; border-bottom: 1px solid #eee; white-space: nowrap; text-align: right;">
            ${t.maxAmount ? `<strong>${t.maxAmount.toLocaleString("fr-FR")} €</strong><br/>` : ""}
            ${t.deadline ? `<span style="font-size: 12px; color: #666;">avant le ${new Date(t.deadline).toLocaleDateString("fr-FR")}</span>` : ""}
          </td>
        </tr>`
      )
      .join("");

    const countHigh = top.filter((t) => t.score >= 90).length;
    const subject =
      countHigh > 0
        ? `Emile — ${countHigh} subvention(s) ≥ 90 pour ${orgName} cette semaine`
        : `Emile — ${top.length} nouvelle(s) opportunité(s) pour ${orgName}`;

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: userEmail,
        subject,
        html: `
          <div style="font-family: Inter, sans-serif; max-width: 640px; margin: 0 auto;">
            <div style="background: #1a1a1a; color: #faf9f6; padding: 20px 24px; border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">Emile<span style="color: #c8f76f;">.</span></h1>
              <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.8;">Ton digest hebdo</p>
            </div>
            <div style="padding: 24px; background: #faf9f6; border: 2px solid #1a1a1a; border-top: none; border-radius: 0 0 16px 16px;">
              <p style="font-size: 16px; margin: 0 0 8px;">Bonjour ${orgName},</p>
              <p style="font-size: 16px; margin: 0 0 16px;">
                Cette semaine, <strong>${top.length} opportunité(s) sérieuse(s)</strong> ont été scorées pour tes projets${countHigh > 0 ? ` — dont <strong>${countHigh} à 90/100 ou plus</strong> (match très fort).` : "."}
              </p>
              <table style="width: 100%; border-collapse: collapse; margin: 16px 0; border: 2px solid #1a1a1a; border-radius: 12px; overflow: hidden;">
                <tbody>${rowsHtml}</tbody>
              </table>
              <div style="text-align: center; margin-top: 20px;">
                <a href="${appUrl}/matching" style="display: inline-block; background: #c8f76f; color: #1a1a1a; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 900; border: 2px solid #1a1a1a;">
                  Ouvrir le matching →
                </a>
              </div>
              <p style="color: #666; font-size: 12px; margin-top: 24px;">
                Digest envoyé chaque lundi. <a href="${appUrl}/settings">Gérer mes alertes</a>.
              </p>
            </div>
          </div>
        `,
      });

      await supabase
        .from("alert_preferences")
        .update({ last_sent_at: new Date().toISOString() })
        .eq("id", pref.id);

      sent++;
      perOrg.push({
        org: org.name || "(sans nom)",
        sent: true,
        count: top.length,
      });
    } catch (err) {
      perOrg.push({
        org: org.name || "(sans nom)",
        sent: false,
        count: top.length,
        error: String(err),
      });
    }
  }

  return NextResponse.json({ sent, total: prefs.length, perOrg });
}
