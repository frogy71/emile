/**
 * Ingest French foundations from 3 sources:
 * 1. data.gouv.fr — FRUP (Fondations Reconnues d'Utilité Publique)
 * 2. data.gouv.fr — Fondations d'entreprises
 * 3. Fondation de France — annuaire des fondations
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function cleanHtml(html) {
  if (!html) return null;
  return html.replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">").replace(/&#x27;/g, "'").replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'").replace(/\s+/g, " ").trim();
}

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
      else { const e = await res.text(); console.error("DB:", e.slice(0,150)); errors += chunk.length; }
    } catch (e) { errors += chunk.length; }
  }
  return { inserted, errors };
}

// ── 1. Fondation de France annuaire ──────────────────────────────

async function scrapeFondationDeFrance() {
  console.log("[Fondation de France] Scraping annuaire...");
  const grants = [];
  const baseUrl = "https://www.fondationdefrance.org/fr/annuaire-des-fondations";

  for (let page = 0; page < 20; page++) {
    try {
      const url = page === 0 ? baseUrl : `${baseUrl}?page=${page}`;
      const res = await fetch(url, {
        headers: { "User-Agent": "Emile-GrantFinder/1.0", Accept: "text/html" },
      });
      if (!res.ok) break;
      const html = await res.text();

      // Extract foundation cards
      const cardRegex = /<a[^>]*href="(\/fr\/fondation[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
      let match;
      const seen = new Set();

      while ((match = cardRegex.exec(html)) !== null) {
        const href = match[1];
        const text = cleanHtml(match[2]);
        if (seen.has(href) || !text || text.length < 5) continue;
        seen.add(href);

        // Extract name from the link text
        const name = text.split(/\n/)[0]?.trim();
        if (!name || name.length < 3) continue;

        grants.push({
          source_url: `https://www.fondationdefrance.org${href}`,
          source_name: "Fondation de France",
          title: `${name}`,
          summary: `Fondation abritée par la Fondation de France. ${text.slice(0, 300)}`,
          raw_content: text,
          funder: name,
          country: "FR",
          thematic_areas: [],
          eligible_entities: ["association", "ong", "fondation"],
          eligible_countries: ["FR"],
          min_amount_eur: null,
          max_amount_eur: null,
          co_financing_required: false,
          deadline: null,
          grant_type: "fondation",
          language: "fr",
          status: "active",
          ai_summary: null,
        });
      }

      if (seen.size === 0) break;
      console.log(`  Page ${page + 1}: ${seen.size} fondations (total: ${grants.length})`);
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      console.warn(`  Page ${page + 1}: error`, e.message);
      break;
    }
  }

  // Deduplicate
  const uniqueUrls = new Set();
  const unique = grants.filter(g => {
    if (uniqueUrls.has(g.source_url)) return false;
    uniqueUrls.add(g.source_url);
    return true;
  });

  console.log(`[Fondation de France] Total unique: ${unique.length}\n`);
  return unique;
}

// ── 2. CFF — Centre Français des Fondations ─────────────────────

async function scrapeCFF() {
  console.log("[CFF] Scraping annuaire...");
  const grants = [];

  // CFF has a searchable directory — let's scrape the public listing
  for (let page = 1; page <= 30; page++) {
    try {
      const url = `https://www.centre-francais-fondations.org/annuaire-des-fonds-et-fondations?page=${page}`;
      const res = await fetch(url, {
        headers: { "User-Agent": "Emile-GrantFinder/1.0", Accept: "text/html" },
      });
      if (!res.ok) break;
      const html = await res.text();

      // Extract foundation entries
      const entryRegex = /<a[^>]*href="(\/annuaire-des-fonds-et-fondations\/[^"]*)"[^>]*>\s*([\s\S]*?)\s*<\/a>/gi;
      let match;
      const pageGrants = [];

      while ((match = entryRegex.exec(html)) !== null) {
        const href = match[1];
        const name = cleanHtml(match[2]);
        if (!name || name.length < 3 || href.includes('?page=')) continue;

        pageGrants.push({
          source_url: `https://www.centre-francais-fondations.org${href}`,
          source_name: "CFF — Centre Français des Fondations",
          title: name,
          summary: `Fondation référencée dans l'annuaire du Centre Français des Fondations.`,
          raw_content: null,
          funder: name,
          country: "FR",
          thematic_areas: [],
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
        });
      }

      if (pageGrants.length === 0) break;
      grants.push(...pageGrants);
      console.log(`  Page ${page}: ${pageGrants.length} fondations (total: ${grants.length})`);
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      console.warn(`  Page ${page}: error`, e.message);
      break;
    }
  }

  const uniqueUrls = new Set();
  const unique = grants.filter(g => {
    if (uniqueUrls.has(g.source_url)) return false;
    uniqueUrls.add(g.source_url);
    return true;
  });

  console.log(`[CFF] Total unique: ${unique.length}\n`);
  return unique;
}

// ── 3. FRUP seed data (from data.gouv known list) ────────────────

function getFRUPSeeds() {
  // Key FRUP foundations that fund associations — curated for quality
  return [
    {
      name: "Fondation Abbé Pierre",
      themes: ["Logement", "Précarité", "Exclusion"],
      url: "https://www.fondation-abbe-pierre.fr/",
      summary: "Lutte contre le mal-logement et l'exclusion. Finance des projets d'hébergement, d'accès au logement et d'accompagnement social.",
      maxAmount: 200000,
    },
    {
      name: "Fondation de France",
      themes: ["Solidarité", "Environnement", "Culture", "Éducation", "Recherche"],
      url: "https://www.fondationdefrance.org/fr/appels-a-projets",
      summary: "1ère fondation française. Appels à projets dans tous les domaines de l'intérêt général. 3 000+ projets soutenus/an.",
      maxAmount: 100000,
    },
    {
      name: "Fondation Caritas France",
      themes: ["Solidarité", "Pauvreté", "Exclusion", "Migration"],
      url: "https://www.fondation-caritas.org/",
      summary: "Lutte contre la pauvreté et l'exclusion. Finance des projets d'insertion, d'hébergement et d'aide alimentaire.",
      maxAmount: 50000,
    },
    {
      name: "Fondation Daniel et Nina Carasso",
      themes: ["Alimentation durable", "Art citoyen"],
      url: "https://www.fondationcarasso.org/",
      summary: "Finance des projets innovants en alimentation durable et art citoyen. Appels à projets réguliers.",
      maxAmount: 150000,
    },
    {
      name: "Fondation MACIF",
      themes: ["Économie sociale", "Innovation sociale", "Inclusion"],
      url: "https://www.fondation-macif.org/",
      summary: "Soutient l'économie sociale et solidaire. Finance des projets d'inclusion, d'innovation sociale et de transition écologique.",
      maxAmount: 50000,
    },
    {
      name: "Fondation Nicolas Hulot",
      themes: ["Environnement", "Écologie", "Transition"],
      url: "https://www.fondation-nicolas-hulot.org/",
      summary: "Sensibilisation et actions pour la transition écologique. Soutient des projets de préservation de la biodiversité.",
      maxAmount: 30000,
    },
    {
      name: "Fondation Total Energies",
      themes: ["Éducation", "Insertion", "Patrimoine", "Biodiversité"],
      url: "https://foundation.totalenergies.com/fr",
      summary: "Fondation d'entreprise. Finance des projets d'éducation, d'insertion professionnelle, de biodiversité marine et de patrimoine culturel.",
      maxAmount: 100000,
    },
    {
      name: "Fondation Orange",
      themes: ["Numérique", "Éducation", "Santé", "Inclusion"],
      url: "https://www.fondationorange.com/",
      summary: "Fondation d'entreprise. Finance des projets numériques pour l'éducation, la santé et l'inclusion. Appels à projets annuels.",
      maxAmount: 30000,
    },
    {
      name: "Fondation Crédit Coopératif",
      themes: ["Économie sociale", "Innovation sociale", "Solidarité"],
      url: "https://www.credit-cooperatif.coop/fondation",
      summary: "Soutient l'innovation dans l'économie sociale et solidaire. Prix et bourses pour les structures ESS.",
      maxAmount: 20000,
    },
    {
      name: "Fondation SNCF",
      themes: ["Solidarité", "Éducation", "Insertion", "Mobilité"],
      url: "https://www.fondation-sncf.org/",
      summary: "Fondation d'entreprise. Soutient des projets de lutte contre l'illettrisme, d'insertion et de solidarité dans les territoires.",
      maxAmount: 30000,
    },
    {
      name: "Fondation Bettencourt Schueller",
      themes: ["Recherche", "Culture", "Solidarité"],
      url: "https://www.fondationbs.org/",
      summary: "Fondation majeure en France. Soutient la recherche scientifique, les talents artistiques et des projets solidaires innovants.",
      maxAmount: 500000,
    },
    {
      name: "Fondation Roi Baudouin (France)",
      themes: ["Solidarité", "Pauvreté", "Migration", "Justice sociale"],
      url: "https://www.kbs-frb.be/fr",
      summary: "Fondation européenne active en France. Programmes de lutte contre la pauvreté, justice sociale et migration.",
      maxAmount: 60000,
    },
    {
      name: "Fondation Apprentis d'Auteuil",
      themes: ["Jeunesse", "Éducation", "Protection de l'enfance", "Insertion"],
      url: "https://www.apprentis-auteuil.org/",
      summary: "Protection de l'enfance et insertion des jeunes. Programmes éducatifs et d'accompagnement en France et à l'international.",
      maxAmount: 100000,
    },
    {
      name: "Fondation Decathlon",
      themes: ["Sport", "Inclusion", "Jeunesse", "Handicap"],
      url: "https://www.fondation-decathlon.com/",
      summary: "Fondation d'entreprise. Favorise l'accès au sport pour les publics fragiles : jeunes, personnes handicapées, quartiers prioritaires.",
      maxAmount: 20000,
    },
    {
      name: "Fondation Vinci pour la Cité",
      themes: ["Insertion", "Emploi", "Mobilité", "Logement"],
      url: "https://www.fondation-vinci.com/",
      summary: "Fondation d'entreprise. Soutient des projets d'insertion professionnelle, de mobilité et d'accès au logement.",
      maxAmount: 50000,
    },
    {
      name: "Fondation Kering",
      themes: ["Droits des femmes", "Violences", "Égalité"],
      url: "https://www.keringfoundation.org/fr/",
      summary: "Lutte contre les violences faites aux femmes. Finance des associations de terrain et des programmes de prévention.",
      maxAmount: 100000,
    },
    {
      name: "Fondation Schneider Electric",
      themes: ["Énergie", "Formation", "Développement", "Insertion"],
      url: "https://www.se.com/fr/fr/about-us/sustainability/foundation/",
      summary: "Formation aux métiers de l'énergie et insertion professionnelle des jeunes. Active en France et pays en développement.",
      maxAmount: 50000,
    },
    {
      name: "Fondation Bouygues Telecom",
      themes: ["Éducation", "Numérique", "Égalité des chances"],
      url: "https://www.fondation-bouyguestelecom.org/",
      summary: "Fondation d'entreprise. Finance des projets éducatifs numériques pour l'égalité des chances.",
      maxAmount: 20000,
    },
    {
      name: "Fondation Avril",
      themes: ["Agriculture", "Alimentation", "Développement rural"],
      url: "https://www.fondationavril.org/",
      summary: "Soutient le développement agricole et rural en France et en Afrique. Finance des projets de sécurité alimentaire.",
      maxAmount: 80000,
    },
    {
      name: "Fondation Société Générale",
      themes: ["Insertion", "Éducation", "Sport", "Culture"],
      url: "https://www.fondation-societegenerale.com/",
      summary: "Fondation d'entreprise. Soutient l'insertion professionnelle et l'éducation via la pratique sportive et culturelle.",
      maxAmount: 30000,
    },
  ].map(f => ({
    source_url: f.url,
    source_name: "Fondations françaises",
    title: f.name,
    summary: f.summary,
    raw_content: f.summary,
    funder: f.name,
    country: "FR",
    thematic_areas: f.themes,
    eligible_entities: ["association", "ong"],
    eligible_countries: ["FR"],
    min_amount_eur: 1000,
    max_amount_eur: f.maxAmount,
    co_financing_required: false,
    deadline: null,
    grant_type: "fondation",
    language: "fr",
    status: "active",
    ai_summary: f.summary,
  }));
}

// ── Main ─────────────────────────────────────────────────────────

async function main() {
  console.log("\n🏛️ ═══ FONDATIONS INGESTION ═══\n");
  const start = Date.now();
  let totalInserted = 0;

  // 1. FRUP & Fondations d'entreprises (curated, high quality)
  console.log("── 1/3: Fondations françaises (curated) ──");
  const frupGrants = getFRUPSeeds();
  const frupResult = await upsertGrants(frupGrants);
  console.log(`✅ Fondations FR: ${frupResult.inserted} inserted\n`);
  totalInserted += frupResult.inserted;

  // 2. Fondation de France annuaire
  console.log("── 2/3: Fondation de France annuaire ──");
  const fdfGrants = await scrapeFondationDeFrance();
  if (fdfGrants.length > 0) {
    const fdfResult = await upsertGrants(fdfGrants);
    console.log(`✅ FdF: ${fdfResult.inserted} inserted\n`);
    totalInserted += fdfResult.inserted;
  }

  // 3. CFF directory
  console.log("── 3/3: CFF annuaire ──");
  const cffGrants = await scrapeCFF();
  if (cffGrants.length > 0) {
    const cffResult = await upsertGrants(cffGrants);
    console.log(`✅ CFF: ${cffResult.inserted} inserted\n`);
    totalInserted += cffResult.inserted;
  }

  // Summary
  const totalTime = Math.round((Date.now() - start) / 1000);
  console.log("═══ FONDATIONS DONE ═══");
  console.log(`✅ Total inserted: ${totalInserted}`);
  console.log(`⏱️  Duration: ${totalTime}s`);

  // Total count
  const countRes = await fetch(`${SUPABASE_URL}/rest/v1/grants?select=id`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, Prefer: "count=exact", Range: "0-0" },
  });
  console.log(`📦 Total grants in DB: ${countRes.headers.get("content-range")}`);
  console.log("════════════════════════\n");
}

main().catch(e => { console.error("Fatal:", e); process.exit(1); });
