/**
 * Blog cover image generator — uses the same Satori pipeline as the
 * carousel slides. Renders a 1200×630 OG-friendly card with the article
 * title, thematic tag, and Émile branding.
 */

import { ImageResponse } from "next/og";
import { createElement } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

export const COVER_WIDTH = 1200;
export const COVER_HEIGHT = 630;

const FOREGROUND = "#1a1a1a";
const CARD = "#ffffff";
const SHADOW = "8px 8px 0px 0px #1a1a1a";

const PALETTE = ["#c8f76f", "#ffe066", "#a3d5ff", "#f9a8d4", "#fbbf24"];

function pickAccent(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return PALETTE[h % PALETTE.length];
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}

interface CoverProps {
  title: string;
  thematicTag: string;
  funder: string | null;
  accent: string;
}

function CoverImage({ title, thematicTag, funder, accent }: CoverProps) {
  return createElement(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        width: COVER_WIDTH,
        height: COVER_HEIGHT,
        backgroundColor: accent,
        padding: 64,
        fontFamily: "Inter, system-ui, sans-serif",
        color: FOREGROUND,
        position: "relative",
      },
    },
    createElement(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 28,
          fontWeight: 800,
          letterSpacing: "-0.02em",
        },
      },
      createElement(
        "span",
        {
          style: { display: "flex", alignItems: "center", gap: 8 },
        },
        "émile",
        createElement("span", {
          style: {
            display: "inline-block",
            width: 12,
            height: 12,
            borderRadius: 6,
            background: FOREGROUND,
            marginLeft: 4,
          },
        })
      ),
      createElement(
        "span",
        {
          style: {
            display: "flex",
            background: FOREGROUND,
            color: accent,
            padding: "8px 18px",
            borderRadius: 999,
            fontSize: 22,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          },
        },
        "Grant du jour"
      )
    ),
    createElement(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          justifyContent: "center",
          marginTop: 24,
        },
      },
      createElement(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
            backgroundColor: CARD,
            border: `4px solid ${FOREGROUND}`,
            borderRadius: 24,
            boxShadow: SHADOW,
            padding: 48,
          },
        },
        createElement(
          "p",
          {
            style: {
              display: "flex",
              fontSize: 22,
              fontWeight: 600,
              color: "#666",
              margin: 0,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            },
          },
          truncate(thematicTag, 40)
        ),
        createElement(
          "h1",
          {
            style: {
              display: "flex",
              fontSize: title.length > 60 ? 52 : 64,
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              margin: "16px 0 0 0",
            },
          },
          truncate(title, 110)
        ),
        funder
          ? createElement(
              "p",
              {
                style: {
                  display: "flex",
                  fontSize: 24,
                  color: "#444",
                  marginTop: 24,
                  margin: "24px 0 0 0",
                },
              },
              truncate(funder, 70)
            )
          : null
      )
    ),
    createElement(
      "div",
      {
        style: {
          display: "flex",
          fontSize: 22,
          color: FOREGROUND,
          fontWeight: 600,
        },
      },
      "Trouvez vos subventions sur emile.so"
    )
  );
}

export interface CoverInput {
  slug: string;
  title: string;
  thematicTag: string;
  funder: string | null;
}

/** Render the cover as a PNG buffer. */
export async function renderCoverPng(input: CoverInput): Promise<Buffer> {
  const accent = pickAccent(input.slug);
  const response = new ImageResponse(
    createElement(CoverImage, {
      title: input.title,
      thematicTag: input.thematicTag,
      funder: input.funder,
      accent,
    }),
    { width: COVER_WIDTH, height: COVER_HEIGHT }
  );
  const arr = await response.arrayBuffer();
  return Buffer.from(arr);
}

const STORAGE_BUCKET = "blog-covers";

/**
 * Render and upload the cover to Supabase Storage. Returns the public URL.
 *
 * If the bucket doesn't exist yet (first run), the upload will fail loudly —
 * the cron catches it and falls back to a null cover_image_url.
 */
export async function renderAndUploadCover(
  supabase: SupabaseClient,
  input: CoverInput
): Promise<string> {
  const png = await renderCoverPng(input);
  const path = `covers/${input.slug}.png`;
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, png, { contentType: "image/png", upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
