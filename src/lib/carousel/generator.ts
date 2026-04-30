/**
 * Carousel maker — orchestrates everything.
 *
 *   pick grants → render 5 slides as PNG → write to disk → caption.txt
 *
 * The PNG rendering uses next/og's ImageResponse, which uses Satori under
 * the hood. We don't need a headless browser — Satori takes JSX (with
 * inline styles) and rasterizes via @resvg/resvg-js bundled in Next.
 */

import { ImageResponse } from "next/og";
import { createElement } from "react";
import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  pickCarouselGrants,
  markCarouselPublished,
  type CarouselGrant,
} from "./selector";
import { SLIDES, SLIDE_SIZE, type SlideContext } from "./slides";
import {
  colorRotation,
  formatAmountTeaser,
  formatDeadline,
  shortFunder,
  topThemes,
} from "./format";

const DEFAULT_OUTPUT_ROOT = join(homedir(), "Dropbox", "Emile", "Carousels");

export interface GeneratedCarousel {
  grantId: string;
  grantTitle: string;
  funder: string | null;
  accent: string;
  slidePaths: string[];
  captionPath: string;
  outputDir: string;
}

export interface GenerateOptions {
  /** Root directory; date subfolder is created underneath. */
  outputRoot?: string;
  /** Base URL displayed on slide 5. Defaults to NEXT_PUBLIC_APP_URL. */
  siteUrl?: string;
  /** Total grants in DB — shown on slide 5. If null, we'll query. */
  totalGrants?: number | null;
  /** How many carousels to produce. */
  count?: number;
  /**
   * If false, do NOT stamp carousel_published_at — useful for previews where
   * the user might re-roll the selection without "burning" the grants.
   */
  markPublished?: boolean;
}

/**
 * In-memory render only — used by the admin preview where we send the PNGs
 * straight to the browser without touching disk.
 */
export interface InMemoryCarousel {
  grantId: string;
  grantTitle: string;
  funder: string | null;
  accent: string;
  slidesPng: Buffer[];
  caption: string;
}

/** What we store back in the DB after a Supabase Storage publish. */
export interface PublishedCarousel {
  id: string;
  date: string;
  carouselIndex: number;
  grantId: string;
  grantTitle: string;
  funder: string | null;
  accent: string;
  caption: string;
  slideUrls: string[];
}

const STORAGE_BUCKET = "carousels";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

async function getActiveGrantCount(supabase: SupabaseClient): Promise<number> {
  const { count } = await supabase
    .from("grants")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");
  return count ?? 0;
}

async function renderSlideToPng(
  renderer: (ctx: SlideContext) => React.ReactElement,
  ctx: SlideContext
): Promise<Buffer> {
  // ImageResponse extends Response — its body is the raw PNG.
  const response = new ImageResponse(createElement(renderer, ctx), {
    width: SLIDE_SIZE,
    height: SLIDE_SIZE,
  });
  const arr = await response.arrayBuffer();
  return Buffer.from(arr);
}

function captionFor(grant: CarouselGrant, siteUrl: string): string {
  const themes = topThemes(grant, 5);
  const hashtags = [
    "Subventions",
    "FinancementProjet",
    "ESS",
    "Associations",
    "AppelAProjets",
    ...themes.map(themeToHashtag),
  ]
    .filter(Boolean)
    .slice(0, 12);

  const display = siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return [
    `⚡ Subvention du jour : ${grant.title}`,
    "",
    `💰 ${formatAmountTeaser(grant.max_amount_eur)} · 📅 Deadline ${formatDeadline(grant.deadline)}`,
    `🏛️ ${shortFunder(grant.funder)}`,
    "",
    grant.summary
      ? grant.summary.trim().slice(0, 500).replace(/\s+/g, " ")
      : "Une opportunité sélectionnée par Émile pour son potentiel de financement.",
    "",
    "👉 Décrivez votre projet, notre IA trouve vos matchs et génère votre dossier en 1 clic.",
    "",
    `Trouvez les vôtres sur ${display}`,
    "",
    hashtags.map((h) => `#${h}`).join(" "),
  ].join("\n");
}

function themeToHashtag(t: string): string {
  return t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .replace(/^./, (c) => c.toUpperCase());
}

