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
 * Deadline alerts at J-30 / J-14 / J-7.
 *
 * Called by:
 *  - Vercel Cron (daily) — sends `Authorization: Bearer <CRON_SECRET>`
 *  - Manual triggers from /admin — sends `x-api-key: <INGESTION_API_KEY>`
 *
 * For each enabled alert_preference we send at most ONE email per window
 * per grant. Dedup is enforced via the `deadline_alert_history` table
 * (unique(alert_preference_id, grant_id, window_days)).
 *
 * Only grants the org actually cares about are included: we join on
 * `match_scores` and keep entries with score >= the user's `min_score`.
 */

// Buffer for cron reliability. We notify when deadline is within
// [WINDOW - BUFFER, WINDOW] days from today. If the cron misses a day
// (deploy, outage...) the next run catches up.
const WINDOWS = [
  { days: 30, buffer: 2, label: "30 jours" },
  { days: 14, buffer: 2, label: "2 semaines" },
  { days: 7, buffer: 2, label: "1 semaine" },
] as const;

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

type GrantRow = {
  id: string;
  title: string;
  funder: string | null;
  deadline: string | null;
  max_amount_eur: number | null;
  source_name: string | null;
};

type WindowBucket = {
  days: number;
  label: string;
  grants: Array<GrantRow & { score: number }>;
};

function daysUntil(deadline: string | null): number | null {
  if (!deadline) return null;
  const d = new Date(deadline).getTime();
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.floor((d - now.getTime()) / 86400000);
}

