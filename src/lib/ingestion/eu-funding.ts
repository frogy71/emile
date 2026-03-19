/**
 * EU Funding & Tenders Portal (SEDIA) ingestion
 * https://ec.europa.eu/info/funding-tenders/opportunities/portal/
 *
 * Covers all EU-managed programs:
 * - CERV (Citizens, Equality, Rights and Values)
 * - Erasmus+ (Education, Youth, Sport)
 * - LIFE (Environment, Climate)
 * - ESF+ (Employment, Social, Poverty)
 * - Horizon Europe (Research, Innovation)
 * - Digital Europe
 * - Creative Europe
 * - AMIF (Asylum, Migration, Integration)
 *
 * The search API is publicly accessible.
 */

const SEARCH_URL =
  "https://ec.europa.eu/info/funding-tenders/opportunities/data/topicSearch";

export interface EUTopicRaw {
  identifier: string;
  title: string;
  callIdentifier: string;
  callTitle: string;
  status: string;
  programmePeriod: string;
  frameworkProgramme: string;
  types: string[];
  deadlineDate: string;
  openingDate: string;
  description: string;
  budgetTopicActionMap: Record<string, unknown>;
  keywords: string[];
  focusArea: string[];
  flags: string[];
  sme: boolean;
}

export interface EUSearchResponse {
  topicResults: {
    totalResults: number;
    results: EUTopicRaw[];
  };
}

/**
 * Fetch open EU funding opportunities
 * Focus on programs relevant to NGOs
 */
export async function fetchEUOpenCalls(): Promise<EUTopicRaw[]> {
  const allTopics: EUTopicRaw[] = [];

  // Programs most relevant for NGOs
  const ngoPrograms = [
    "CERV",      // Citizens, Equality, Rights and Values
    "ESF",       // European Social Fund+
    "ERASMUS",   // Erasmus+
    "LIFE",      // Environment & Climate
    "AMIF",      // Asylum, Migration, Integration
    "CREA",      // Creative Europe
    "SOCPL",     // Social Prerogatives
  ];

  console.log("[EU Funding] Starting ingestion...");

  for (const programme of ngoPrograms) {
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

      if (!response.ok) {
        console.warn(
          `[EU Funding] Failed for ${programme}: ${response.status}`
        );
        continue;
      }

      const data = await response.json();
      const results = data?.topicResults?.results || [];
      allTopics.push(...results);

      console.log(
        `[EU Funding] ${programme}: ${results.length} open/forthcoming calls`
      );
    } catch (error) {
      console.warn(`[EU Funding] Error fetching ${programme}:`, error);
    }

    // Rate limiting
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(
    `[EU Funding] Done. Total: ${allTopics.length} EU opportunities.`
  );
  return allTopics;
}

/**
 * Transform EU topic to our Grant schema
 */
export function transformEUToGrant(raw: EUTopicRaw) {
  const programmeNames: Record<string, string> = {
    CERV: "CERV — Citoyens, Égalité, Droits et Valeurs",
    ESF: "Fonds Social Européen+",
    ERASMUS: "Erasmus+",
    LIFE: "LIFE — Environnement & Climat",
    AMIF: "AMIF — Asile, Migration, Intégration",
    CREA: "Europe Créative",
    SOCPL: "Prérogatives Sociales",
  };

  return {
    sourceUrl: `https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-details/${raw.identifier}`,
    sourceName: "EU Funding & Tenders",
    title: raw.title || raw.callTitle,
    summary: cleanDescription(raw.description)?.slice(0, 500) || null,
    rawContent: raw.description,
    funder:
      programmeNames[raw.frameworkProgramme] ||
      `Commission Européenne — ${raw.frameworkProgramme}`,
    country: "EU",
    thematicAreas: [...(raw.keywords || []), ...(raw.focusArea || [])].slice(
      0,
      10
    ),
    eligibleEntities: ["association", "ong", "fondation"],
    eligibleCountries: ["FR", "EU"],
    minAmountEur: null,
    maxAmountEur: null,
    coFinancingRequired: true, // Most EU grants require co-financing
    deadline: raw.deadlineDate ? new Date(raw.deadlineDate) : null,
    grantType: "appel_a_projets",
    language: "en",
    status: raw.status === "OPEN" ? "active" : "forthcoming",
    aiSummary: null,
  };
}

function cleanDescription(text: string | null): string | null {
  if (!text) return null;
  return text
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