function safeSlug(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

/**
 * Render carousels in memory (no disk write). Used by the admin preview API,
 * which streams PNGs back as base64 for the browser to display before the
 * user commits to "save to Dropbox".
 */
export async function generateCarouselsInMemory(
  supabase: SupabaseClient,
  options: GenerateOptions = {}
): Promise<InMemoryCarousel[]> {
  const count = options.count ?? 1;
  const grants = await pickCarouselGrants(supabase, count);
  if (grants.length === 0) return [];

  const totalGrants =
    options.totalGrants ?? (await getActiveGrantCount(supabase));
  const siteUrl =
    options.siteUrl ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://grant-finder-kappa.vercel.app";

  const palette = colorRotation(todayIsoDate(), grants.length);

  const out: InMemoryCarousel[] = [];
  for (let i = 0; i < grants.length; i++) {
    const grant = grants[i];
    const accent = palette[i];
    const ctx: SlideContext = { grant, accent, totalGrants, siteUrl };
    const slidesPng: Buffer[] = [];
    for (const Slide of SLIDES) {
      slidesPng.push(await renderSlideToPng(Slide, ctx));
    }
    out.push({
      grantId: grant.id,
      grantTitle: grant.title,
      funder: grant.funder,
      accent,
      slidesPng,
      caption: captionFor(grant, siteUrl),
    });
  }

  if (options.markPublished) {
    await markCarouselPublished(
      supabase,
      grants.map((g) => g.id)
    );
  }

  return out;
}

/**
 * Default publication path: render carousels, upload each slide PNG to the
 * public `carousels` Supabase Storage bucket, persist a row in
 * `carousel_publications`, and stamp the grants as published.
 *
 * The public API route GET /api/carousels/latest reads back from
 * `carousel_publications` and returns these URLs to Botato.
 */
export async function generateAndPublishCarousels(
  supabase: SupabaseClient,
  options: GenerateOptions = {}
): Promise<PublishedCarousel[]> {
  const carousels = await generateCarouselsInMemory(supabase, {
    ...options,
    // markPublished happens *after* a successful Storage upload — see below.
    markPublished: false,
  });
  if (carousels.length === 0) return [];

  const date = todayIsoDate();
  const published: PublishedCarousel[] = [];

  for (let idx = 0; idx < carousels.length; idx++) {
    const c = carousels[idx];
    const slug = safeSlug(c.grantTitle);
    const slideUrls: string[] = [];

    for (let i = 0; i < c.slidesPng.length; i++) {
      const objectPath = `${date}/${idx}/emile_${date}_${slug}_${i + 1}.png`;
      const { error: uploadErr } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(objectPath, c.slidesPng[i], {
          contentType: "image/png",
          // The bucket is keyed by date+index, so an upsert is what we want
          // when an admin re-runs publish on the same day before the unique
          // (date, carousel_index) constraint kicks in.
          upsert: true,
        });
      if (uploadErr) throw uploadErr;

      const { data: pub } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(objectPath);
      slideUrls.push(pub.publicUrl);
    }

    // Upsert on (date, carousel_index) — idempotent if the admin re-runs.
    const { data: row, error: dbErr } = await supabase
      .from("carousel_publications")
      .upsert(
        {
          date,
          carousel_index: idx,
          grant_id: c.grantId,
          accent_color: c.accent,
          caption: c.caption,
          slide_urls: slideUrls,
        },
        { onConflict: "date,carousel_index" }
      )
      .select("id")
      .single();
    if (dbErr) throw dbErr;

    published.push({
      id: row!.id as string,
      date,
      carouselIndex: idx,
      grantId: c.grantId,
      grantTitle: c.grantTitle,
      funder: c.funder,
      accent: c.accent,
      caption: c.caption,
      slideUrls,
    });
  }

  // Mark grants published only after all uploads + DB writes succeeded.
  if (options.markPublished !== false) {
    await markCarouselPublished(
      supabase,
      published.map((p) => p.grantId)
    );
  }

  return published;
}

/**
 * Fallback path: render carousels and save them to a local folder (Dropbox
 * by default). Kept as an option in the admin UI for the days where the
 * Storage bucket can't be reached or the user prefers a local export.
 *
 * Writes:
 *   {outputRoot}/{YYYY-MM-DD}/emile_grant_{date}_{slug}_{1..5}.png
 *   {outputRoot}/{YYYY-MM-DD}/emile_grant_{date}_{slug}_caption.txt
 */
export async function generateAndSaveCarousels(
  supabase: SupabaseClient,
  options: GenerateOptions = {}
): Promise<GeneratedCarousel[]> {
  const carousels = await generateCarouselsInMemory(supabase, {
    ...options,
    markPublished: options.markPublished ?? true,
  });
  if (carousels.length === 0) return [];

  const root = options.outputRoot || DEFAULT_OUTPUT_ROOT;
  const date = todayIsoDate();
  const outputDir = join(root, date);
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true });
  }

  const result: GeneratedCarousel[] = [];
  for (const c of carousels) {
    const slug = safeSlug(c.grantTitle);
    const slidePaths: string[] = [];
    for (let i = 0; i < c.slidesPng.length; i++) {
      const path = join(outputDir, `emile_grant_${date}_${slug}_${i + 1}.png`);
      await writeFile(path, c.slidesPng[i]);
      slidePaths.push(path);
    }
    const captionPath = join(
      outputDir,
      `emile_grant_${date}_${slug}_caption.txt`
    );
    await writeFile(captionPath, c.caption, "utf8");

    result.push({
      grantId: c.grantId,
      grantTitle: c.grantTitle,
      funder: c.funder,
      accent: c.accent,
      slidePaths,
      captionPath,
      outputDir,
    });
  }

  return result;
}
