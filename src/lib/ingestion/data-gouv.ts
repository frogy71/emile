/**
 * Data.gouv.fr ingestion
 *
 * Two datasets:
 * 1. FRUP — Fondations Reconnues d'Utilité Publique (XLSX)
 * 2. Fondations d'entreprises (ODS/XLSX)
 *
 * API: https://www.data.gouv.fr/api/1/
 */

import * as XLSX from "xlsx";
import { SOURCES } from "./sources";

// ─── Theme detection from text ──────────────────────────────────
const THEME_KEYWORDS: Record<string, RegExp> = {
  "Éducation": /éducati|enseignement|scola|formation/i,
  "Santé": /santé|médic|hôpital|soin/i,
  "Culture": /cultur|art|musé|patrimoine/i,
  "Solidarité": /solidar|social|aide|secours/i,
  "Recherche": /recherch|scientif/i,
  "Environnement": /environnement|écolog|nature|biodiversit/i,
  "Humanitaire": /humanitaire|développement|international/i,
  "Jeunesse": /jeune|enfan|adolesc/i,
  "Sport": /sport|olymp/i,
  "Logement": /logement|hébergement|habitat/i,
};

function detectThemes(text: string): string[] {
  const themes: string[] = [];
  for (const [theme, regex] of Object.entries(THEME_KEYWORDS)) {
    if (regex.test(text)) themes.push(theme);
  }
  return themes.length > 0 ? themes : ["Intérêt général"];
}

// ─── Download and parse XLSX/ODS ────────────────────────────────

async function downloadAndParseSpreadsheet(url: string): Promise<Record<string, unknown>[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download: ${res.status}`);

  const buffer = Buffer.from(await res.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet);
}

// ─── FRUP ingestion ─────────────────────────────────────────────

export async function fetchFRUP() {
  const source = SOURCES.find((s) => s.id === "datagouv-frup");
  if (!source?.apiUrl) throw new Error("FRUP source URL not configured");

  console.log("[FRUP] Downloading XLSX from data.gouv.fr...");
  const rows = await downloadAndParseSpreadsheet(source.apiUrl);
  console.log(`[FRUP] Parsed ${rows.length} fondations`);

  return rows;
}

export function transformFRUPToGrant(row: Record<string, unknown>, index: number) {
  const name = String(
    row["Nom"] || row["NOM"] || row["Dénomination"] || row["denomination"] ||
    row["DENOMINATION"] || Object.values(row)[0] || `Fondation FRUP #${index}`
  );
  const objet = String(row["Objet"] || row["OBJET"] || row["objet"] || row["Objet social"] || "");
  const ville = String(row["Ville"] || row["VILLE"] || row["Siège"] || "");
  const dept = String(row["Département"] || row["DEPARTEMENT"] || row["Dept"] || "");

  const themes = detectThemes(`${name} ${objet}`);

  return {
    sourceUrl: `https://data.gouv.fr/frup/${encodeURIComponent(name.slice(0, 100))}`,
    sourceName: "data.gouv.fr — FRUP",
    title: name.slice(0, 300),
    summary: objet
      ? `${objet.slice(0, 500)}${ville ? ` — ${ville}` : ""}${dept ? ` (${dept})` : ""}`
      : `Fondation reconnue d'utilité publique${ville ? ` basée à ${ville}` : ""}.`,
    rawContent: objet || null,
    funder: name.slice(0, 200),
    country: "FR",
    thematicAreas: themes,
    eligibleEntities: ["association", "ong"],
    eligibleCountries: ["FR"],
    minAmountEur: null,
    maxAmountEur: null,
    coFinancingRequired: false,
    deadline: null,
    grantType: "fondation",
    language: "fr",
    status: "active",
    aiSummary: null,
  };
}

// ─── Fondations d'entreprises ingestion ─────────────────────────

export async function fetchFondationsEntreprises() {
  const source = SOURCES.find((s) => s.id === "datagouv-fe");
  if (!source?.apiUrl) throw new Error("FE source URL not configured");

  console.log("[FE] Downloading spreadsheet from data.gouv.fr...");
  const rows = await downloadAndParseSpreadsheet(source.apiUrl);
  console.log(`[FE] Parsed ${rows.length} fondations d'entreprises`);

  return rows;
}

export function transformFEToGrant(row: Record<string, unknown>, index: number) {
  const name = String(
    row["Nom"] || row["NOM"] || row["Dénomination"] || row["denomination"] ||
    row["Nom de la fondation"] || Object.values(row)[0] || `Fondation entreprise #${index}`
  );
  const objet = String(row["Objet"] || row["OBJET"] || row["Objet social"] || "");
  const entreprise = String(row["Entreprise fondatrice"] || row["Fondateur"] || "");

  const themes = detectThemes(`${name} ${objet}`);

  return {
    sourceUrl: `https://data.gouv.fr/fe/${encodeURIComponent(name.slice(0, 100))}`,
    sourceName: "data.gouv.fr — Fondations entreprises",
    title: name.slice(0, 300),
    summary: objet
      ? `${objet.slice(0, 500)}${entreprise ? ` — Fondée par ${entreprise}` : ""}`
      : `Fondation d'entreprise${entreprise ? ` créée par ${entreprise}` : ""}.`,
    rawContent: objet || null,
    funder: name.slice(0, 200),
    country: "FR",
    thematicAreas: themes,
    eligibleEntities: ["association", "ong"],
    eligibleCountries: ["FR"],
    minAmountEur: null,
    maxAmountEur: null,
    coFinancingRequired: false,
    deadline: null,
    grantType: "fondation",
    language: "fr",
    status: "active",
    aiSummary: null,
  };
}
