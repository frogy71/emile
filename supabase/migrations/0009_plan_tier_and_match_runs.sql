-- 3-tier freemium model.
--
-- The webhook + checkout already write `plan` (text) and `plan_status` (text)
-- onto the organizations row, but those columns weren't formally declared in
-- a migration. We declare them here and add `plan` so the pricing tier
-- (free / pro / expert) is queryable directly.
--
-- We also add `match_runs` to track how many times a free org has triggered
-- the matching pipeline this calendar month — the cap is 3 / month for free,
-- unlimited for pro/expert.

ALTER TABLE "organizations"
  ADD COLUMN IF NOT EXISTS "plan" text DEFAULT 'free' NOT NULL,
  ADD COLUMN IF NOT EXISTS "plan_status" text DEFAULT 'free' NOT NULL,
  ADD COLUMN IF NOT EXISTS "stripe_customer_id" text,
  ADD COLUMN IF NOT EXISTS "stripe_subscription_id" text;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_organizations_plan"
  ON "organizations"("plan");
--> statement-breakpoint

-- Per-org monthly match-run counter. We keep one row per (org, year_month)
-- so resetting the cap is just "ignore older rows", and concurrent matches
-- from the same org increment the same row atomically.

CREATE TABLE IF NOT EXISTS "match_runs" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "year_month" text NOT NULL, -- 'YYYY-MM', UTC
  "count" integer DEFAULT 0 NOT NULL,
  "updated_at" timestamptz DEFAULT now()
);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "idx_match_runs_org_month"
  ON "match_runs"("organization_id", "year_month");
--> statement-breakpoint

ALTER TABLE "match_runs" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

DROP POLICY IF EXISTS "match_runs_via_owner_org" ON "match_runs";
--> statement-breakpoint

CREATE POLICY "match_runs_via_owner_org"
  ON "match_runs" FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = match_runs.organization_id
        AND organizations.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = match_runs.organization_id
        AND organizations.user_id = (SELECT auth.uid())
    )
  );
