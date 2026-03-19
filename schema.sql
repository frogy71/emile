-- Emile Database Schema
-- Copy this into Supabase SQL Editor and click "Run"

-- 1. Organizations
CREATE TABLE IF NOT EXISTS "organizations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "name" text NOT NULL,
  "country" text DEFAULT 'FR' NOT NULL,
  "legal_status" text,
  "mission" text,
  "thematic_areas" text[],
  "beneficiaries" text[],
  "geographic_focus" text[],
  "annual_budget_eur" integer,
  "team_size" integer,
  "languages" text[],
  "prior_grants" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

-- 2. Projects
CREATE TABLE IF NOT EXISTS "projects" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id"),
  "name" text NOT NULL,
  "summary" text,
  "objectives" text[],
  "target_beneficiaries" text[],
  "target_geography" text[],
  "requested_amount_eur" integer,
  "duration_months" integer,
  "indicators" text[],
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

-- 3. Grants
CREATE TABLE IF NOT EXISTS "grants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "source_url" text NOT NULL UNIQUE,
  "source_name" text,
  "title" text NOT NULL,
  "summary" text,
  "raw_content" text,
  "funder" text,
  "country" text,
  "thematic_areas" text[],
  "eligible_entities" text[],
  "eligible_countries" text[],
  "min_amount_eur" integer,
  "max_amount_eur" integer,
  "co_financing_required" boolean,
  "deadline" timestamp with time zone,
  "grant_type" text,
  "language" text,
  "status" text DEFAULT 'active',
  "ai_summary" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

-- 4. Match Scores
CREATE TABLE IF NOT EXISTS "match_scores" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id"),
  "project_id" uuid REFERENCES "projects"("id"),
  "grant_id" uuid NOT NULL REFERENCES "grants"("id"),
  "score" integer NOT NULL,
  "explanation" jsonb,
  "recommendation" text,
  "computed_at" timestamp with time zone DEFAULT now()
);

-- 5. Proposals
CREATE TABLE IF NOT EXISTS "proposals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id"),
  "project_id" uuid REFERENCES "projects"("id"),
  "grant_id" uuid NOT NULL REFERENCES "grants"("id"),
  "content" jsonb,
  "status" text DEFAULT 'draft',
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

-- 6. Alert Preferences
CREATE TABLE IF NOT EXISTS "alert_preferences" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id"),
  "email" text NOT NULL,
  "frequency" text DEFAULT 'weekly',
  "min_score" integer DEFAULT 60,
  "enabled" boolean DEFAULT true,
  "last_sent_at" timestamp with time zone
);

-- 7. Index for unique match scores
CREATE UNIQUE INDEX IF NOT EXISTS "match_scores_unique_idx"
  ON "match_scores" USING btree ("organization_id", "project_id", "grant_id");

-- Done!
SELECT 'Schema created successfully!' as result;
