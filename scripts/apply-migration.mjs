#!/usr/bin/env node
/**
 * Apply a SQL migration file to Supabase (direct Postgres connection).
 *
 * Usage:
 *   node scripts/apply-migration.mjs supabase/migrations/0001_ingestion_logs.sql
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/apply-migration.mjs <path-to-sql>");
  process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL missing in env");
  process.exit(1);
}

const abs = path.resolve(file);
const sql = fs.readFileSync(abs, "utf8");

// Split on the Drizzle-style breakpoint comment
const statements = sql
  .split(/--\s*>\s*statement-breakpoint/g)
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

const client = postgres(url, { prepare: false, max: 1 });

try {
  console.log(`Applying ${statements.length} statements from ${abs}`);
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const first = stmt.split(/\r?\n/).find((l) => l.trim()) ?? "";
    console.log(`\n[${i + 1}/${statements.length}] ${first.slice(0, 90)}`);
    await client.unsafe(stmt);
  }
  console.log("\n✅ Migration applied successfully");
} catch (e) {
  console.error("\n❌ Migration failed:", e.message);
  process.exit(1);
} finally {
  await client.end();
}
