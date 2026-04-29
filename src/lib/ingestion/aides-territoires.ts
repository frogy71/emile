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

import { parseMaxAmountEur } from "./amount-parser";

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

// Note: the API has shifted to returning `financers` / `instructors` /
// `aid_types` as plain string arrays, with structured object arrays now living
// under `*_full`. We accept either shape so we don't break if it shifts back.
type NameLike = string | { name: string; id?: number | string };

export interface AideTerritoireRaw {
  id: number;
  slug?: string;
  url: string;
  name: string;
  name_initial: string;
  short_title: string;
  description: string;
  eligibility: string;
  perimeter: string | null;
  perimeter_scale?: string | null;
  perimeter_code?: string | null;
  region?: string | null;
  region_code?: string | null;
  financers: NameLike[];
  financers_full?: { id: number; name: string }[];
  instructors: NameLike[];
  instructors_full?: { id: number; name: string }[];
  categories: string[];
  targeted_audiences: string[];
  aid_types: NameLike[];
  aid_types_full?: { id: number; name: string; group?: { id: number; name: string } }[];
  destinations: string[];
  start_date: string | null;
  predeposit_date: string | null;
  submission_deadline: string | null;
  subvention_rate_lower_bound: number | null;
  subvention_rate_upper_bound: number | null;
  subvention_comment: string | null;
  loan_amount: number | null;
  recoverable_advance_amount: number | null;
  contact: string;
  origin_url: string | null;
  application_url: string | null;
  is_call_for_project: boolean;
  programs: string[];
  date_created: string;
  date_updated: string;
}

const AIDES_TERRITOIRES_BASE = "https://aides-territoires.beta.gouv.fr";

/**
 * Coerce a possibly-relative URL into an absolute one. Aides-Territoires
 * returns `url` as a path like "/aides/abc/", and `origin_url` is sometimes
 * null. We never want to land relative URLs in the DB — the detail page,
 * email links and enricher all dereference source_url directly.
 */
function toAbsoluteUrl(u: string | null | undefined): string | null {
  if (!u) return null;
  const trimmed = u.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) return `${AIDES_TERRITOIRES_BASE}${trimmed}`;
  // Bare path or domain-less reference — defensively prefix with /.
  return `${AIDES_TERRITOIRES_BASE}/${trimmed}`;
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
 * Normalise a NameLike[] to string[]. The API returns either an array of names
 * or an array of {name, id} objects depending on field/version.
 */
function namesOf(arr: NameLike[] | undefined | null): string[] {
  if (!arr || !Array.isArray(arr)) return [];
  return arr
    .map((v) => (typeof v === "string" ? v : v?.name))
    .filter((s): s is string => typeof s === "string" && s.length > 0);
}

/**
 * Transform raw Aides-Territoires data into our Grant schema format
 */
