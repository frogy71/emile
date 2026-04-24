/**
 * Aides-Territoires API ingestion
 * https://aides-territoires.beta.gouv.fr/api/
 *
 * ~3,000 active aids from État + Régions + Départements + EPCI + EU
 * REST API, open license (Licence Ouverte v2.0)
 *
 * Key endpoints:
 * - /api/aids/ — list all aids with filters
 * - /api/aids/?targeted_audiences=association — filter for associations
 * - /api/aids/?is_live=true — only active/published aids
 */

const BASE_URL = "https://aides-territoires.beta.gouv.fr/api";

/**
 * Exchange long-lived X-AUTH-TOKEN for a short-lived JWT (24h).
 * Since late 2024, Aides-Territoires requires JWT auth on /api/aids/.
 */
async function getJwt(): Promise<string> {
  const authToken = process.env.AIDES_TERRITOIRES_API_TOKEN;
  if (!authToken) {
    throw new Error("AIDES_TERRITOIRES_API_TOKEN env var is required");
  }
  const res = await fetch(`${BASE_URL}/connexion/`, {
    method: "POST",
    headers: { "X-AUTH-TOKEN": authToken },
  });
  if (!res.ok) {
    throw new Error(
      `Aides-Territoires auth failed: ${res.status} ${res.statusText}`
    );
  }
  const data = await res.json();
  if (!data.token) {
    throw new Error("Aides-Territoires did not return a JWT token");
  }
  return data.token as string;
}

export interface AideTerritoireRaw {
  id: number;
  url: string;
  name: string;
  name_initial: string;
  short_title: string;
  description: string;
  eligibility: string;
  perimeter: string;
  financers: { name: string; id: number }[];
  instructors: { name: string; id: number }[];
  categories: string[];
  targeted_audiences: string[];
  aid_types: { name: string; id: string }[];
  destinations: string[];
  start_date: string | null;
  predeposit_date: string | null;
  submission_deadline: string | null;
  subvention_rate_lower_bound: number | null;
  subvention_rate_upper_bound: number | null;
  subvention_comment: string;
  loan_amount: number | null;
  recoverable_advance_amount: number | null;
  contact: string;
  origin_url: string;
  application_url: string;
  is_call_for_project: boolean;
  programs: string[];
  date_created: string;
  date_updated: string;
}

export interface AideTerritoireResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AideTerritoireRaw[];
}

/**
 * Fetch all active aids targeted at associations from Aides-Territoires API.
 * Handles pagination automatically.
 */
export async function fetchAllAidesAssociations(): Promise<AideTerritoireRaw[]> {
  const jwt = await getJwt();
  const headers = { Authorization: `Bearer ${jwt}` };
  const allAids: AideTerritoireRaw[] = [];

  // Fetch ALL live aids (not just associations) to cover ESS, fondations,
  // collectivités, entreprises sociales, etc. Matching scores later.
  let url: string | null =
    `${BASE_URL}/aids/?is_live=true&page_size=100`;

  console.log("[Aides-Territoires] Starting ingestion with JWT...");

  while (url) {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(
        `Aides-Territoires API error: ${response.status} ${response.statusText}`
      );
    }

    const data: AideTerritoireResponse = await response.json();
    allAids.push(...data.results);
    url = data.next;

    console.log(
      `[Aides-Territoires] Fetched ${allAids.length}/${data.count} aids...`
    );

    // Be polite — small delay between requests
    if (url) {
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }

  console.log(
    `[Aides-Territoires] Done. Total: ${allAids.length} active aids.`
  );
  return allAids;
}

/**
 * Fetch aids filtered by specific criteria
 */
export async function fetchAides(params: {
  targetedAudiences?: string;
  categories?: string;
  perimeter?: string;
  isCallForProject?: boolean;
  isLive?: boolean;
  pageSize?: number;
}): Promise<AideTerritoireRaw[]> {
  const searchParams = new URLSearchParams();

  if (params.targetedAudiences)
    searchParams.set("targeted_audiences", params.targetedAudiences);
  if (params.categories)
    searchParams.set("categories", params.categories);
  if (params.perimeter)
    searchParams.set("perimeter", params.perimeter);
  if (params.isCallForProject !== undefined)
    searchParams.set("is_call_for_project", String(params.isCallForProject));
  if (params.isLive !== undefined)
    searchParams.set("is_live", String(params.isLive));

  searchParams.set("page_size", String(params.pageSize || 50));

  const jwt = await getJwt();
  const headers = { Authorization: `Bearer ${jwt}` };
  const allAids: AideTerritoireRaw[] = [];
  let url: string | null = `${BASE_URL}/aids/?${searchParams.toString()}`;

  while (url) {
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data: AideTerritoireResponse = await response.json();
    allAids.push(...data.results);
    url = data.next;

    if (url) await new Promise((r) => setTimeout(r, 150));
  }

  return allAids;
}

/**
 * Transform raw Aides-Territoires data into our Grant schema format
 */
export function transformToGrant(raw: AideTerritoireRaw) {
  // Detect country based on programs and financers
  const isEU =
    raw.programs?.some((p) =>
      /europ|erasmus|cerv|horizon|life|esf|feder/i.test(p)
    ) ||
    raw.financers?.some((f) =>
      /europ|commission/i.test(f.name)
    );

  // Extract thematic areas from categories
  const thematicAreas = raw.categories?.slice(0, 10) || [];

  // Extract eligible entities
  const eligibleEntities = raw.targeted_audiences || [];

  return {
    sourceUrl: raw.origin_url || raw.application_url || raw.url,
    sourceName: "Aides-Territoires",
    title: raw.name || raw.short_title,
    summary: cleanHtml(raw.description)?.slice(0, 500) || null,
    rawContent: raw.description,
    funder: raw.financers?.map((f) => f.name).join(", ") || null,
    country: isEU ? "EU" : "FR",
    thematicAreas,
    eligibleEntities,
    eligibleCountries: ["FR"],
    minAmountEur: null,
    maxAmountEur: raw.loan_amount || raw.recoverable_advance_amount || null,
    coFinancingRequired:
      raw.subvention_rate_upper_bound !== null &&
      raw.subvention_rate_upper_bound < 100,
    deadline: raw.submission_deadline
      ? new Date(raw.submission_deadline)
      : null,
    grantType: raw.is_call_for_project ? "appel_a_projets" : "subvention",
    language: "fr",
    status: "active",
    aiSummary: null,
  };
}

/**
 * Strip HTML tags from description
 */
function cleanHtml(html: string | null): string | null {
  if (!html) return null;
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
