/**
 * Emile Grant Ingestion Script
 * Run: node scripts/ingest.mjs
 *
 * Sources:
 * 1. Aides-Territoires public search (scraping HTML)
 * 2. EU Funding & Tenders API (public, no auth)
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SERVICE_KEY");
  process.exit(1);
}

function cleanHtml(html) {
  if (!html) return null;
  return html.replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/\s+/g, " ").trim();
}

// ── EU Funding & Tenders (public API, no auth needed) ───────────

async function fetchEUCalls() {
  const EU_SEARCH = "https://ec.europa.eu/info/funding-tenders/opportunities/data/topicSearch";
  const programs = ["CERV", "ESF", "ERASMUS", "LIFE", "AMIF", "CREA", "SOCPL", "NDICI"];
  const allTopics = [];

  console.log("[EU Funding] Starting...");

  for (const prog of programs) {
    try {
      const res = await fetch(EU_SEARCH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "*",
          frameworkProgramme: [prog],
          status: ["OPEN", "FORTHCOMING"],
          pageNumber: 1,
          pageSize: 100,
          sortBy: "deadlineDate",
          sortOrder: "ASC",
        }),
      });

      if (!res.ok) { console.warn(`  ${prog}: HTTP ${res.status}`); continue; }
      const data = await res.json();
      const results = data?.topicResults?.results || [];
      allTopics.push(...results);
      console.log(`  ${prog}: ${results.length} calls`);
    } catch (e) {
      console.warn(`  ${prog}: error — ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`[EU Funding] Total: ${allTopics.length} calls\n`);
  return allTopics;
}

function transformEU(raw) {
  const progNames = {
    CERV: "CERV — Citoyens, Égalité, Droits et Valeurs",
    ESF: "Fonds Social Européen+",
    ERASMUS: "Erasmus+",
    LIFE: "LIFE — Environnement & Climat",
    AMIF: "AMIF — Asile, Migration, Intégration",
    CREA: "Europe Créative",
    SOCPL: "Prérogatives Sociales",
    NDICI: "NDICI — Coopération internationale",
  };

  return {
    source_url: `https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-details/${raw.identifier}`,
    source_name: "EU Funding & Tenders",
    title: raw.title || raw.callTitle || "EU Call",
    summary: cleanHtml(raw.description)?.slice(0, 500) || null,
    raw_content: raw.description || null,
    funder: progNames[raw.frameworkProgramme] || `Commission Européenne — ${raw.frameworkProgramme}`,
    country: "EU",
    thematic_areas: [...(raw.keywords || []), ...(raw.focusArea || [])].slice(0, 10),
    eligible_entities: ["association", "ong", "fondation"],
    eligible_countries: ["FR", "EU"],
    min_amount_eur: null,
    max_amount_eur: null,
    co_financing_required: true,
    deadline: raw.deadlineDate || null,
    grant_type: "appel_a_projets",
    language: "en",
    status: raw.status === "OPEN" ? "active" : "forthcoming",
    ai_summary: null,
  };
}

// ── Aides-Territoires (scrape public HTML pages) ─────────────────

async function fetchAidesTerritorresPublic() {
  console.log("[Aides-Territoires] Scraping public pages...");
  const allGrants = [];
  const baseUrl = "https://aides-territoires.beta.gouv.fr";

  // Scrape the public search results pages
  for (let page = 1; page <= 60; page++) {
    try {
      const url = `${baseUrl}/aides/?targeted_audiences=association&page=${page}`;
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Emile-GrantFinder/1.0 (contact: hello@emile.app)",
          "Accept": "text/html",
        }
      });

      if (!res.ok) {
        if (res.status === 404) break; // No more pages
        console.warn(`  Page ${page}: HTTP ${res.status}`);
        continue;
      }

      const html = await res.text();

      // Extract aid cards from HTML
      const aidRegex = /<article[^>]*class="[^"]*aid-result[^"]*"[^>]*>[\s\S]*?<\/article>/gi;
      const titleLinkRegex = /<a[^>]*href="(\/aides\/[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
      const funderRegex = /<p[^>]*class="[^"]*aid-financers[^"]*"[^>]*>([\s\S]*?)<\/p>/gi;

      // Simple extraction: find all aid links
      const linkRegex = /href="(\/aides\/[^"]*?)"/gi;
      let match;
      const links = new Set();
      while ((match = linkRegex.exec(html)) !== null) {
        if (!match[1].includes('/recherche/') && !match[1].includes('/inscription/')) {
          links.add(match[1]);
        }
      }

      // Extract titles from h2/h3 within results
      const titleRegex = /<h[23][^>]*>\s*<a[^>]*href="(\/aides\/[^"]*)"[^>]*>\s*([\s\S]*?)\s*<\/a>\s*<\/h[23]>/gi;
      const titles = {};
      while ((match = titleRegex.exec(html)) !== null) {
        titles[match[1]] = cleanHtml(match[2]);
      }

      for (const link of links) {
        const title = titles[link] || link.replace(/\/aides\//, '').replace(/[-\/]/g, ' ').trim();
        if (title && title.length > 5) {
          allGrants.push({
            source_url: `${baseUrl}${link}`,
            source_name: "Aides-Territoires",
            title: title.slice(0, 300),
            summary: null,
            raw_content: null,
            funder: null,
            country: "FR",
            thematic_areas: [],
            eligible_entities: ["association"],
            eligible_countries: ["FR"],
            min_amount_eur: null,
            max_amount_eur: null,
            co_financing_required: null,
            deadline: null,
            grant_type: "subvention",
            language: "fr",
            status: "active",
            ai_summary: null,
          });
        }
      }

      if (links.size === 0) break; // No more results

      console.log(`  Page ${page}: ${links.size} aids (total: ${allGrants.length})`);
      await new Promise(r => setTimeout(r, 300)); // Be polite
    } catch (e) {
      console.warn(`  Page ${page}: error — ${e.message}`);
      if (page > 5) break;
    }
  }

  // Deduplicate by URL
  const seen = new Set();
  const unique = allGrants.filter(g => {
    if (seen.has(g.source_url)) return false;
    seen.add(g.source_url);
    return true;
  });

  console.log(`[Aides-Territoires] Total unique: ${unique.length}\n`);
  return unique;
}

// ── Seed some curated French grants (manual, high quality) ───────

function getSeedGrants() {
  return [
    {
      source_url: "https://associations.gouv.fr/fonds-pour-le-developpement-de-la-vie-associative-fdva",
      source_name: "FDVA",
      title: "FDVA 1 — Formation des bénévoles",
      summary: "Financement de la formation des bénévoles des associations. Ouvert à toutes les associations loi 1901.",
      raw_content: null,
      funder: "Ministère de l'Éducation nationale — DJEPVA",
      country: "FR",
      thematic_areas: ["Vie associative", "Formation", "Bénévolat"],
      eligible_entities: ["association"],
      eligible_countries: ["FR"],
      min_amount_eur: 500,
      max_amount_eur: 10000,
      co_financing_required: false,
      deadline: null,
      grant_type: "subvention",
      language: "fr",
      status: "active",
      ai_summary: "Subvention pour la formation des bénévoles. Accessible à toute association loi 1901. Montant moyen : 2 000€.",
    },
    {
      source_url: "https://associations.gouv.fr/fdva-2-fonctionnement-innovation",
      source_name: "FDVA",
      title: "FDVA 2 — Fonctionnement et innovation des associations",
      summary: "Soutien au fonctionnement et aux projets innovants des associations de petite taille. Priorité aux associations non financées.",
      raw_content: null,
      funder: "Ministère de l'Éducation nationale — DJEPVA",
      country: "FR",
      thematic_areas: ["Vie associative", "Innovation sociale"],
      eligible_entities: ["association"],
      eligible_countries: ["FR"],
      min_amount_eur: 1000,
      max_amount_eur: 25000,
      co_financing_required: false,
      deadline: null,
      grant_type: "subvention",
      language: "fr",
      status: "active",
      ai_summary: "Subvention de fonctionnement pour les petites associations. Budget moyen : 5 000€. Priorité aux associations jamais subventionnées.",
    },
    {
      source_url: "https://www.fondationdefrance.org/fr/appels-a-projets",
      source_name: "Fondation de France",
      title: "Appels à projets — Fondation de France",
      summary: "La Fondation de France lance régulièrement des appels à projets dans de nombreux domaines : solidarité, environnement, culture, recherche, éducation.",
      raw_content: null,
      funder: "Fondation de France",
      country: "FR",
      thematic_areas: ["Solidarité", "Environnement", "Culture", "Éducation", "Recherche"],
      eligible_entities: ["association", "fondation", "ong"],
      eligible_countries: ["FR"],
      min_amount_eur: 5000,
      max_amount_eur: 100000,
      co_financing_required: false,
      deadline: null,
      grant_type: "appel_a_projets",
      language: "fr",
      status: "active",
      ai_summary: "Principale fondation française. Appels à projets réguliers dans tous les domaines de l'intérêt général.",
    },
    {
      source_url: "https://www.service-civique.gouv.fr/organisme/accueillir-un-volontaire",
      source_name: "Service Civique",
      title: "Agrément Service Civique — Accueil de volontaires",
      summary: "Les associations agréées peuvent accueillir des volontaires en service civique (16-25 ans). L'État prend en charge l'indemnité.",
      raw_content: null,
      funder: "Agence du Service Civique",
      country: "FR",
      thematic_areas: ["Jeunesse", "Engagement", "Solidarité"],
      eligible_entities: ["association"],
      eligible_countries: ["FR"],
      min_amount_eur: null,
      max_amount_eur: null,
      co_financing_required: false,
      deadline: null,
      grant_type: "subvention",
      language: "fr",
      status: "active",
      ai_summary: "Programme d'accueil de volontaires 16-25 ans. Indemnité prise en charge par l'État (environ 580€/mois par volontaire).",
    },
    {
      source_url: "https://www.culture.gouv.fr/Aides-demarches/Appels-a-projets",
      source_name: "Ministère de la Culture",
      title: "Subventions et appels à projets — Ministère de la Culture",
      summary: "Subventions aux associations culturelles : création artistique, patrimoine, éducation artistique, industries culturelles.",
      raw_content: null,
      funder: "Ministère de la Culture",
      country: "FR",
      thematic_areas: ["Culture", "Art", "Patrimoine", "Éducation artistique"],
      eligible_entities: ["association", "fondation"],
      eligible_countries: ["FR"],
      min_amount_eur: 2000,
      max_amount_eur: 200000,
      co_financing_required: false,
      deadline: null,
      grant_type: "subvention",
      language: "fr",
      status: "active",
      ai_summary: "Financements du Ministère de la Culture pour les associations culturelles. Multiples dispositifs disponibles.",
    },
    {
      source_url: "https://www.ecologie.gouv.fr/aides-et-subventions",
      source_name: "Ministère Écologie",
      title: "Subventions transition écologique — associations",
      summary: "Financements pour les associations agissant dans le domaine de la transition écologique, biodiversité, économie circulaire.",
      raw_content: null,
      funder: "Ministère de la Transition Écologique",
      country: "FR",
      thematic_areas: ["Environnement", "Écologie", "Biodiversité", "Économie circulaire"],
      eligible_entities: ["association"],
      eligible_countries: ["FR"],
      min_amount_eur: 5000,
      max_amount_eur: 500000,
      co_financing_required: true,
      deadline: null,
      grant_type: "subvention",
      language: "fr",
      status: "active",
      ai_summary: "Financements publics pour les associations environnementales. Inclut les appels à projets ADEME.",
    },
  ];
}

// ── Upsert to Supabase ──────────────────────────────────────────

async function upsertGrants(grants) {
  let inserted = 0, skipped = 0, errors = 0;
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

      if (res.ok) {
        inserted += chunk.length;
      } else {
        const errText = await res.text();
        if (errText.includes("duplicate") || errText.includes("unique")) {
          skipped += chunk.length;
        } else {
          console.error(`[DB] Batch ${i}: ${errText.slice(0, 200)}`);
          errors += chunk.length;
        }
      }
    } catch (e) {
      console.error(`[DB] Error:`, e.message);
      errors += chunk.length;
    }

    if ((i + chunkSize) % 200 === 0 || i + chunkSize >= grants.length) {
      console.log(`[DB] ${Math.min(i + chunkSize, grants.length)}/${grants.length}`);
    }
  }

  return { inserted, skipped, errors };
}

// ── Main ─────────────────────────────────────────────────────────

async function main() {
  console.log("\n🚀 ═══ EMILE GRANT INGESTION ═══\n");
  const startTime = Date.now();
  let totalInserted = 0, totalFetched = 0;

  // 1. Seed grants (high quality, curated)
  console.log("── Seed grants (curated FR) ──");
  const seeds = getSeedGrants();
  const seedResult = await upsertGrants(seeds);
  console.log(`✅ Seeds: ${seedResult.inserted} inserted\n`);
  totalInserted += seedResult.inserted;
  totalFetched += seeds.length;

  // 2. EU Funding & Tenders (public API)
  console.log("── EU Funding & Tenders ──");
  const euRaw = await fetchEUCalls();
  const euGrants = euRaw.map(transformEU);
  const euResult = await upsertGrants(euGrants);
  console.log(`✅ EU: ${euResult.inserted} inserted, ${euResult.errors} errors\n`);
  totalInserted += euResult.inserted;
  totalFetched += euGrants.length;

  // 3. Aides-Territoires (public HTML scrape)
  console.log("── Aides-Territoires (public scrape) ──");
  const atGrants = await fetchAidesTerritorresPublic();
  const atResult = await upsertGrants(atGrants);
  console.log(`✅ AT: ${atResult.inserted} inserted, ${atResult.errors} errors\n`);
  totalInserted += atResult.inserted;
  totalFetched += atGrants.length;

  // Summary
  const totalTime = Math.round((Date.now() - startTime) / 1000);

  console.log("═══ INGESTION COMPLETE ═══");
  console.log(`📊 Total fetched: ${totalFetched}`);
  console.log(`✅ Total inserted: ${totalInserted}`);
  console.log(`⏱️  Duration: ${totalTime}s`);

  // Verify count
  const countRes = await fetch(`${SUPABASE_URL}/rest/v1/grants?select=id`, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Prefer: "count=exact",
      "Range": "0-0",
    },
  });
  const range = countRes.headers.get("content-range");
  console.log(`📦 Grants in DB: ${range}`);
  console.log("═══════════════════════════\n");
}

main().catch(e => {
  console.error("Fatal:", e);
  process.exit(1);
});
