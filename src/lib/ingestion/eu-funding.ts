/**
 * EU Funding & Tenders Portal — SEDIA Search API
 *
 * Covers ALL EU-managed programs publishing on the Funding & Tenders portal:
 * Horizon Europe, CERV, Erasmus+, LIFE, ESF+, Digital Europe, Creative Europe,
 * AMIF, EU4Health, CEF, etc.
 *
 * Endpoint: https://api.tech.ec.europa.eu/search-api/prod/rest/search
 *
 * Important nuances (discovered 2026-04):
 *  - Body MUST be multipart/form-data with BOTH fields `query` AND `languages`,
 *    each tagged as Content-Type: application/json.
 *  - Without `languages`, filters are ignored and 640k rows are returned.
 *  - `text=*` is required in the URL.
 *  - Without `languages=["en"]`, results are duplicated 24x (one per language).
 *
 * Status codes:
 *  - 31094501 = Forthcoming
 *  - 31094502 = Open
 *  - 31094503 = Closed (we skip)
 *
 * Type codes:
 *  - 1 = call for proposals topic
 *  - 2 = call for tenders
 *  - 8 = cascading / prize
 */

const SEDIA_URL = "https://api.tech.ec.europa.eu/search-api/prod/rest/search";
const TOPIC_DETAILS_BASE =
  "https://ec.europa.eu/info/funding-tenders/opportunities/data/topicDetails";

export interface EUTopic {
  identifier: string;
  title: string;
  summary: string | null;
  url: string;
  callTitle: string | null;
  status: "open" | "forthcoming";
  frameworkProgramme: string | null;
  programmePeriod: string | null;
  deadline: string | null;
  startDate: string | null;
  typesOfAction: string[];
  destinationDetails: string[];
  keywords: string[];
  focusArea: string[];
  description: string | null;
}

function firstOr<T>(value: T | T[] | undefined | null, fallback: T | null = null): T | null {
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}

function ensureArray<T>(value: T | T[] | undefined | null): T[] {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null) return [];
  return [value];
}

