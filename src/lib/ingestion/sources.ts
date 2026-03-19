/**
 * ═══ EMILE — SOURCE REGISTRY ═══
 *
 * Single source of truth for all data sources.
 * Each source defines: method, frequency, reliability, API details.
 *
 * ┌────────────────────────────┬────────┬──────────────┬────────────┐
 * │ Source                     │ Method │ Frequency    │ Grants     │
 * ├────────────────────────────┼────────┼──────────────┼────────────┤
 * │ Aides-Territoires          │ API    │ Daily        │ ~1,200     │
 * │ data.gouv.fr FRUP          │ API    │ Monthly      │ ~450       │
 * │ data.gouv.fr FE            │ API    │ Monthly      │ ~250       │
 * │ EU Funding & Tenders       │ API    │ Weekly       │ ~15+       │
 * │ Fondations curated         │ Manual │ Quarterly    │ ~20        │
 * └────────────────────────────┴────────┴──────────────┴────────────┘
 *
 * Priority: API sources always win over scraped data for the same grant.
 */

export interface DataSource {
  id: string;
  name: string;
  method: "api" | "api_download" | "scraping" | "curated";
  reliability: "high" | "medium" | "low";
  frequency: "daily" | "weekly" | "monthly" | "quarterly";
  apiUrl?: string;
  authType?: "token" | "jwt" | "none";
  description: string;
  estimatedGrants: number;
  enabled: boolean;
}

export const SOURCES: DataSource[] = [
  {
    id: "aides-territoires",
    name: "Aides-Territoires",
    method: "api",
    reliability: "high",
    frequency: "daily",
    apiUrl: "https://aides-territoires.beta.gouv.fr/api/aids/",
    authType: "jwt",
    description:
      "API officielle du gouvernement. Subventions État + Régions + Départements + EPCI. Source #1 en volume et fiabilité.",
    estimatedGrants: 1200,
    enabled: true,
  },
  {
    id: "datagouv-frup",
    name: "data.gouv.fr — FRUP",
    method: "api_download",
    reliability: "high",
    frequency: "monthly",
    apiUrl:
      "https://static.data.gouv.fr/resources/fondations-reconnues-d-utilite-publique/20241125-114631/base-frup-pour-dtnum-21.11.24-vde-vu-baf.xlsx",
    authType: "none",
    description:
      "Liste officielle des Fondations Reconnues d'Utilité Publique. Fichier XLSX du Ministère de l'Intérieur.",
    estimatedGrants: 450,
    enabled: true,
  },
  {
    id: "datagouv-fe",
    name: "data.gouv.fr — Fondations entreprises",
    method: "api_download",
    reliability: "high",
    frequency: "monthly",
    apiUrl:
      "https://static.data.gouv.fr/resources/fondations-d-entreprises/20200810-123428/liste-des-fondations-dentreprise-fe-au-1er-aout-2020.ods",
    authType: "none",
    description:
      "Liste officielle des fondations d'entreprises. Fichier ODS du Ministère de l'Intérieur.",
    estimatedGrants: 250,
    enabled: true,
  },
  {
    id: "eu-funding",
    name: "EU Funding & Tenders",
    method: "curated",
    reliability: "medium",
    frequency: "weekly",
    apiUrl:
      "https://ec.europa.eu/info/funding-tenders/opportunities/portal/",
    authType: "none",
    description:
      "Programmes européens : CERV, Erasmus+, LIFE, FSE+, AMIF, Europe Créative, NDICI, Horizon. API SEDIA en cours d'investigation.",
    estimatedGrants: 15,
    enabled: true,
  },
  {
    id: "fondations-curated",
    name: "Fondations françaises (curated)",
    method: "curated",
    reliability: "high",
    frequency: "quarterly",
    description:
      "Top 20 fondations françaises avec données riches : Abbé Pierre, Orange, SNCF, Bettencourt, Kering, etc.",
    estimatedGrants: 20,
    enabled: true,
  },
];

/**
 * Get all enabled sources
 */
export function getEnabledSources(): DataSource[] {
  return SOURCES.filter((s) => s.enabled);
}

/**
 * Get sources that should run at a given frequency
 */
export function getSourcesByFrequency(
  freq: "daily" | "weekly" | "monthly"
): DataSource[] {
  const freqOrder = { daily: 1, weekly: 2, monthly: 3, quarterly: 4 };
  return SOURCES.filter(
    (s) => s.enabled && freqOrder[s.frequency] <= freqOrder[freq]
  );
}
