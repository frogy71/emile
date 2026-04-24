-- Deadline alert dedup: track which (alert_preference, grant, window) triplets
-- have already been notified so we never re-send the same J-30 / J-14 / J-7
-- email for a given grant.

CREATE TABLE IF NOT EXISTS "deadline_alert_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alert_preference_id" uuid NOT NULL,
	"grant_id" uuid NOT NULL,
	"window_days" integer NOT NULL, -- 30, 14 or 7
	"sent_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "deadline_alert_history_unique_idx"
	ON "deadline_alert_history" ("alert_preference_id", "grant_id", "window_days");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_deadline_alert_history_sent"
	ON "deadline_alert_history" ("sent_at" DESC);
--> statement-breakpoint
-- RLS: never exposed client-side, service role only
ALTER TABLE "deadline_alert_history" ENABLE ROW LEVEL SECURITY;

-- New-match dedup: track (alert_preference, grant) pairs we've notified about
-- so "nouveau match 85+" alerts don't fire twice for the same grant.
CREATE TABLE IF NOT EXISTS "new_match_alert_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alert_preference_id" uuid NOT NULL,
	"grant_id" uuid NOT NULL,
	"score" integer NOT NULL,
	"sent_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "new_match_alert_history_unique_idx"
	ON "new_match_alert_history" ("alert_preference_id", "grant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_new_match_alert_history_sent"
	ON "new_match_alert_history" ("sent_at" DESC);
--> statement-breakpoint
ALTER TABLE "new_match_alert_history" ENABLE ROW LEVEL SECURITY;