async function fetchPage(pageNumber: number, pageSize = 100): Promise<{ total: number; topics: EUTopic[] }> {
  const body = new FormData();
  body.append(
    "query",
    new Blob(
      [
        JSON.stringify({
          bool: {
            must: [
              { terms: { type: ["1", "2", "8"] } },
              { terms: { status: ["31094501", "31094502"] } },
            ],
          },
        }),
      ],
      { type: "application/json" }
    )
  );
  body.append(
    "languages",
    new Blob([JSON.stringify(["en"])], { type: "application/json" })
  );

  const url = `${SEDIA_URL}?apiKey=SEDIA&text=*&pageSize=${pageSize}&pageNumber=${pageNumber}&sortBy=sortStatus&sortOrder=ASC`;

  const res = await fetch(url, {
    method: "POST",
    headers: { Accept: "application/json" },
    body,
  });

  if (!res.ok) {
    throw new Error(`SEDIA error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const total = data.totalResults || 0;
  const topics: EUTopic[] = (data.results || []).map((r: unknown) => {
    const record = r as { metadata?: Record<string, unknown>; url?: string; summary?: string };
    const m = record.metadata || {};
    const status = firstOr(m.status as string[]) === "31094502" ? "open" : "forthcoming";
    const identifier = (firstOr(m.identifier as string[]) as string) || "unknown";

    return {
      identifier,
      title: (firstOr(m.title as string[]) as string) || identifier,
      summary: (record.summary as string) || null,
      url: record.url || `${TOPIC_DETAILS_BASE}/${identifier}.json`,
      callTitle: firstOr(m.callTitle as string[]) as string | null,
      status: status as "open" | "forthcoming",
      frameworkProgramme: firstOr(m.frameworkProgramme as string[]) as string | null,
      programmePeriod: firstOr(m.programmePeriod as string[]) as string | null,
      deadline: firstOr(m.deadlineDate as string[]) as string | null,
      startDate: firstOr(m.startDate as string[]) as string | null,
      typesOfAction: ensureArray(m.typesOfAction as string | string[]),
      destinationDetails: ensureArray(m.destinationDetails as string | string[]),
      keywords: ensureArray(m.keywords as string | string[]),
      focusArea: ensureArray(m.focusArea as string | string[]),
      description: firstOr(m.description as string[]) as string | null,
    };
  });

  return { total, topics };
}

/**
 * Fetch all open + forthcoming EU topics (~800 typically)
 */
export async function fetchEUOpenCalls(): Promise<EUTopic[]> {
  console.log("[EU Funding] Starting SEDIA ingestion...");
  const all: EUTopic[] = [];
  const pageSize = 100;
  let page = 1;

  // First page to get total
  const { total, topics: first } = await fetchPage(page, pageSize);
  all.push(...first);
  console.log(`[EU Funding] Page 1: ${first.length}/${total}`);

  const totalPages = Math.ceil(total / pageSize);
  for (page = 2; page <= Math.min(totalPages, 20); page++) {
    try {
      const { topics } = await fetchPage(page, pageSize);
      all.push(...topics);
      console.log(`[EU Funding] Page ${page}: ${all.length}/${total}`);
      await new Promise((r) => setTimeout(r, 200));
    } catch (e) {
      console.error(`[EU Funding] Page ${page} failed:`, e);
    }
  }

  console.log(`[EU Funding] Done. Total: ${all.length}`);
  return all;
}

function detectThemes(topic: EUTopic): string[] {
  const text = [
    topic.title,
    topic.callTitle,
    topic.frameworkProgramme,
    ...topic.keywords,
    ...topic.focusArea,
    ...topic.destinationDetails,
    topic.summary,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const themes: string[] = [];
  const keywords: Array<[RegExp, string]> = [
    [/climate|environment|green|biodivers|nature|life/i, "Environnement"],
    [/youth|education|erasmus|training|skill/i, "Éducation"],
    [/research|innovation|horizon|science/i, "Recherche"],
    [/health|cancer|disease|medical/i, "Santé"],
    [/digital|cyber|ai|artificial intelligence/i, "Numérique"],
    [/culture|creative|media|art/i, "Culture"],
    [/migration|asylum|refugee|integration/i, "Migration"],
    [/rights|equality|democracy|citizen|cerv/i, "Droits"],
    [/gender|women|feminist/i, "Égalité"],
    [/employment|social|poverty|esf/i, "Social"],
    [/agriculture|rural|food/i, "Agriculture"],
    [/sport/i, "Sport"],
    [/humanitarian|development|intpa|ndici/i, "Humanitaire"],
    [/energy|renewable/i, "Énergie"],
  ];
  for (const [re, theme] of keywords) {
    if (re.test(text)) themes.push(theme);
  }
  return themes.length ? themes : ["Europe"];
}

/**
 * Transform to our Grant schema
 */
export function transformEUToGrant(topic: EUTopic) {
  const funder = topic.frameworkProgramme || "Commission européenne";
  const isHumanitarian = /intpa|ndici|huma|ipa/i.test(
    `${topic.frameworkProgramme} ${topic.callTitle} ${topic.identifier}`
  );

  return {
    sourceUrl: `https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-details/${topic.identifier}`,
    sourceName: isHumanitarian ? "EuropeAid / INTPA" : "EU Funding & Tenders",
    title: topic.title,
    summary: topic.summary || topic.callTitle || null,
    rawContent: topic.description || topic.summary || null,
    funder,
    country: "EU",
    thematicAreas: detectThemes(topic),
    eligibleEntities: ["association", "ngo", "research", "public"],
    eligibleCountries: ["EU", "FR"],
    minAmountEur: null,
    maxAmountEur: null,
    coFinancingRequired: true,
    deadline: topic.deadline ? new Date(topic.deadline) : null,
    grantType: "appel_a_projets",
    language: "en",
    status: "active",
    aiSummary: null,
  };
}

// Backward compat alias used elsewhere in the codebase
export const fetchEUTopics = fetchEUOpenCalls;
