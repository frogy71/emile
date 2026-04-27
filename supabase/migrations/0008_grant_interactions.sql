-- Tinder-inspired feedback / learning system.
--
-- We capture every user gesture on a grant (like, dislike, save, dismiss,
-- view, apply) so the matching pipeline can learn org-specific preferences
-- over time: boost grants from funders/themes the org has liked, penalise
-- those it has dismissed, and surface "wisdom of the crowd" via a
-- per-grant popularity counter.
--
-- The unique index on (organization_id, grant_id, interaction_type) makes
-- the API a clean upsert — re-clicking a button is idempotent rather than
-- inflating the counter or polluting history.

CREATE TABLE IF NOT EXISTS "user_grant_interactions" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "project_id" uuid REFERENCES "projects"("id") ON DELETE SET NULL,
  "grant_id" uuid NOT NULL REFERENCES "grants"("id") ON DELETE CASCADE,
  "interaction_type" text NOT NULL CHECK (
    "interaction_type" IN ('like', 'dislike', 'save', 'dismiss', 'view', 'apply')
  ),
  "created_at" timestamptz DEFAULT now()
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_interactions_org"
  ON "user_grant_interactions"("organization_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_interactions_grant"
  ON "user_grant_interactions"("grant_id");
--> statement-breakpoint

-- Idempotency: same org expressing the same interaction on the same grant
-- shouldn't create duplicate rows. Project context isn't part of the key
-- because preferences are per-org, not per-project (an org that loves
-- "climate" funders should benefit on every project).
CREATE UNIQUE INDEX IF NOT EXISTS "idx_interactions_unique"
  ON "user_grant_interactions"("organization_id", "grant_id", "interaction_type");
--> statement-breakpoint

-- ─── Popularity counter on grants ────────────────────────────────
--
-- Incremented by the API when an org likes/saves/applies. Used by the
-- match pipeline as a small "wisdom of the crowd" boost — grants other
-- orgs are interested in get a slight bump.

ALTER TABLE "grants"
  ADD COLUMN IF NOT EXISTS "popularity_score" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint

-- ─── RLS ────────────────────────────────────────────────────────
--
-- Same shape as the rest of the org-scoped tables (see 0004_rls_audit.sql):
-- service-role bypasses RLS, authenticated users see only rows for an
-- organization they own.

ALTER TABLE "user_grant_interactions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

DROP POLICY IF EXISTS "interactions_via_owner_org" ON "user_grant_interactions";
--> statement-breakpoint

CREATE POLICY "interactions_via_owner_org"
  ON "user_grant_interactions" FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = user_grant_interactions.organization_id
        AND organizations.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = user_grant_interactions.organization_id
        AND organizations.user_id = (SELECT auth.uid())
    )
  );
