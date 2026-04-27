/**
 * Backfill embeddings for every grant + project that doesn't have one yet.
 *
 * Reads grants/projects in pages of 200, batches them through the embedding
 * provider in groups of 64, and writes the resulting vectors back via the
 * Supabase REST API. Idempotent: only touches rows where embedding IS NULL
 * (use --force to re-embed everything).
 *
 * Usage:
 *   npx tsx scripts/backfill-embeddings.ts                  # grants + projects
 *   npx tsx scripts/backfill-embeddings.ts --grants-only
 *   npx tsx scripts/backfill-embeddings.ts --projects-only
 *   npx tsx scripts/backfill-embeddings.ts --force           # re-embed all
 *   npx tsx scripts/backfill-embeddings.ts --limit 500       # cap for dry-run
 *
 * Env required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *               and one of VOYAGE_API_KEY / OPENAI_API_KEY.
 */

import dotenv from "dotenv";
import path from "path";
import fs from "fs";

const candidates = [
  path.resolve(process.cwd(), ".env.local"),
  "/tmp/.env.prod",
];
for (const p of candidates) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p, override: true });
  }
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

import {
  buildGrantEmbeddingText,
  buildProjectEmbeddingText,
  embeddingProviderName,
  generateEmbeddingsBatch,
  isEmbeddingsAvailable,
  toPgVector,
} from "../src/lib/ai/embeddings";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const PAGE_SIZE = 200;
const BATCH_SIZE = 64;

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const GRANTS_ONLY = args.includes("--grants-only");
const PROJECTS_ONLY = args.includes("--projects-only");
const limitFlag = args.indexOf("--limit");
const LIMIT = limitFlag >= 0 ? parseInt(args[limitFlag + 1], 10) : Infinity;

if (!isEmbeddingsAvailable()) {
  console.error(
    "No embedding provider configured. Set VOYAGE_API_KEY or OPENAI_API_KEY."
  );
  process.exit(1);
}

console.log(`[backfill] provider=${embeddingProviderName()}`);
console.log(
  `[backfill] mode: ${
    FORCE ? "force re-embed" : "missing only"
  }${GRANTS_ONLY ? " (grants only)" : ""}${PROJECTS_ONLY ? " (projects only)" : ""}${
    limitFlag >= 0 ? ` limit=${LIMIT}` : ""
  }`
);

// ─── REST helpers ──────────────────────────────────────────────

