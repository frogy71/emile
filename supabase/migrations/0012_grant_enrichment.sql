-- Grant enrichment columns
--
-- Existing ingestion pulls roughly title/summary/deadline/amount per source,
-- but the detail page wants a much richer record: open dates, difficulty,
-- structured eligibility, document checklists, contact info and the direct
-- application URL. Some sources expose those fields natively (Aides-
-- Territoires, EU SEDIA) and we map them on the way in; everything else is
-- enriched asynchronously by an LLM pass that fetches the source page.
--
-- `enriched_at` doubles as a queue cursor: rows where it's NULL have never
-- been touched by the enricher and are picked up by the batch job.
-- `enrichment_data` stores the raw LLM output (or error trail) for debugging
-- without polluting the user-visible columns.

ALTER TABLE "grants"
  ADD COLUMN IF NOT EXISTS "open_date" timestamptz,
  ADD COLUMN IF NOT EXISTS "difficulty_level" text,
  ADD COLUMN IF NOT EXISTS "eligibility_conditions" text,
  ADD COLUMN IF NOT EXISTS "required_documents" text[],
  ADD COLUMN IF NOT EXISTS "application_url" text,
  ADD COLUMN IF NOT EXISTS "contact_info" text,
  ADD COLUMN IF NOT EXISTS "co_financing_pct" integer,
  ADD COLUMN IF NOT EXISTS "enriched_at" timestamptz,
  ADD COLUMN IF NOT EXISTS "enrichment_data" jsonb;
--> statement-breakpoint

-- Difficulty is a closed enum at the application layer — enforce it in the DB
-- so a buggy enrichment can't slip "moderate" or "très difficile" past us.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'grants_difficulty_level_check'
  ) THEN
    ALTER TABLE "grants"
      ADD CONSTRAINT "grants_difficulty_level_check"
      CHECK ("difficulty_level" IS NULL OR "difficulty_level" IN ('easy', 'medium', 'hard', 'expert'));
  END IF;
END$$;
--> statement-breakpoint

-- Co-financing percentage must be a sane 0-100 value.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'grants_co_financing_pct_check'
  ) THEN
    ALTER TABLE "grants"
      ADD CONSTRAINT "grants_co_financing_pct_check"
      CHECK ("co_financing_pct" IS NULL OR ("co_financing_pct" >= 0 AND "co_financing_pct" <= 100));
  END IF;
END$$;
--> statement-breakpoint

-- The batch enricher selects "WHERE enriched_at IS NULL ORDER BY created_at"
-- — a partial index on the unenriched rows keeps that hot query cheap as the
-- backlog grows (and shrinks back to ~zero once the queue drains).
CREATE INDEX IF NOT EXISTS "idx_grants_enrichment_queue"
  ON "grants" ("created_at")
  WHERE "enriched_at" IS NULL;
