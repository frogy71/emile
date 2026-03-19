import { NextResponse } from "next/server";
import {
  buildAlertEmailHtml,
  buildAlertEmailText,
  type MatchAlert,
} from "@/lib/alerts";

/**
 * POST /api/alerts — send alert digest emails to users
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
 */
export async function POST(request: Request) {
  // Simple API key protection
  const authHeader = request.headers.get("authorization");
  const apiKey = process.env.INGESTION_API_KEY;

  if (apiKey && authHeader !== `Bearer ${apiKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // TODO: When Supabase is connected:
    // 1. Query alert_preferences where enabled = true
    // 2. For each org, find new grants since last_sent_at
    // 3. Compute scores for new grants
    // 4. Filter by min_score
    // 5. Send email via Resend
    // 6. Update last_sent_at

    // For now, return mock data showing the system is ready
    const mockAlert: MatchAlert = {
      organizationId: "test",
      projectId: null,
      grantId: "test",
      grantTitle: "Programme d'aide aux réfugiés — Fondation de France",
      score: 91,
      recommendation: "pursue",
      topStrengths: ["Alignement parfait", "Profil éligible"],
      deadline: "2026-07-15",
      maxAmount: 80000,
    };

    // Generate sample email
    const html = buildAlertEmailHtml({
      organizationName: "Association Solidarité France",
      matches: [mockAlert],
      appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    });

    return NextResponse.json({
      success: true,
      message: "Alert system ready. Connect Supabase + Resend to enable.",
      sampleEmailPreview: html,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
