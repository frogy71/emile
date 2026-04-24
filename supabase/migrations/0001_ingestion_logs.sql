-- Ingestion logs: track every source run with timing, counts, and error details
CREATE TABLE IF NOT EXISTS "ingestion_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"source_name" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL DEFAULT now(),
	"completed_at" timestamp with time zone,
	"status" text NOT NULL DEFAULT 'running', -- running | success | partial | failed
	"fetched" integer DEFAULT 0,
	"transformed" integer DEFAULT 0,
	"inserted" integer DEFAULT 0,
	"skipped" integer DEFAULT 0,
	"errors" integer DEFAULT 0,
	"duration_ms" integer DEFAULT 0,
	"error_message" text,
	"error_details" jsonb,
	"trigger" text DEFAULT 'manual' -- manual | cron-daily | cron-weekly | admin
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ingestion_logs_source_started"
	ON "ingestion_logs" ("source_name", "started_at" DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ingestion_logs_run"
	ON "ingestion_logs" ("run_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ingestion_logs_status"
	ON "ingestion_logs" ("status", "started_at" DESC);
--> statement-breakpoint
-- RLS: admins only (service role bypasses RLS)
ALTER TABLE "ingestion_logs" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
-- Helpful index on grants.updated_at for cron/monitoring
CREATE INDEX IF NOT EXISTS "idx_grants_updated_at"
	ON "grants" ("updated_at" DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_grants_source_status"
	ON "grants" ("source_name", "status");
