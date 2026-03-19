/**
 * Full Aides-Territoires ingestion with API token
 * Fetches ALL aids with rich data (descriptions, eligibility, amounts, deadlines)
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const AT_TOKEN = process.env.AIDES_TERRITOIRES_API_TOKEN;

function cleanHtml(html) {
  if (!html) return null;
  return html.replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">").replace(/&#x27;/g, "'").replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'").replace(/\s+/g, " ").trim();
}

// Step 1: Get JWT from X-AUTH-TOKEN
async function getJWT() {
  console.log("[AT] Getting JWT...");
  const res = await fetch("https://aides-territoires.beta.gouv.fr/api/aids/?page_size=1", {
    headers: { "X-AUTH-TOKEN": AT_TOKEN },
  });
  const data = await res.json();
  if (data.token) {
    console.log("[AT] JWT obtained ✅");
    return data.token;
  }
  throw new Error("Failed to get JWT: " + JSON.stringify(data));
}

// Step 2: Fetch all aids with JWT
async function fetchAllAids(jwt) {
  const allAids = [];
  let url = "https://aides-territoires.beta.gouv.fr/api/aids/?targeted_audiences=association&is_live=true&page_size=50";

  console.log("[AT] Fetching all aids for associations...");

  while (url) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${jwt}` },
    });

    if (!res.ok) {
      // JWT might have expired, get a new one
      if (res.status === 401) {
        console.log("[AT] JWT expired, refreshing...");
        const newJwt = await getJWT();
        const retryRes = await fetch(url, {
          headers: { Authorization: `Bearer ${newJwt}` },
        });
        if (!retryRes.ok) throw new Error(`API error after refresh: ${retryRes.status}`);
        const retryData = await retryRes.json();
        allAids.push(...retryData.results);
        url = retryData.next;
        continue;
      }
      throw new Error(`API error: ${res.status}`);
    }

    const data = await res.json();
    allAids.push(...data.results);
    url = data.next;

    console.log(`[AT] ${allAids.length}/${data.count} aids...`);
    if (url) await new Promise(r => setTimeout(r, 150));
  }

  console.log(`[AT] Done: ${allAids.length} aids fetched ✅\n`);
  return allAids;
}

// Step 3: Transform to grant format (RICH DATA)
function transform(raw) {
  const isEU = raw.programs?.some(p => /europ|erasmus|cerv|horizon|life|esf|feder/i.test(p)) ||
    raw.financers?.some(f => /europ|commission/i.test(f.name));

  const description = cleanHtml(raw.description);
  const eligibility = cleanHtml(raw.eligibility);
  const fullText = [description, eligibility].filter(Boolean).join("\n\n");

  // Extract thematic categories
  const themes = (raw.categories || []).map(c => typeof c === 'string' ? c : c.name).filter(Boolean).slice(0, 10);

  // Extract funder
  const funders = (raw.financers || []).map(f => typeof f === 'string' ? f : f.name).filter(Boolean);

  return {
    source_url: raw.origin_url || raw.application_url || `https://aides-territoires.beta.gouv.fr/aides/${raw.slug || raw.id}/`,
    source_name: "Aides-Territoires",
    title: (raw.name || raw.short_title || "Sans titre").slice(0, 300),
    summary: description?.slice(0, 500) || null,
    raw_content: fullText?.slice(0, 10000) || null,
    funder: funders.join(", ") || null,
    country: isEU ? "EU" : "FR",
    thematic_areas: themes.length > 0 ? themes : null,
    eligible_entities: raw.targeted_audiences || ["association"],
    eligible_countries: ["FR"],
    min_amount_eur: null,
    max_amount_eur: raw.loan_amount || raw.recoverable_advance_amount || null,
    co_financing_required: raw.subvention_rate_upper_bound != null && raw.subvention_rate_upper_bound < 100,
    deadline: raw.submission_deadline || null,
    grant_type: raw.is_call_for_project ? "appel_a_projets" : "subvention",
    language: "fr",
    status: "active",
    ai_summary: null,
  };
}

// Step 4: Upsert to Supabase (replace old low-quality data)
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
      else {
        const err = await res.text();
        if (!err.includes("duplicate")) {
          console.error(`[DB] Batch ${i}:`, err.slice(0, 100));
        }
        errors += chunk.length;
      }
    } catch (e) { errors += chunk.length; }

    if ((i + chunkSize) % 500 === 0 || i + chunkSize >= grants.length) {
      console.log(`[DB] ${Math.min(i + chunkSize, grants.length)}/${grants.length} (${inserted} ok)`);
    }
  }
  return { inserted, errors };
}

// Main
async function main() {
  console.log("\n🚀 ═══ FULL AIDES-TERRITOIRES INGESTION ═══\n");
  const start = Date.now();

  // Get JWT
  const jwt = await getJWT();

  // Fetch all aids
  const aids = await fetchAllAids(jwt);

  // Transform
  const grants = aids.map(transform);
  console.log(`Transformed ${grants.length} grants with RICH data`);
  console.log(`  - With summary: ${grants.filter(g => g.summary).length}`);
  console.log(`  - With deadline: ${grants.filter(g => g.deadline).length}`);
  console.log(`  - With funder: ${grants.filter(g => g.funder).length}`);
  console.log(`  - With themes: ${grants.filter(g => g.thematic_areas?.length > 0).length}`);
  console.log();

  // Upsert (will update existing low-quality entries)
  const result = await upsertGrants(grants);
  console.log(`\n✅ Result: ${result.inserted} inserted/updated, ${result.errors} errors`);

  // Total count
  const countRes = await fetch(`${SUPABASE_URL}/rest/v1/grants?select=id`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, Prefer: "count=exact", Range: "0-0" },
  });
  const totalTime = Math.round((Date.now() - start) / 1000);
  console.log(`\n═══ DONE in ${totalTime}s ═══`);
  console.log(`📦 Total grants in DB: ${countRes.headers.get("content-range")}`);
}

main().catch(e => { console.error("Fatal:", e); process.exit(1); });
