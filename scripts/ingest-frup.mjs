/**
 * Ingest FRUP (Fondations Reconnues d'Utilité Publique) from data.gouv.fr
 * + Fondations d'entreprises
 * + Fix EU Funding & Tenders API
 * + Deduplicate grants
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import XLSX from "xlsx";
import { writeFileSync } from "fs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function upsertGrants(grants) {
  let inserted = 0, errors = 0;
  const chunkSize = 50;
  for (let i = 0; i < grants.length; i += chunkSize) {
    const chunk = grants.slice(i, i + chunkSize);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/grants`, {
        method: "POST",
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify(chunk),
      });
      if (res.ok) inserted += chunk.length;
      else { errors += chunk.length; }
    } catch (e) { errors += chunk.length; }
  }
  return { inserted, errors };
}

// ── 1. FRUP from data.gouv.fr ───────────────────────────────────

async function ingestFRUP() {
  console.log("[FRUP] Downloading XLSX from data.gouv.fr...");
  const url = "https://static.data.gouv.fr/resources/fondations-reconnues-d-utilite-publique/20241125-114631/base-frup-pour-dtnum-21.11.24-vde-vu-baf.xlsx";

  const res = await fetch(url);
  if (!res.ok) { console.error("Failed to download FRUP:", res.status); return []; }

  const buffer = Buffer.from(await res.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  console.log(`[FRUP] Parsed ${rows.length} fondations from XLSX`);
  console.log(`[FRUP] Columns:`, Object.keys(rows[0] || {}).join(", "));

  // Transform to grant format
  const grants = rows.map((row, i) => {
    const name = row["Nom"] || row["NOM"] || row["Dénomination"] || row["denomination"] || row["DENOMINATION"] || Object.values(row)[0] || `Fondation FRUP #${i}`;
    const objet = row["Objet"] || row["OBJET"] || row["objet"] || row["Objet social"] || "";
    const ville = row["Ville"] || row["VILLE"] || row["Siège"] || "";
    const dept = row["Département"] || row["DEPARTEMENT"] || row["Dept"] || "";

    // Try to extract thematic areas from objet
    const themes = [];
    const themeKeywords = {
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
    for (const [theme, regex] of Object.entries(themeKeywords)) {
      if (regex.test(objet) || regex.test(name)) themes.push(theme);
    }

    return {
      source_url: `https://data.gouv.fr/frup/${encodeURIComponent(name.slice(0, 100))}`,
      source_name: "data.gouv.fr — FRUP",
      title: name.slice(0, 300),
      summary: objet ? `${objet.slice(0, 500)}${ville ? ` — ${ville}` : ""}${dept ? ` (${dept})` : ""}` : `Fondation reconnue d'utilité publique${ville ? ` basée à ${ville}` : ""}.`,
      raw_content: objet || null,
      funder: name.slice(0, 200),
      country: "FR",
      thematic_areas: themes.length > 0 ? themes : ["Intérêt général"],
      eligible_entities: ["association", "ong"],
      eligible_countries: ["FR"],
      min_amount_eur: null,
      max_amount_eur: null,
      co_financing_required: false,
      deadline: null,
      grant_type: "fondation",
      language: "fr",
      status: "active",
      ai_summary: null,
    };
  }).filter(g => g.title && g.title.length > 3);

  console.log(`[FRUP] Transformed ${grants.length} fondations`);
  return grants;
}

// ── 2. EU Funding & Tenders (fix API) ────────────────────────────

async function ingestEU() {
  console.log("[EU] Trying updated API endpoints...");

  // Try the correct GET endpoint
  const programs = ["CERV", "ESF", "ERASMUS", "LIFE", "AMIF", "CREA"];
  const allTopics = [];

  for (const prog of programs) {
    try {
      // Try GET with query params
      const url = `https://api.tech.ec.europa.eu/search-api/prod/rest/search?apiKey=SEDIA&text=*&query=(frameworkProgramme%3D%22${prog}%22)%20AND%20(status%3D%22OPEN%22%20OR%20status%3D%22FORTHCOMING%22)&pageSize=50&pageNumber=1`;
      const res = await fetch(url);

      if (res.ok) {
        const data = await res.json();
        const results = data?.results || [];
        allTopics.push(...results.map(r => ({ ...r, programme: prog })));
        console.log(`  ${prog}: ${results.length} calls`);
        continue;
      }
    } catch (e) {}

    // Fallback: try alternative search endpoint
    try {
      const url2 = `https://ec.europa.eu/info/funding-tenders/opportunities/data/referenceData/grantTendersTopic?programmePeriod=2021-2027&frameworkProgramme=${prog}&status=OPEN&status=FORTHCOMING`;
      const res2 = await fetch(url2);
      if (res2.ok) {
        const data2 = await res2.json();
        const results2 = data2?.fundingData?.GrantTenderObj || [];
        allTopics.push(...results2.map(r => ({ ...r, programme: prog })));
        console.log(`  ${prog} (alt): ${results2.length} calls`);
      } else {
        console.log(`  ${prog}: HTTP ${res2.status}`);
      }
    } catch (e) {
      console.log(`  ${prog}: error`);
    }

    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`[EU] Total: ${allTopics.length} calls`);

  return allTopics.map(t => ({
    source_url: t.identifier
      ? `https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-details/${t.identifier}`
      : `https://ec.europa.eu/info/funding-tenders/opportunities/portal/#eu-${t.programme}-${Math.random().toString(36).slice(2,8)}`,
    source_name: "EU Funding & Tenders",
    title: (t.title || t.Title || t.callTitle || `EU ${t.programme} Call`).slice(0, 300),
    summary: (t.description || t.Description || "").replace(/<[^>]*>/g, " ").slice(0, 500) || null,
    raw_content: t.description || t.Description || null,
    funder: `Commission Européenne — ${t.programme}`,
    country: "EU",
    thematic_areas: [...(t.keywords || []), ...(t.focusArea || [])].slice(0, 10),
    eligible_entities: ["association", "ong", "fondation"],
    eligible_countries: ["FR", "EU"],
    min_amount_eur: null,
    max_amount_eur: null,
    co_financing_required: true,
    deadline: t.deadlineDate || t.DeadlineDate || null,
    grant_type: "appel_a_projets",
    language: "en",
    status: "active",
    ai_summary: null,
  }));
}

// ── Main ─────────────────────────────────────────────────────────

async function main() {
  console.log("\n📦 ═══ FRUP + EU INGESTION ═══\n");
  const start = Date.now();

  // 1. FRUP
  console.log("── 1/2: FRUP from data.gouv.fr ──");
  const frupGrants = await ingestFRUP();
  if (frupGrants.length > 0) {
    const r = await upsertGrants(frupGrants);
    console.log(`✅ FRUP: ${r.inserted} inserted, ${r.errors} errors\n`);
  }

  // 2. EU
  console.log("── 2/2: EU Funding & Tenders ──");
  const euGrants = await ingestEU();
  if (euGrants.length > 0) {
    const r = await upsertGrants(euGrants);
    console.log(`✅ EU: ${r.inserted} inserted, ${r.errors} errors\n`);
  }

  // Total count
  const totalTime = Math.round((Date.now() - start) / 1000);
  const countRes = await fetch(`${SUPABASE_URL}/rest/v1/grants?select=id`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, Prefer: "count=exact", Range: "0-0" },
  });
  console.log(`\n═══ DONE in ${totalTime}s ═══`);
  console.log(`📦 Total grants in DB: ${countRes.headers.get("content-range")}`);
}

main().catch(e => { console.error("Fatal:", e); process.exit(1); });