async function restGet<T>(path: string): Promise<T[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  if (!res.ok) {
    throw new Error(`GET ${path} failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as T[];
}

async function restPatch(
  path: string,
  body: Record<string, unknown>
): Promise<boolean> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: "PATCH",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(body),
  });
  return res.ok;
}

// ─── Backfill: grants ──────────────────────────────────────────

interface GrantRow {
  id: string;
  title: string | null;
  summary: string | null;
  funder: string | null;
  thematic_areas: string[] | null;
  eligible_entities: string[] | null;
  eligible_countries: string[] | null;
  grant_type: string | null;
}

async function backfillGrants(): Promise<{
  total: number;
  embedded: number;
  errors: number;
}> {
  console.log("\n=== Grants ===");

  const filter = FORCE ? "" : "&embedding=is.null";
  const select =
    "id,title,summary,funder,thematic_areas,eligible_entities,eligible_countries,grant_type";

  // Get the count first so we can print progress.
  const countRes = await fetch(
    `${SUPABASE_URL}/rest/v1/grants?select=id${filter}`,
    {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Prefer: "count=exact",
        Range: "0-0",
      },
    }
  );
  const contentRange = countRes.headers.get("content-range");
  const total = contentRange ? parseInt(contentRange.split("/")[1], 10) : 0;
  console.log(`[backfill] grants needing embedding: ${total}`);

  let processed = 0;
  let embedded = 0;
  let errors = 0;
  let offset = 0;

  while (processed < Math.min(total, LIMIT)) {
    const remaining = Math.min(total, LIMIT) - processed;
    const pageSize = Math.min(PAGE_SIZE, remaining);

    let rows: GrantRow[];
    try {
      rows = await restGet<GrantRow>(
        `grants?select=${select}${filter}&order=created_at.desc&offset=${offset}&limit=${pageSize}`
      );
    } catch (e) {
      console.error("[backfill] page fetch failed:", e);
      errors += pageSize;
      break;
    }
    if (rows.length === 0) break;

    // When we update embedding=null rows, the next page query naturally
    // shifts since the filter changes — keep offset at 0 and just refetch
    // to avoid skipping rows. Only when --force is set do we paginate.
    if (!FORCE) {
      offset = 0;
    } else {
      offset += rows.length;
    }

    // Embed in batches.
    for (let b = 0; b < rows.length; b += BATCH_SIZE) {
      const batch = rows.slice(b, b + BATCH_SIZE);
      const texts = batch.map((r) => buildGrantEmbeddingText(r));
      let vecs: (number[] | null)[];
      try {
        vecs = await generateEmbeddingsBatch(texts, { kind: "grant" });
      } catch (e) {
        console.error("[backfill] embed batch failed:", e);
        errors += batch.length;
        continue;
      }

      // Write back, in parallel.
      const now = new Date().toISOString();
      const writes = batch.map(async (r, i) => {
        const v = vecs[i];
        if (!v) {
          errors += 1;
          return;
        }
        const ok = await restPatch(`grants?id=eq.${r.id}`, {
          embedding: toPgVector(v),
          embedding_updated_at: now,
        });
        if (ok) embedded += 1;
        else errors += 1;
      });
      await Promise.all(writes);
    }

    processed += rows.length;
    console.log(
      `[backfill] grants ${processed}/${Math.min(total, LIMIT)} (embedded=${embedded}, errors=${errors})`
    );
  }

  return { total, embedded, errors };
}

// ─── Backfill: projects ───────────────────────────────────────

interface ProjectRow {
  id: string;
  organization_id: string;
  name: string;
  summary: string | null;
  objectives: string[] | null;
  target_beneficiaries: string[] | null;
  target_geography: string[] | null;
}

interface OrgRow {
  id: string;
  name: string;
  mission: string | null;
  thematic_areas: string[] | null;
  beneficiaries: string[] | null;
  geographic_focus: string[] | null;
}

async function backfillProjects(): Promise<{
  total: number;
  embedded: number;
  errors: number;
}> {
  console.log("\n=== Projects ===");

  const filter = FORCE ? "" : "&embedding=is.null";

  // Count
  const countRes = await fetch(
    `${SUPABASE_URL}/rest/v1/projects?select=id${filter}`,
    {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Prefer: "count=exact",
        Range: "0-0",
      },
    }
  );
  const contentRange = countRes.headers.get("content-range");
  const total = contentRange ? parseInt(contentRange.split("/")[1], 10) : 0;
  console.log(`[backfill] projects needing embedding: ${total}`);

  let processed = 0;
  let embedded = 0;
  let errors = 0;
  let offset = 0;

  while (processed < Math.min(total, LIMIT)) {
    const remaining = Math.min(total, LIMIT) - processed;
    const pageSize = Math.min(PAGE_SIZE, remaining);

    let rows: ProjectRow[];
    try {
      rows = await restGet<ProjectRow>(
        `projects?select=id,organization_id,name,summary,objectives,target_beneficiaries,target_geography${filter}&offset=${offset}&limit=${pageSize}`
      );
    } catch (e) {
      console.error("[backfill] page fetch failed:", e);
      errors += pageSize;
      break;
    }
    if (rows.length === 0) break;
    if (!FORCE) offset = 0;
    else offset += rows.length;

    // Pre-fetch org rows for this page.
    const orgIds = Array.from(new Set(rows.map((r) => r.organization_id)));
    const orgInList = orgIds.map((id) => `"${id}"`).join(",");
    let orgs: OrgRow[] = [];
    try {
      orgs = await restGet<OrgRow>(
        `organizations?select=id,name,mission,thematic_areas,beneficiaries,geographic_focus&id=in.(${encodeURIComponent(
          orgInList
        )})`
      );
    } catch (e) {
      console.warn("[backfill] org fetch failed:", e);
    }
    const orgById = new Map(orgs.map((o) => [o.id, o]));

    // Build texts + embed.
    for (let b = 0; b < rows.length; b += BATCH_SIZE) {
      const batch = rows.slice(b, b + BATCH_SIZE);
      const texts = batch.map((r) => {
        const org = orgById.get(r.organization_id);
        return buildProjectEmbeddingText(
          {
            name: r.name,
            summary: r.summary,
            objectives: r.objectives,
            target_beneficiaries: r.target_beneficiaries,
            target_geography: r.target_geography,
          },
          org
            ? {
                name: org.name,
                mission: org.mission,
                thematic_areas: org.thematic_areas,
                beneficiaries: org.beneficiaries,
                geographic_focus: org.geographic_focus,
              }
            : undefined
        );
      });

      let vecs: (number[] | null)[];
      try {
        vecs = await generateEmbeddingsBatch(texts, { kind: "project" });
      } catch (e) {
        console.error("[backfill] embed batch failed:", e);
        errors += batch.length;
        continue;
      }

      const now = new Date().toISOString();
      const writes = batch.map(async (r, i) => {
        const v = vecs[i];
        if (!v) {
          errors += 1;
          return;
        }
        const ok = await restPatch(`projects?id=eq.${r.id}`, {
          embedding: toPgVector(v),
          embedding_updated_at: now,
        });
        if (ok) embedded += 1;
        else errors += 1;
      });
      await Promise.all(writes);
    }

    processed += rows.length;
    console.log(
      `[backfill] projects ${processed}/${Math.min(total, LIMIT)} (embedded=${embedded}, errors=${errors})`
    );
  }

  return { total, embedded, errors };
}

// ─── Main ─────────────────────────────────────────────────────

async function main() {
  const start = Date.now();
  let g = { total: 0, embedded: 0, errors: 0 };
  let p = { total: 0, embedded: 0, errors: 0 };

  if (!PROJECTS_ONLY) g = await backfillGrants();
  if (!GRANTS_ONLY) p = await backfillProjects();

  console.log("\n=== Summary ===");
  console.log(
    `Grants:   total=${g.total} embedded=${g.embedded} errors=${g.errors}`
  );
  console.log(
    `Projects: total=${p.total} embedded=${p.embedded} errors=${p.errors}`
  );
  console.log(`Duration: ${Math.round((Date.now() - start) / 1000)}s`);
}

main().catch((e) => {
  console.error("[backfill] Fatal:", e);
  process.exit(1);
});
