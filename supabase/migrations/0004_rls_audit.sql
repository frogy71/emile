-- RLS audit migration: enable Row Level Security on all user-scoped tables
-- and add policies so that authenticated users can only access their own data.
-- Service role (used by our server-side routes) bypasses RLS by design.
--
-- IMPORTANT: running this migration after the fact may lock out existing
-- client-side code that relied on implicit full-read. Our Next.js server
-- components use the service role client (supabaseAdmin) for reads that
-- need to return data, so this should be safe — but verify in staging.

-- --- grants : public catalog, anyone authenticated can read, no writes ---
ALTER TABLE grants ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "grants_read_all_authenticated" ON grants;
--> statement-breakpoint
CREATE POLICY "grants_read_all_authenticated"
	ON grants FOR SELECT
	TO authenticated
	USING (true);

-- --- organizations : owner-only ---
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "orgs_owner_select" ON organizations;
--> statement-breakpoint
CREATE POLICY "orgs_owner_select"
	ON organizations FOR SELECT
	TO authenticated
	USING (user_id = (SELECT auth.uid()));
--> statement-breakpoint
DROP POLICY IF EXISTS "orgs_owner_insert" ON organizations;
--> statement-breakpoint
CREATE POLICY "orgs_owner_insert"
	ON organizations FOR INSERT
	TO authenticated
	WITH CHECK (user_id = (SELECT auth.uid()));
--> statement-breakpoint
DROP POLICY IF EXISTS "orgs_owner_update" ON organizations;
--> statement-breakpoint
CREATE POLICY "orgs_owner_update"
	ON organizations FOR UPDATE
	TO authenticated
	USING (user_id = (SELECT auth.uid()))
	WITH CHECK (user_id = (SELECT auth.uid()));
--> statement-breakpoint
DROP POLICY IF EXISTS "orgs_owner_delete" ON organizations;
--> statement-breakpoint
CREATE POLICY "orgs_owner_delete"
	ON organizations FOR DELETE
	TO authenticated
	USING (user_id = (SELECT auth.uid()));

-- --- projects : accessible only via owning organization ---
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "projects_via_owner_org" ON projects;
--> statement-breakpoint
CREATE POLICY "projects_via_owner_org"
	ON projects FOR ALL
	TO authenticated
	USING (
		EXISTS (
			SELECT 1 FROM organizations
			WHERE organizations.id = projects.organization_id
				AND organizations.user_id = (SELECT auth.uid())
		)
	)
	WITH CHECK (
		EXISTS (
			SELECT 1 FROM organizations
			WHERE organizations.id = projects.organization_id
				AND organizations.user_id = (SELECT auth.uid())
		)
	);

-- --- proposals : owned via organization ---
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "proposals_via_owner_org" ON proposals;
--> statement-breakpoint
CREATE POLICY "proposals_via_owner_org"
	ON proposals FOR ALL
	TO authenticated
	USING (
		EXISTS (
			SELECT 1 FROM organizations
			WHERE organizations.id = proposals.organization_id
				AND organizations.user_id = (SELECT auth.uid())
		)
	)
	WITH CHECK (
		EXISTS (
			SELECT 1 FROM organizations
			WHERE organizations.id = proposals.organization_id
				AND organizations.user_id = (SELECT auth.uid())
		)
	);

-- --- match_scores : owned via organization ---
ALTER TABLE match_scores ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "match_scores_via_owner_org" ON match_scores;
--> statement-breakpoint
CREATE POLICY "match_scores_via_owner_org"
	ON match_scores FOR SELECT
	TO authenticated
	USING (
		EXISTS (
			SELECT 1 FROM organizations
			WHERE organizations.id = match_scores.organization_id
				AND organizations.user_id = (SELECT auth.uid())
		)
	);

-- --- alert_preferences : owned via organization ---
ALTER TABLE alert_preferences ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "alert_prefs_via_owner_org" ON alert_preferences;
--> statement-breakpoint
CREATE POLICY "alert_prefs_via_owner_org"
	ON alert_preferences FOR ALL
	TO authenticated
	USING (
		EXISTS (
			SELECT 1 FROM organizations
			WHERE organizations.id = alert_preferences.organization_id
				AND organizations.user_id = (SELECT auth.uid())
		)
	)
	WITH CHECK (
		EXISTS (
			SELECT 1 FROM organizations
			WHERE organizations.id = alert_preferences.organization_id
				AND organizations.user_id = (SELECT auth.uid())
		)
	);

-- --- ai_usage_logs : owner sees their own logs (useful for future usage meter); admins (service role) bypass ---
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "ai_usage_logs_self_read" ON ai_usage_logs;
--> statement-breakpoint
CREATE POLICY "ai_usage_logs_self_read"
	ON ai_usage_logs FOR SELECT
	TO authenticated
	USING (user_id = (SELECT auth.uid()));
