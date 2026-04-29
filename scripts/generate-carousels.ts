/**
 * CLI entrypoint for the "Grant of the Day" carousel maker.
 *
 * Default mode (`publish`) uploads slide PNGs to the `carousels` Supabase
 * Storage bucket and writes a row in `carousel_publications` so Botato can
 * read them back via GET /api/carousels/latest.
 *
 * Fallback mode (`dropbox`) writes the PNGs + caption.txt to a local folder
 * (~/Dropbox/Emile/Carousels by default) for manual publishing.
 *
 * In both modes the chosen grants are stamped with `carousel_published_at`
 * so they don't get re-picked tomorrow (unless --dry-run is set).
 *
 * Usage:
 *   pnpm exec tsx scripts/generate-carousels.ts                  # publish to Supabase
 *   pnpm exec tsx scripts/generate-carousels.ts --mode dropbox   # local fallback
 *   pnpm exec tsx scripts/generate-carousels.ts --output ~/Dropbox/Emile/Carousels --mode dropbox
 *   pnpm exec tsx scripts/generate-carousels.ts --count 3 --dry-run
 *
 * Flags:
 *   --mode <publish|dropbox>   Default `publish`.
 *   --output <path>            Output root for `dropbox` mode.
 *   --count <n>                Number of carousels to generate (default 2).
 *   --dry-run                  Render but DON'T persist anything (no Storage
 *                              upload, no DB row, no carousel_published_at).
 *
 * Requires .env.local with:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - NEXT_PUBLIC_APP_URL (optional — defaults to the prod URL)
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

if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY
) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env."
  );
  process.exit(1);
}

import { createClient } from "@supabase/supabase-js";
import {
  generateAndSaveCarousels,
  generateAndPublishCarousels,
  generateCarouselsInMemory,
} from "../src/lib/carousel/generator";

type Mode = "publish" | "dropbox";

function parseArgs(argv: string[]) {
  const out: {
    output?: string;
    count?: number;
    dryRun?: boolean;
    mode?: Mode;
  } = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--output" || a === "-o") {
      out.output = argv[++i];
    } else if (a === "--count" || a === "-n") {
      out.count = parseInt(argv[++i], 10);
    } else if (a === "--dry-run") {
      out.dryRun = true;
    } else if (a === "--mode" || a === "-m") {
      const m = argv[++i];
      if (m !== "publish" && m !== "dropbox") {
        console.error(`Unknown mode: ${m}. Use "publish" or "dropbox".`);
        process.exit(1);
      }
      out.mode = m;
    }
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const mode: Mode = args.mode ?? "publish";
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  console.log(
    `[carousel] starting (mode=${mode}${args.dryRun ? ", dry-run" : ""})`
  );
  const start = Date.now();

  if (args.dryRun) {
    const carousels = await generateCarouselsInMemory(supabase, {
      count: args.count ?? 2,
      markPublished: false,
    });
    console.log(`[carousel] dry-run: ${carousels.length} carousel(s) rendered.`);
    for (const c of carousels) {
      console.log(
        `  • ${c.grantTitle} (${c.funder ?? "?"}) — ${c.slidesPng.length} slides, accent ${c.accent}`
      );
    }
  } else if (mode === "publish") {
    const result = await generateAndPublishCarousels(supabase, {
      count: args.count ?? 2,
      markPublished: true,
    });
    if (result.length === 0) {
      console.warn(
        "[carousel] no grants available — base empty or all published."
      );
      process.exit(0);
    }
    console.log(
      `[carousel] published ${result.length} carousel(s) to Supabase (${result[0].date}).`
    );
    for (const c of result) {
      console.log(`  • #${c.carouselIndex + 1} ${c.grantTitle}`);
      for (const u of c.slideUrls) console.log(`    ${u}`);
    }
    const apiUrl =
      (process.env.NEXT_PUBLIC_APP_URL ||
        "https://grant-finder-kappa.vercel.app") + "/api/carousels/latest";
    console.log(`[carousel] Botato endpoint: ${apiUrl}`);
  } else {
    const result = await generateAndSaveCarousels(supabase, {
      outputRoot: args.output,
      count: args.count ?? 2,
      markPublished: true,
    });
    if (result.length === 0) {
      console.warn(
        "[carousel] no grants available — base empty or all published."
      );
      process.exit(0);
    }
    console.log(
      `[carousel] saved ${result.length} carousel(s) to ${result[0].outputDir}`
    );
    for (const c of result) {
      console.log(`  • ${c.grantTitle}`);
      for (const p of c.slidePaths) console.log(`    ${p}`);
      console.log(`    ${c.captionPath}`);
    }
  }

  console.log(`[carousel] done in ${((Date.now() - start) / 1000).toFixed(1)}s`);
}

main().catch((err) => {
  console.error("[carousel] failed:", err);
  process.exit(1);
});
