import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resend, FROM_EMAIL } from "@/lib/resend";
import {
  buildAlertEmailHtml,
  buildAlertEmailText,
  type MatchAlert,
} from "@/lib/alerts";
import {
  computeMatchScore,
  type OrgProfile,
  type GrantProfile,
} from "@/lib/ai/scoring";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * POST /api/alerts — send match digest emails to users
 *
 * Called by:
 * - Vercel Cron (weekly or daily)
 * - After ingestion to notify about new matches
 *
 * Flow:
 * 1. For each org with alerts enabled
 * 2. Find new grants since last alert
 * 3. Compute match scores
 * 4. Filter by min_score threshold
 * 5. Send email via Resend
 * 6. Update last_sent_at
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const apiKey = process.env.INGESTION_API_KEY;

  if (apiKey && authHeader !== `Bearer ${apiKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "RESEND_API_KEY non configurée" },
      { status: 500 }
    );
  }

  const supabase = getSupabase();

  try {
    // 1. Query alert_preferences where enabled = true
    const { data: prefs, error: prefsError } = await supabase
      .from("alert_preferences")
      .select("*, organizations(id, name, user_id, mission, thematic_areas, beneficiaries, geographic_focus, annual_budget_eur, team_size, languages, prior_grants)")
      .eq("enabled", true);

    if (prefsError) {
      return NextResponse.json({ error: prefsError.message }, { status: 500 });
    }

    if (!prefs || prefs.length === 0) {
      return NextResponse.json({ sent: 0, message: "Aucune préférence d'alerte active" });
    }

    let totalSent = 0;
    const results: { org: string; matched: number; sent: boolean; error?: string }[] = [];

    for (const pref of prefs) {
      const org = pref.organizations;
      if (!org) continue;

      // 2. Find new grants since last_sent_at
      let grantsQuery = supabase
        .from("grants")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(50);

      if (pref.last_sent_at) {
        grantsQuery = grantsQuery.gt("created_at", pref.last_sent_at);
      }

      const { data: newGrants } = await grantsQuery;

      if (!newGrants || newGrants.length === 0) {
        results.push({ org: org.name, matched: 0, sent: false });
        continue;
      }

      // 3. Compute scores for new grants
      const orgProfile: OrgProfile = {
        name: org.name,
        mission: org.mission ?? undefined,
        thematicAreas: org.thematic_areas ?? undefined,
        beneficiaries: org.beneficiaries ?? undefined,
        geographicFocus: org.geographic_focus ?? undefined,
        annualBudgetEur: org.annual_budget_eur ?? undefined,
        teamSize: org.team_size ?? undefined,
        languages: org.languages ?? undefined,
        priorGrants: org.prior_grants ?? undefined,
      };

      const matchAlerts: MatchAlert[] = [];

      for (const grant of newGrants) {
        const grantProfile: GrantProfile = {
          title: grant.title,
          summary: grant.summary ?? undefined,
          funder: grant.funder ?? undefined,
          country: grant.country ?? undefined,
          thematicAreas: grant.thematic_areas ?? undefined,
          eligibleEntities: grant.eligible_entities ?? undefined,
          eligibleCountries: grant.eligible_countries ?? undefined,
          minAmountEur: grant.min_amount_eur ?? undefined,
          maxAmountEur: grant.max_amount_eur ?? undefined,
          coFinancingRequired: grant.co_financing_required ?? undefined,
          deadline: grant.deadline ?? undefined,
          grantType: grant.grant_type ?? undefined,
        };

        const score = await computeMatchScore(orgProfile, grantProfile);

        // 4. Filter by min_score
        if (score.score >= (pref.min_score || 60)) {
          matchAlerts.push({
            organizationId: org.id,
            projectId: null,
            grantId: grant.id,
            grantTitle: grant.title,
            score: score.score,
            recommendation: score.recommendation,
            topStrengths: score.strengths.slice(0, 2),
            deadline: grant.deadline,
            maxAmount: grant.max_amount_eur,
          });
        }
      }

      if (matchAlerts.length === 0) {
        results.push({ org: org.name, matched: 0, sent: false });
        continue;
      }

      // Sort by score descending, keep top 10
      matchAlerts.sort((a, b) => b.score - a.score);
      const topMatches = matchAlerts.slice(0, 10);

      // Get user email
      const { data: userData } = await supabase.auth.admin.getUserById(org.user_id);
      const userEmail = userData?.user?.email || pref.email;

      if (!userEmail) {
        results.push({ org: org.name, matched: topMatches.length, sent: false, error: "No email" });
        continue;
      }

      // 5. Send email via Resend
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: userEmail,
          subject: `Emile — ${topMatches.length} nouvelle(s) subvention(s) pour ${org.name}`,
          html: buildAlertEmailHtml({
            organizationName: org.name,
            matches: topMatches,
            appUrl,
          }),
          text: buildAlertEmailText({
            organizationName: org.name,
            matches: topMatches,
            appUrl,
          }),
        });

        // 6. Update last_sent_at
        await supabase
          .from("alert_preferences")
          .update({ last_sent_at: new Date().toISOString() })
          .eq("id", pref.id);

        totalSent++;
        results.push({ org: org.name, matched: topMatches.length, sent: true });
      } catch (emailError) {
        results.push({
          org: org.name,
          matched: topMatches.length,
          sent: false,
          error: String(emailError),
        });
      }
    }

    return NextResponse.json({
      success: true,
      sent: totalSent,
      total: prefs.length,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
