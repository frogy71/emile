/**
 * Enrich grants with full content from Aides-Territoires
 *
 * For each grant in DB that has no summary/raw_content,
 * scrape the full page to extract:
 * - Description complète
 * - Critères d'éligibilité
 * - Montants
 * - Deadline
 * - Thématiques
 *
 * This is what enables real matching with the logframe.
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function cleanHtml(html) {
  if (!html) return null;
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Scrape a single Aides-Territoires page for full content
 */
async function scrapeAidePage(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Emile-GrantFinder/1.0",
        Accept: "text/html",
      },
    });

    if (!res.ok) return null;
    const html = await res.text();

    // Extract description
    const descMatch = html.match(/<div[^>]*class="[^"]*aid-description[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
      || html.match(/<div[^>]*id="description"[^>]*>([\s\S]*?)<\/div>/i);
    const description = descMatch ? cleanHtml(descMatch[1]) : null;

    // Extract eligibility
    const eligMatch = html.match(/<div[^>]*class="[^"]*aid-eligibility[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
      || html.match(/[Éé]ligibilit[ée][\s\S]*?<\/h[234]>\s*([\s\S]*?)(?:<h[234]|<div class="at-)/i);
    const eligibility = eligMatch ? cleanHtml(eligMatch[1]) : null;

    // Extract deadline from page
    const deadlineMatch = html.match(/(?:date\s*(?:de\s*)?(?:fin|clôture|limite)|deadline)[\s:]*(\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4})/i)
      || html.match(/(\d{1,2}[\/.]\d{1,2}[\/.]\d{4})/);
    let deadline = null;
    if (deadlineMatch) {
      const parts = deadlineMatch[1].split(/[\/\.]/);
      if (parts.length === 3) {
        const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
        deadline = `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }

    // Extract funder names
    const funderMatch = html.match(/<div[^>]*class="[^"]*aid-financers[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    const funder = funderMatch ? cleanHtml(funderMatch[1]) : null;

    // Extract thematic categories from breadcrumbs or tags
    const catMatches = html.matchAll(/<span[^>]*class="[^"]*tag[^"]*"[^>]*>([^<]+)<\/span>/gi);
    const categories = [];
    for (const m of catMatches) {
      const cat = cleanHtml(m[1]);
      if (cat && cat.length > 2 && cat.length < 50) categories.push(cat);
    }

    // Build full text for matching
    const fullText = [description, eligibility].filter(Boolean).join("\n\n");

    return {
      summary: (description || "").slice(0, 500) || null,
      raw_content: fullText.slice(0, 5000) || null,
      funder: funder,
      deadline: deadline,
      thematic_areas: categories.length > 0 ? categories.slice(0, 10) : null,
    };
  } catch (e) {
    return null;
  }
}

async function main() {
  console.log("\n🔍 ═══ ENRICHING GRANTS ═══\n");

  // Fetch grants that need enrichment (no summary)
  const { data: grants, error } = await (
    await fetch(`${SUPABASE_URL}/rest/v1/grants?summary=is.null&source_name=eq.Aides-Territoires&select=id,source_url,title&limit=200`, {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
    })
  ).json();

  if (!grants || grants.length === 0) {
    console.log("No grants to enrich.");
    return;
  }

  console.log(`Found ${grants.length} grants to enrich\n`);

  let enriched = 0, failed = 0;

  for (let i = 0; i < grants.length; i++) {
    const grant = grants[i];
    const data = await scrapeAidePage(grant.source_url);

    if (data && (data.summary || data.raw_content)) {
      // Update in Supabase
      const updateFields = {};
      if (data.summary) updateFields.summary = data.summary;
      if (data.raw_content) updateFields.raw_content = data.raw_content;
      if (data.funder) updateFields.funder = data.funder;
      if (data.deadline) updateFields.deadline = data.deadline;
      if (data.thematic_areas) updateFields.thematic_areas = data.thematic_areas;

      const res = await fetch(`${SUPABASE_URL}/rest/v1/grants?id=eq.${grant.id}`, {
        method: "PATCH",
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(updateFields),
      });

      if (res.ok) {
        enriched++;
      } else {
        failed++;
      }
    } else {
      failed++;
    }

    if ((i + 1) % 10 === 0 || i === grants.length - 1) {
      console.log(`Progress: ${i + 1}/${grants.length} (${enriched} enriched, ${failed} failed)`);
    }

    // Rate limit
    await new Promise(r => setTimeout(r, 400));
  }

  console.log(`\n✅ Enrichment complete: ${enriched} enriched, ${failed} failed`);
}

main().catch(e => { console.error("Fatal:", e); process.exit(1); });