export function transformToGrant(raw: AideTerritoireRaw) {
  // The list endpoint sometimes returns `financers` as string[] and the
  // detail/structured form as `financers_full` (with id+logo). Prefer
  // `*_full.name` when available, else fall back to the bare names array.
  const financerNames =
    raw.financers_full?.map((f) => f.name).filter(Boolean) ??
    namesOf(raw.financers);
  const instructorNames =
    raw.instructors_full?.map((i) => i.name).filter(Boolean) ??
    namesOf(raw.instructors);
  const aidTypeNames =
    raw.aid_types_full?.map((t) => t.name).filter(Boolean) ??
    namesOf(raw.aid_types);

  // Detect country based on programs and financers
  const isEU =
    raw.programs?.some((p) =>
      /europ|erasmus|cerv|horizon|life|esf|feder/i.test(p)
    ) || financerNames.some((n) => /europ|commission/i.test(n));

  // Extract thematic areas from categories
  const thematicAreas = raw.categories?.slice(0, 10) || [];

  // Extract eligible entities
  const eligibleEntities = raw.targeted_audiences || [];

  // Funder: financers (the funder) > instructors (the agency processing it) >
  // null. Empty arrays yield null instead of "" so the row counts as "missing"
  // rather than "blank".
  const funder =
    financerNames.length > 0
      ? financerNames.join(", ")
      : instructorNames.length > 0
        ? instructorNames.join(", ")
        : null;

  // Max amount: prefer loan/advance numeric fields, then parse free-text
  // subvention_comment ("jusqu'à 50 000 €"), then look in description.
  const maxAmountEur =
    raw.loan_amount ||
    raw.recoverable_advance_amount ||
    parseMaxAmountEur(raw.subvention_comment) ||
    parseMaxAmountEur(raw.description) ||
    null;

  // Deadline: submission_deadline > predeposit_date (early stage cutoff).
  const deadlineRaw = raw.submission_deadline || raw.predeposit_date || null;
  const deadline = deadlineRaw ? new Date(deadlineRaw) : null;

  // Open date — when the call accepts dossiers. start_date is the canonical
  // field; falling back to predeposit_date covers two-stage calls where a
  // pre-screening opens before the full submission window.
  const openDateRaw = raw.start_date || raw.predeposit_date || null;
  const openDate = openDateRaw ? new Date(openDateRaw) : null;

  // Co-financing percentage — Aides-Territoires reports the *subvention*
  // rate (what the funder covers), so the porteur's required co-finance is
  // 100 - upper_bound. We only fill it when the upper bound is real (not
  // null) and below 100; "100% subvention" means no co-finance is required
  // and we leave the column null rather than writing 0 (which would render
  // as "0% requis" instead of "Non requis").
  let coFinancingPct: number | null = null;
  if (
    typeof raw.subvention_rate_upper_bound === "number" &&
    raw.subvention_rate_upper_bound < 100 &&
    raw.subvention_rate_upper_bound >= 0
  ) {
    coFinancingPct = Math.round(100 - raw.subvention_rate_upper_bound);
  }

  // Eligible entities → human-readable conditions string. The API also has
  // a free-text `eligibility` field which is gold when present, so prefer
  // that and fall back to the audience tags.
  const eligibilityConditions =
    cleanHtml(raw.eligibility)?.slice(0, 2000) ||
    (raw.targeted_audiences?.length
      ? `Cible : ${raw.targeted_audiences.join(", ")}`
      : null);

  // Grant type: refine using aid_types when available
  let grantType = raw.is_call_for_project ? "appel_a_projets" : "subvention";
  const aidTypeText = aidTypeNames.join(" ").toLowerCase();
  if (/prêt|loan/.test(aidTypeText)) grantType = "pret";
  else if (/avance/.test(aidTypeText)) grantType = "avance_recuperable";
  else if (/garantie/.test(aidTypeText)) grantType = "garantie";
  else if (/ingénier|conseil|accompagn/.test(aidTypeText) && !raw.is_call_for_project)
    grantType = "ingenierie";

  // Geographic targeting. perimeter_scale is "Pays" / "Région" / "Département"
  // / "epci" / "Bassin hydrographique" / "Ad-hoc" / null. We only set
  // target_regions when the grant is bound to a specific French region — for
  // national ("Pays") aids we leave it null so the matcher treats them as
  // accessible from anywhere in France.
  const targetRegions = computeTargetRegions(raw);

  // Always emit absolute URLs. raw.url is a relative path; origin_url is
  // sometimes null. Falling back to raw.url without normalising used to land
  // ~200 grants in the DB with paths like "/aides/abc/" that 404 when
  // clicked from the app or the alert email.
  const sourceUrl =
    toAbsoluteUrl(raw.origin_url) ||
    toAbsoluteUrl(raw.application_url) ||
    toAbsoluteUrl(raw.url);

  return {
    sourceUrl,
    sourceName: "Aides-Territoires",
    title: raw.name || raw.short_title,
    summary: cleanHtml(raw.description)?.slice(0, 500) || null,
    rawContent: raw.description,
    funder,
    country: isEU ? "EU" : "FR",
    thematicAreas,
    eligibleEntities,
    eligibleCountries: ["FR"],
    targetRegions,
    minAmountEur: null,
    maxAmountEur,
    coFinancingRequired:
      raw.subvention_rate_upper_bound !== null &&
      raw.subvention_rate_upper_bound < 100,
    deadline,
    grantType,
    language: "fr",
    status: "active",
    aiSummary: null,
    // Structured enrichment — pre-fill what the API already knows so the LLM
    // pass only has to handle difficulty and the document checklist.
    openDate,
    applicationUrl: toAbsoluteUrl(raw.application_url),
    contactInfo: raw.contact?.trim() || null,
    coFinancingPct,
    eligibilityConditions,
  };
}

/**
 * Map an Aides-Territoires perimeter onto the French region(s) it belongs to,
 * or null when the aid is national / scope unknown. We always reduce to the
 * region tier — département/EPCI/bassin perimeters get rolled up to their
 * parent region so the matcher only has to reason about regions.
 */
function computeTargetRegions(raw: AideTerritoireRaw): string[] | null {
  const scale = (raw.perimeter_scale || "").toLowerCase();
  const perimeter = raw.perimeter?.trim() || null;
  const region = raw.region?.trim() || null;

  if (!perimeter && !region) return null;

  // National aids — perimeter is "France" or scale is "Pays".
  if (
    scale === "pays" ||
    perimeter === "France" ||
    perimeter === "France entière" ||
    raw.perimeter_code === "FRA"
  ) {
    return null;
  }

  if (scale === "région" || scale === "region") {
    return perimeter ? [perimeter] : null;
  }

  // Département, EPCI, Bassin hydrographique, Ad-hoc, etc — fall back to the
  // attached parent region when we have one. Without a parent we keep the
  // perimeter string so the matcher can still detect a non-national scope.
  if (region) return [region];
  if (perimeter && perimeter !== "France") return [perimeter];
  return null;
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
