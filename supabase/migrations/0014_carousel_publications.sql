-- Carousel publications table + public Storage bucket
--
-- The carousel maker now defaults to "publish" mode: slides are uploaded to
-- a public Supabase Storage bucket and a row is persisted here. Botato (and
-- any other consumer) hits GET /api/carousels/latest, gets the most recent
-- batch of carousels with caption + 5 public slide URLs, and can post them
-- without us having to round-trip through Dropbox.
--
-- We still keep `grants.carousel_published_at` from migration 0013 so the
-- selector never re-picks a published grant. This table just lets us *find*
-- a published carousel back from its date/grant.

CREATE TABLE IF NOT EXISTS "carousel_publications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "date" date NOT NULL DEFAULT CURRENT_DATE,
  "carousel_index" integer NOT NULL,
  "grant_id" uuid NOT NULL REFERENCES "grants"("id") ON DELETE CASCADE,
  "accent_color" text NOT NULL,
  "caption" text NOT NULL,
  -- 5 public storage URLs in slide order. Stored as text[] (not jsonb) so
  -- we can index/scan if the carousel ever grows past the daily-feed use.
  "slide_urls" text[] NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "carousel_publications_index_check"
    CHECK ("carousel_index" >= 0 AND "carousel_index" < 100),
  CONSTRAINT "carousel_publications_slide_count_check"
    CHECK (array_length("slide_urls", 1) BETWEEN 1 AND 10)
);
--> statement-breakpoint

-- The public /api/carousels/latest endpoint queries
--   ORDER BY date DESC, carousel_index ASC
-- so the composite index makes that scan trivial.
CREATE INDEX IF NOT EXISTS "idx_carousel_publications_date"
  ON "carousel_publications" ("date" DESC, "carousel_index" ASC);
--> statement-breakpoint

-- One row per (date, index) — enforces idempotency if the publish job is
-- re-run on the same day with the same selection.
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_carousel_publications_date_index"
  ON "carousel_publications" ("date", "carousel_index");
--> statement-breakpoint

-- Public bucket for slide PNGs. `public = true` means signed URLs aren't
-- required — anyone with the URL can fetch the image, which is exactly what
-- Botato needs. Idempotent so re-running the migration is safe.
INSERT INTO storage.buckets (id, name, public)
VALUES ('carousels', 'carousels', true)
ON CONFLICT (id) DO UPDATE SET public = true;
--> statement-breakpoint

-- Public read policy on the bucket. Without this, even with public=true the
-- frontend can hit "row-level security" denies on listing / fetching.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'carousels_public_read'
  ) THEN
    CREATE POLICY "carousels_public_read"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'carousels');
  END IF;
END$$;
