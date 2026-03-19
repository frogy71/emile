import { NextResponse } from "next/server";
import { runFullIngestion } from "@/lib/ingestion";

/**
 * POST /api/ingest — trigger full grant ingestion
 *
 * Sources:
 * 1. Aides-Territoires API (~3,000 aids FR)
 * 2. EU Funding & Tenders API (~500 EU calls)
 * 3. EuropeAid / INTPA (humanitarian + development)
 *
 * Protected by API key in production.
 * Can be triggered by:
 * - Admin dashboard
 * - Vercel Cron (weekly full sync)
 * - Manual curl
 */
export async function POST(request: Request) {
  // Simple API key protection
  const authHeader = request.headers.get("authorization");
  const apiKey = process.env.INGESTION_API_KEY;

  if (apiKey && authHeader !== `Bearer ${apiKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const report = await runFullIngestion();

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error("[Ingestion] Fatal error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ingest — check ingestion status / test endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: "ready",
    sources: [
      {
        name: "Aides-Territoires",
        type: "API",
        estimated: "~3,000 aids",
        coverage: "État + Régions + Départements + EPCI",
      },
      {
        name: "EU Funding & Tenders",
        type: "API",
        estimated: "~500 calls",
        coverage: "CERV, Erasmus+, LIFE, ESF+, AMIF",
      },
      {
        name: "EuropeAid / INTPA",
        type: "API",
        estimated: "~100 calls",
        coverage: "Développement, Humanitaire",
      },
      {
        name: "data.gouv.fr",
        type: "API",
        estimated: "datasets",
        coverage: "Open data subventions FR",
      },
      {
        name: "BPI France",
        type: "Scrape (phase 2)",
        estimated: "~50 solutions",
        coverage: "Innovation, Impact social",
      },
    ],
    usage: "POST /api/ingest to trigger full ingestion",
  });
}
