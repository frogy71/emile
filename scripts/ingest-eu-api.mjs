/**
 * Ingest EU grants from the EU Funding & Tenders Opportunities Portal API
 *
 * API docs: https://api.tech.ec.europa.eu/search-api/prod/rest/search
 * This is the official EU Search API for funding opportunities.
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const S = process.env.NEXT_PUBLIC_SUPABASE_URL;
const K = process.env.SUPABASE_SERVICE_ROLE_KEY;

const EU_SEARCH_URL = "https://api.tech.ec.europa.eu/search-api/prod/rest/search";

// Programs relevant to NGOs/associations
const PROGRAMMES = [
  "CERV",      // Citizens, Equality, Rights and Values
  "ERASMUS+",  // Erasmus+
  "LIFE",      // Environment & Climate
  "ESF",       // European Social Fund
  "AMIF",      // Asylum, Migration, Integration
  "CREA",      // Creative Europe
  "HORIZON",   // Horizon Europe
  "NDICI",     // Global Europe (international cooperation)
];

async function upsert(grants) {
  let ok = 0, err = 0;
  for (let i = 0; i < grants.length; i += 50) {
    const chunk = grants.slice(i, i + 50);
    const r = await fetch(S + "/rest/v1/grants", {
      method: "POST",
      headers: {
        apikey: K,
        Authorization: "Bearer " + K,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(chunk),
    });
    if (r.ok) ok += chunk.length;
    else {
      err += chunk.length;
      const body = await r.text();
      console.error(`  Upsert error: ${r.status} ${body.slice(0, 200)}`);
    }
  }
  return { ok, err };
}

function extractThemes(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  const themes = [];
  const kw = {
    "Environnement": /environment|climat|biodiversity|nature|green|circular/,
    "Éducation": /education|training|learning|school|pedagog/,
    "Jeunesse": /youth|young people|children/,
    "Culture": /cultur|creative|heritage|arts|media/,
    "Droits": /rights|justice|equality|rule of law|democracy/,
    "Inclusion": /inclusion|social|poverty|disability|integration/,
    "Migration": /migration|asylum|refugee|integration of migrants/,
    "Santé": /health|medical|mental health|pandemic/,
    "Innovation": /innovation|digital|research|technology|AI/,
    "Solidarité": /solidarity|volunteer|humanitarian|aid/,
    "Emploi": /employment|labour|skills|workforce/,
    "Genre": /gender|women|violence against/,
  };
  for (const [t, r] of Object.entries(kw)) {
    if (r.test(text)) themes.push(t);
  }
  return themes.length > 0 ? themes : ["Europe"];
}

async function fetchEUGrants() {
  console.log("\n🇪🇺 ═══ EU FUNDING & TENDERS API INGESTION ═══\n");

  const allGrants = [];

  // Query the EU Search API for open calls
  const queryBody = {
    apiKey: "SEDIA",
    text: "*",
    query: {
      bool: {
        must: [
          { terms: { "metadata.status.keyword": ["Open", "Forthcoming"] } },
          { term: { "metadata.type.keyword": "1" } }, // 1 = Call for Proposals
        ],
      },
    },
    languages: ["en", "fr"],
    pageSize: 100,
    pageNumber: 1,
    sortField: "metadata.deadlineDate",
    sortOrder: "ASC",
  };

  console.log("Fetching from EU Search API...");

  try {
    const res = await fetch(EU_SEARCH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(queryBody),
    });

    if (!res.ok) {
      console.log(`API returned ${res.status}. Trying alternative approach...`);
      // Fallback: use the simpler REST endpoint
      await fetchEUGrantsFallback(allGrants);
    } else {
      const data = await res.json();
      console.log(`Found ${data.results?.length || 0} results (total: ${data.totalResults || 0})`);

      for (const result of data.results || []) {
        const meta = result.metadata || {};
        const title = meta.title?.[0] || result.title || "";
        const identifier = meta.identifier?.[0] || "";
        const description = meta.description?.[0] || meta.summary?.[0] || "";
        const deadline = meta.deadlineDate?.[0] || null;
        const budget = meta.budget?.[0] ? parseFloat(meta.budget[0]) : null;
        const programme = meta.programmePeriod?.[0] || meta.frameworkProgramme?.[0] || "";
        const status = meta.status?.[0] === "Open" ? "active" : "forthcoming";

        allGrants.push({
          source_url: `https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-details/${identifier}`,
          source_name: "EU Funding & Tenders",
          title: title.slice(0, 500),
          summary: description.slice(0, 1000) || `Appel à propositions du programme ${programme}`,
          raw_content: description.slice(0, 2000) || null,
          funder: `Commission Européenne — ${programme}`,
          country: "EU",
          thematic_areas: extractThemes(title, description),
          eligible_entities: ["association", "ong", "fondation", "institution"],
          eligible_countries: ["FR", "EU"],
          min_amount_eur: null,
          max_amount_eur: budget,
          co_financing_required: true,
          deadline: deadline ? new Date(deadline).toISOString().split("T")[0] : null,
          grant_type: "appel_a_projets",
          language: "en",
          status,
          ai_summary: null,
        });
      }

      // Fetch additional pages
      const totalPages = Math.min(Math.ceil((data.totalResults || 0) / 100), 5);
      for (let page = 2; page <= totalPages; page++) {
        queryBody.pageNumber = page;
        const pageRes = await fetch(EU_SEARCH_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(queryBody),
        });
        if (pageRes.ok) {
          const pageData = await pageRes.json();
          for (const result of pageData.results || []) {
            const meta = result.metadata || {};
            const title = meta.title?.[0] || "";
            const identifier = meta.identifier?.[0] || "";
            const description = meta.description?.[0] || "";
            const deadline = meta.deadlineDate?.[0] || null;
            const budget = meta.budget?.[0] ? parseFloat(meta.budget[0]) : null;
            const programme = meta.programmePeriod?.[0] || "";
            const status = meta.status?.[0] === "Open" ? "active" : "forthcoming";

            allGrants.push({
              source_url: `https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-details/${identifier}`,
              source_name: "EU Funding & Tenders",
              title: title.slice(0, 500),
              summary: description.slice(0, 1000) || `Appel du programme ${programme}`,
              raw_content: description.slice(0, 2000) || null,
              funder: `Commission Européenne — ${programme}`,
              country: "EU",
              thematic_areas: extractThemes(title, description),
              eligible_entities: ["association", "ong", "fondation", "institution"],
              eligible_countries: ["FR", "EU"],
              min_amount_eur: null,
              max_amount_eur: budget,
              co_financing_required: true,
              deadline: deadline ? new Date(deadline).toISOString().split("T")[0] : null,
              grant_type: "appel_a_projets",
              language: "en",
              status,
              ai_summary: null,
            });
          }
          console.log(`  Page ${page}: ${pageData.results?.length || 0} results`);
        }
      }
    }
  } catch (e) {
    console.log(`Search API error: ${e.message}. Using fallback...`);
    await fetchEUGrantsFallback(allGrants);
  }

  console.log(`\nTotal EU grants collected: ${allGrants.length}`);

  if (allGrants.length > 0) {
    const result = await upsert(allGrants);
    console.log(`✅ EU API: ${result.ok} upserted, ${result.err} errors`);
  }

  // Show DB stats
  console.log("\n═══ FINAL EU GRANTS IN DB ═══");
  const r = await fetch(
    S + "/rest/v1/grants?source_name=eq.EU%20Funding%20%26%20Tenders&select=id",
    {
      headers: {
        apikey: K,
        Authorization: "Bearer " + K,
        Prefer: "count=exact",
        Range: "0-0",
      },
    }
  );
  const range = r.headers.get("content-range");
  console.log(`EU Funding & Tenders: ${range?.split("/")[1] || "?"} grants\n`);
}

/**
 * Fallback: Fetch from the public RSS/JSON feeds if Search API is restricted
 */
