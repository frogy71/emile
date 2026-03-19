/**
 * EuropeAid / INTPA (DG International Partnerships) ingestion
 * https://international-partnerships.ec.europa.eu/
 *
 * Covers:
 * - External aid and development cooperation
 * - Neighbourhood, Development and International Cooperation (NDICI)
 * - Humanitarian aid grants
 *
 * Calls are published on EU Funding & Tenders portal but also on:
 * https://webgate.ec.europa.eu/online-services/#/
 *
 * Strategy: Combine EU F&T search with INTPA-specific filters
 */

const SEARCH_URL =
  "https://ec.europa.eu/info/funding-tenders/opportunities/data/topicSearch";

export interface EuropeAidCall {
  identifier: string;
  title: string;
  callTitle: string;
  status: string;
  deadlineDate: string;
  description: string;
  frameworkProgramme: string;
  keywords: string[];
}

/**
 * Fetch EuropeAid / INTPA calls for proposals
 */
export async function fetchEuropeAidCalls(): Promise<EuropeAidCall[]> {
  console.log("[EuropeAid] Starting ingestion...");

  // EuropeAid programs on EU F&T portal
  const programs = [
    "NDICI",   // Neighbourhood, Development, International Cooperation
    "HUMA",    // Humanitarian Aid
    "IPA",     // Instrument for Pre-Accession
  ];

  const allCalls: EuropeAidCall[] = [];

  for (const programme of programs) {
    try {
      const response = await fetch(SEARCH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "*",
          frameworkProgramme: [programme],
          status: ["OPEN", "FORTHCOMING"],
          pageNumber: 1,
          pageSize: 100,
          sortBy: "deadlineDate",
          sortOrder: "ASC",
        }),
      });

      if (!response.ok) continue;

      const data = await response.json();
      const results = data?.topicResults?.results || [];
      allCalls.push(...results);

      console.log(
        `[EuropeAid] ${programme}: ${results.length} calls`
      );
    } catch (error) {
      console.warn(`[EuropeAid] Error fetching ${programme}:`, error);
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(
    `[EuropeAid] Done. Total: ${allCalls.length} calls.`
  );
  return allCalls;
}

/**
 * Transform EuropeAid call to our Grant schema
 */
export function transformEuropeAidToGrant(raw: EuropeAidCall) {
  return {
    sourceUrl: `https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-details/${raw.identifier}`,
    sourceName: "EuropeAid / INTPA",
    title: raw.title || raw.callTitle,
    summary: raw.description?.replace(/<[^>]*>/g, " ").slice(0, 500) || null,
    rawContent: raw.description,
    funder: "Commission Européenne — DG INTPA",
    country: "EU",
    thematicAreas: [
      "Coopération internationale",
      "Aide humanitaire",
      ...(raw.keywords || []),
    ].slice(0, 10),
    eligibleEntities: ["ong", "association", "fondation"],
    eligibleCountries: ["FR", "EU"],
    minAmountEur: null,
    maxAmountEur: null,
    coFinancingRequired: true,
    deadline: raw.deadlineDate ? new Date(raw.deadlineDate) : null,
    grantType: "appel_a_projets",
    language: "en",
    status: raw.status === "OPEN" ? "active" : "forthcoming",
    aiSummary: null,
  };
}
