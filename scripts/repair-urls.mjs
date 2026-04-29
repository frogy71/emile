#!/usr/bin/env node
/**
 * Repair broken source_urls on the live Supabase via the REST API.
 * Runs the same fixes as 0017_target_regions_and_url_fixes.sql can apply on
 * the URL columns; the schema parts of that migration still need to be run
 * with `apply-migration.mjs` once DATABASE_URL is correct.
 *
 * - Aides-Territoires: prepend https://aides-territoires.beta.gouv.fr to
 *   any source_url starting with "/".
 * - data.gouv FRUP / FE: rewrite the fabricated URL to the real dataset
 *   page with a `?fondation=…` disambiguator.
 *
 * Idempotent: safe to re-run; rows already in the new format are skipped.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

const SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

async function selectAll(query) {
  const out = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const r = await fetch(`${SUPABASE}/rest/v1/${query}&offset=${from}&limit=${PAGE}`, { headers });
    if (!r.ok) throw new Error(`select ${r.status}: ${await r.text()}`);
    const rows = await r.json();
    out.push(...rows);
    if (rows.length < PAGE) break;
    from += PAGE;
  }
  return out;
}

async function patch(id, body) {
  const r = await fetch(`${SUPABASE}/rest/v1/grants?id=eq.${id}`, {
    method: "PATCH",
    headers: { ...headers, Prefer: "return=minimal" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const t = await r.text();
    if (t.includes("duplicate") || t.includes("unique") || t.includes("conflict")) {
      // Another grant already owns the target URL — drop this duplicate.
      const del = await fetch(`${SUPABASE}/rest/v1/grants?id=eq.${id}`, {
        method: "DELETE", headers: { ...headers, Prefer: "return=minimal" },
      });
      return del.ok ? "dup-deleted" : "dup-failed";
    }
    return `error ${r.status}: ${t.slice(0, 100)}`;
  }
  return "ok";
}

// 1. Aides-Territoires relative URLs
console.log("→ Aides-Territoires relative URL repair");
const atRows = await selectAll(`grants?select=id,source_url&source_name=eq.Aides-Territoires&source_url=like.%2F%25`);
console.log(`  found ${atRows.length} rows`);
let okAt = 0, dupAt = 0, errAt = 0;
for (const row of atRows) {
  const newUrl = `https://aides-territoires.beta.gouv.fr${row.source_url}`;
  const r = await patch(row.id, { source_url: newUrl });
  if (r === "ok") okAt++;
  else if (r === "dup-deleted") dupAt++;
  else { errAt++; console.log("  fail", row.id, r); }
}
console.log(`  ok=${okAt} dup-deleted=${dupAt} err=${errAt}`);

// 2. data.gouv FRUP fabricated URLs
console.log("→ data.gouv FRUP URL repair");
const frup = await selectAll(`grants?select=id,source_url,title&source_url=like.https%3A%2F%2Fdata.gouv.fr%2Ffrup%2F%25`);
console.log(`  found ${frup.length} rows`);
let okF = 0, dupF = 0, errF = 0;
for (const row of frup) {
  const m = row.source_url.match(/^https:\/\/data\.gouv\.fr\/frup\/(.+)$/);
  if (!m) continue;
  const newUrl = `https://www.data.gouv.fr/fr/datasets/fondations-reconnues-d-utilite-publique/?fondation=${m[1]}`;
  const r = await patch(row.id, { source_url: newUrl });
  if (r === "ok") okF++;
  else if (r === "dup-deleted") dupF++;
  else { errF++; console.log("  fail", row.id, r); }
}
console.log(`  ok=${okF} dup-deleted=${dupF} err=${errF}`);

// 3. data.gouv FE fabricated URLs
console.log("→ data.gouv FE URL repair");
const fe = await selectAll(`grants?select=id,source_url,title&source_url=like.https%3A%2F%2Fdata.gouv.fr%2Ffe%2F%25`);
console.log(`  found ${fe.length} rows`);
let okFE = 0, dupFE = 0, errFE = 0;
for (const row of fe) {
  const m = row.source_url.match(/^https:\/\/data\.gouv\.fr\/fe\/(.+)$/);
  if (!m) continue;
  const newUrl = `https://www.data.gouv.fr/fr/datasets/fondations-d-entreprises/?fondation=${m[1]}`;
  const r = await patch(row.id, { source_url: newUrl });
  if (r === "ok") okFE++;
  else if (r === "dup-deleted") dupFE++;
  else { errFE++; console.log("  fail", row.id, r); }
}
console.log(`  ok=${okFE} dup-deleted=${dupFE} err=${errFE}`);

console.log("\nDone.");
