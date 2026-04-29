-- Carousel publication tracking
--
-- The "Grant of the Day" carousel maker (admin/carousels) picks 2 grants per
-- day and exports a 5-slide PNG bundle to Dropbox for Botato to publish on
-- Instagram/LinkedIn. We never want to feature the same grant twice, so we
-- stamp the row when it's selected. NULL = available for selection.
ALTER TABLE "grants"
  ADD COLUMN IF NOT EXISTS "carousel_published_at" timestamptz;
--> statement-breakpoint

-- Selection query filters on carousel_published_at IS NULL combined with a
-- deadline window. A partial index keeps that scan cheap as published grants
-- accumulate over months.
CREATE INDEX IF NOT EXISTS "idx_grants_carousel_unpublished"
  ON "grants" ("deadline")
  WHERE "carousel_published_at" IS NULL AND "status" = 'active';
