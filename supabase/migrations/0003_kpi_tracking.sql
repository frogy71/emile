-- KPI tracking: add timestamps to organizations so we can compute conversion
-- and churn, and a simple partnerships table for distribution tracking.

ALTER TABLE organizations
	ADD COLUMN IF NOT EXISTS plan_started_at timestamptz,
	ADD COLUMN IF NOT EXISTS plan_cancelled_at timestamptz;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_organizations_plan_started
	ON organizations (plan_started_at DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_organizations_plan_cancelled
	ON organizations (plan_cancelled_at DESC)
	WHERE plan_cancelled_at IS NOT NULL;
--> statement-breakpoint
-- Partnerships tracker: manual entry from admin dashboard
CREATE TABLE IF NOT EXISTS "partnerships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL, -- ex: "URIOPSS Île-de-France"
	"type" text DEFAULT 'federation', -- federation | network | distributor | other
	"status" text DEFAULT 'prospect', -- prospect | discussing | signed | inactive
	"contact_name" text,
	"contact_email" text,
	"notes" text,
	"signed_at" timestamptz,
	"created_at" timestamptz DEFAULT now(),
	"updated_at" timestamptz DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_partnerships_status ON partnerships (status);
--> statement-breakpoint
ALTER TABLE "partnerships" ENABLE ROW LEVEL SECURITY;