async function fetchEUGrantsFallback(allGrants) {
  console.log("Using Funding & Tenders portal feeds...");

  // Use the portal's public funding opportunities API
  const feedUrl = "https://ec.europa.eu/info/funding-tenders/opportunities/data/referenceData/grantsTenders.json";

  try {
    const res = await fetch(feedUrl);
    if (res.ok) {
      const data = await res.json();
      const topics = data.fundingData?.GrantTenderObj || [];
      console.log(`Feed returned ${topics.length} topics`);

      for (const topic of topics) {
        if (topic.status !== "Open" && topic.status !== "Forthcoming") continue;

        const title = topic.title || topic.identifier || "";
        const deadline = topic.deadlineDate || null;
        const budget = topic.budget ? parseFloat(topic.budget) : null;

        allGrants.push({
          source_url: `https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-details/${topic.identifier || ""}`,
          source_name: "EU Funding & Tenders",
          title: title.slice(0, 500),
          summary: topic.description?.slice(0, 1000) || `Appel à propositions EU — ${topic.identifier || ""}`,
          raw_content: topic.description?.slice(0, 2000) || null,
          funder: `Commission Européenne — ${topic.programmePeriod || ""}`,
          country: "EU",
          thematic_areas: extractThemes(title, topic.description || ""),
          eligible_entities: ["association", "ong", "fondation"],
          eligible_countries: ["FR", "EU"],
          min_amount_eur: null,
          max_amount_eur: budget,
          co_financing_required: true,
          deadline: deadline ? new Date(deadline).toISOString().split("T")[0] : null,
          grant_type: "appel_a_projets",
          language: "en",
          status: topic.status === "Open" ? "active" : "forthcoming",
          ai_summary: null,
        });
      }
    } else {
      console.log(`Feed returned ${res.status}, keeping existing seed data`);
    }
  } catch (e) {
    console.log(`Feed error: ${e.message}. Existing seed data preserved.`);
  }
}

fetchEUGrants().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
