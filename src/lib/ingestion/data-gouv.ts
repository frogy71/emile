/**
 * Data.gouv.fr ingestion
 * https://www.data.gouv.fr/
 *
 * Open data portal with subsidy datasets:
 * - Subventions versées aux associations (national)
 * - FDVA data
 * - Various regional subsidy datasets
 *
 * API: https://www.data.gouv.fr/api/1/
 */

const BASE_URL = "https://www.data.gouv.fr/api/1";

// Key datasets for association grants
const GRANT_DATASETS = [
  {
    id: "subventions-associations",
    searchQuery: "subventions associations",
    description: "Subventions versées aux associations",
  },
  {
    id: "fdva",
    searchQuery: "FDVA fonds développement vie associative",
    description: "FDVA - Fonds pour le Développement de la Vie Associative",
  },
  {
    id: "appels-projets",
    searchQuery: "appels à projets associations",
    description: "Appels à projets pour associations",
  },
];

export interface DataGouvDataset {
  id: string;
  title: string;
  description: string;
  url: string;
  organization: { name: string } | null;
  resources: {
    id: string;
    title: string;
    url: string;
    format: string;
    filesize: number;
  }[];
  created_at: string;
  last_update: string;
  tags: string[];
}

/**
 * Search data.gouv.fr for grant-related datasets
 */
export async function searchGrantDatasets(): Promise<DataGouvDataset[]> {
  const allDatasets: DataGouvDataset[] = [];

  for (const dataset of GRANT_DATASETS) {
    try {
      const response = await fetch(
        `${BASE_URL}/datasets/?q=${encodeURIComponent(dataset.searchQuery)}&page_size=10`
      );
      if (!response.ok) continue;

      const data = await response.json();
      allDatasets.push(...(data.data || []));

      console.log(
        `[data.gouv.fr] "${dataset.searchQuery}": ${data.data?.length || 0} datasets`
      );
    } catch (error) {
      console.warn(`[data.gouv.fr] Error:`, error);
    }

    await new Promise((r) => setTimeout(r, 300));
  }

  return allDatasets;
}

/**
 * Fetch a specific CSV/JSON resource from data.gouv.fr
 */
export async function fetchDatasetResource(
  resourceUrl: string,
  format: "csv" | "json" = "json"
): Promise<unknown[]> {
  const response = await fetch(resourceUrl);
  if (!response.ok)
    throw new Error(`Failed to fetch resource: ${response.status}`);

  if (format === "json") {
    return response.json();
  }

  // CSV parsing (basic)
  const text = await response.text();
  const lines = text.split("\n");
  const headers = lines[0]?.split(",").map((h) => h.trim().replace(/"/g, ""));
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
    return Object.fromEntries(
      headers?.map((h, i) => [h, values[i]]) || []
    );
  });
}