function dateOnly(d: Date): string {
  return d.toISOString().split("T")[0];
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

  const { data: prefs, error: prefsError } = await supabase
    .from("alert_preferences")
    .select("*, organizations(id, name, user_id)")
    .eq("enabled", true);

  if (prefsError) {
    return NextResponse.json({ error: prefsError.message }, { status: 500 });
  }
  if (!prefs || prefs.length === 0) {
    return NextResponse.json({ sent: 0, message: "Aucune préférence d'alerte" });
  }

  // Widest bounds across all windows so we fetch grants once.
  const maxWindow = Math.max(...WINDOWS.map((w) => w.days));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lowerBound = dateOnly(today);
  const upperBound = dateOnly(new Date(today.getTime() + maxWindow * 86400000));

  let totalSent = 0;
  let totalSkippedDedup = 0;
  const perOrg: { org: string; sent: boolean; bucketCount: number; error?: string }[] = [];

  for (const pref of prefs) {
    const org = pref.organizations as
      | { id: string; name: string | null; user_id: string }
      | null;
    if (!org) continue;
    const minScore = pref.min_score ?? 60;

    // Fetch matches ≥ min_score for this org with active grants whose
    // deadline falls within the widest window.
    const { data: matches } = await supabase
      .from("match_scores")
      .select(
        "score, grant_id, grants!inner(id, title, funder, deadline, max_amount_eur, source_name, status)"
      )
      .eq("organization_id", org.id)
      .gte("score", minScore)
      .eq("grants.status", "active")
      .gte("grants.deadline", lowerBound)
      .lte("grants.deadline", upperBound);

    if (!matches || matches.length === 0) {
      perOrg.push({ org: org.name || "(sans nom)", sent: false, bucketCount: 0 });
      continue;
    }

    // Bucket by window. Each grant goes to the smallest window it fits.
    const buckets: WindowBucket[] = WINDOWS.map((w) => ({
      days: w.days,
      label: w.label,
      grants: [],
    }));

    // De-dupe grants (match_scores may have multiple rows per grant via different projects)
    const seen = new Set<string>();

    for (const m of matches) {
      // Supabase typings aren't precise on nested joins; guard at runtime.
      const grant = (m as unknown as { grants: GrantRow | null }).grants;
      if (!grant || seen.has(grant.id)) continue;
      seen.add(grant.id);

      const d = daysUntil(grant.deadline);
      if (d === null || d < 0) continue;

      for (const w of WINDOWS) {
        if (d >= w.days - w.buffer && d <= w.days) {
          const bucket = buckets.find((b) => b.days === w.days)!;
          bucket.grants.push({ ...grant, score: (m as { score: number }).score });
          break; // only smallest matching window
        }
      }
    }

    // Filter out already-sent (pref_id, grant_id, window_days) triplets.
    const candidatePairs: Array<{ grantId: string; windowDays: number }> = [];
    for (const b of buckets) {
      for (const g of b.grants) {
        candidatePairs.push({ grantId: g.id, windowDays: b.days });
      }
    }
    if (candidatePairs.length === 0) {
      perOrg.push({ org: org.name || "(sans nom)", sent: false, bucketCount: 0 });
      continue;
    }

    const { data: alreadySent } = await supabase
      .from("deadline_alert_history")
      .select("grant_id, window_days")
      .eq("alert_preference_id", pref.id)
      .in(
        "grant_id",
        candidatePairs.map((c) => c.grantId)
      );

    const sentKey = new Set(
      (alreadySent || []).map((r) => `${r.grant_id}::${r.window_days}`)
    );

    for (const b of buckets) {
      b.grants = b.grants.filter(
        (g) => !sentKey.has(`${g.id}::${b.days}`)
      );
    }

    const dedupSkipped =
      candidatePairs.length -
      buckets.reduce((acc, b) => acc + b.grants.length, 0);
    totalSkippedDedup += dedupSkipped;

    const nonEmpty = buckets.filter((b) => b.grants.length > 0);
    if (nonEmpty.length === 0) {
      perOrg.push({ org: org.name || "(sans nom)", sent: false, bucketCount: 0 });
      continue;
    }

    // Look up user email.
    const { data: userData } = await supabase.auth.admin.getUserById(
      org.user_id
    );
    const userEmail = userData?.user?.email || pref.email;
    if (!userEmail) {
      perOrg.push({
        org: org.name || "(sans nom)",
        sent: false,
        bucketCount: nonEmpty.length,
        error: "No email",
      });
      continue;
    }

    const orgName = org.name || "votre organisation";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const bucketsHtml = nonEmpty
      .map(
        (b) => `
          <tr><td colspan="3" style="padding: 16px 12px 8px; background: #faf9f6;">
            <strong style="font-size: 14px;">⏰ Échéance dans ${b.label}</strong>
          </td></tr>
          ${b.grants
            .map(
              (g) => `
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #eee;">
                <a href="${appUrl}/grants/${g.id}" style="color: #1a1a1a; text-decoration: none; font-weight: bold;">${g.title}</a><br/>
                <span style="color: #666; font-size: 13px;">${g.funder || g.source_name || "Financeur"} · score ${g.score}/100</span>
              </td>
              <td style="padding: 12px; border-bottom: 1px solid #eee; white-space: nowrap;">
                ${g.deadline ? new Date(g.deadline).toLocaleDateString("fr-FR") : "—"}
              </td>
              <td style="padding: 12px; border-bottom: 1px solid #eee; white-space: nowrap;">
                ${g.max_amount_eur ? `${g.max_amount_eur.toLocaleString("fr-FR")} €` : "—"}
              </td>
            </tr>`
            )
            .join("")}
        `
      )
      .join("");

    const totalGrants = nonEmpty.reduce((acc, b) => acc + b.grants.length, 0);

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: userEmail,
        subject: `Emile — ${totalGrants} deadline(s) à venir pour ${orgName}`,
        html: `
          <div style="font-family: Inter, sans-serif; max-width: 640px; margin: 0 auto;">
            <div style="background: #1a1a1a; color: #faf9f6; padding: 20px 24px; border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">Emile<span style="color: #c8f76f;">.</span></h1>
            </div>
            <div style="padding: 24px; background: #faf9f6; border: 2px solid #1a1a1a; border-top: none; border-radius: 0 0 16px 16px;">
              <p>Bonjour ${orgName},</p>
              <p><strong>${totalGrants} subvention(s) matchées avec toi</strong> arrivent à échéance. Ne laisse pas passer l'opportunité :</p>
              <table style="width: 100%; border-collapse: collapse; margin: 16px 0; border: 2px solid #1a1a1a; border-radius: 12px; overflow: hidden;">
                <thead>
                  <tr style="background: #c8f76f;">
                    <th style="padding: 10px 12px; text-align: left; font-size: 13px;">Subvention</th>
                    <th style="padding: 10px 12px; text-align: left; font-size: 13px;">Deadline</th>
                    <th style="padding: 10px 12px; text-align: left; font-size: 13px;">Montant max</th>
                  </tr>
                </thead>
                <tbody>
                  ${bucketsHtml}
                </tbody>
              </table>
              <a href="${appUrl}/grants" style="display: inline-block; background: #1a1a1a; color: #faf9f6; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; margin-top: 8px;">
                Voir toutes mes subventions →
              </a>
              <p style="color: #666; font-size: 12px; margin-top: 24px;">
                Tu reçois cet email car les alertes deadline sont activées.
                <a href="${appUrl}/settings">Gérer mes alertes</a>
              </p>
            </div>
          </div>
        `,
      });

      // Record dedup rows so the same (pref, grant, window) isn't sent again.
      const rows: { alert_preference_id: string; grant_id: string; window_days: number }[] = [];
      for (const b of nonEmpty) {
        for (const g of b.grants) {
          rows.push({
            alert_preference_id: pref.id,
            grant_id: g.id,
            window_days: b.days,
          });
        }
      }
      if (rows.length > 0) {
        await supabase.from("deadline_alert_history").insert(rows);
      }

      await supabase
        .from("alert_preferences")
        .update({ last_sent_at: new Date().toISOString() })
        .eq("id", pref.id);

      totalSent++;
      perOrg.push({
        org: org.name || "(sans nom)",
        sent: true,
        bucketCount: nonEmpty.length,
      });
    } catch (err) {
      perOrg.push({
        org: org.name || "(sans nom)",
        sent: false,
        bucketCount: nonEmpty.length,
        error: String(err),
      });
    }
  }

  return NextResponse.json({
    sent: totalSent,
    total: prefs.length,
    skippedDedup: totalSkippedDedup,
    perOrg,
  });
}
