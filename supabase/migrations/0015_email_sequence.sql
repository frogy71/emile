-- Email conversion engine — internal nurture sequence for free users.
--
-- Two tables:
--   email_sequence_templates : the editable copy + delay for each step
--   email_sequence_queue     : per-user enrollment, scheduling, and tracking
--
-- Plus a `email_unsubscribed` flag on organizations so users can opt out
-- once and we skip the rest of the sequence permanently.

CREATE TABLE IF NOT EXISTS "email_sequence_templates" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "step_number" integer NOT NULL UNIQUE,
  "delay_days" integer NOT NULL,
  "subject" text NOT NULL,
  "body_html" text NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "email_sequence_queue" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "organization_id" uuid REFERENCES organizations(id) ON DELETE CASCADE,
  "step_number" integer NOT NULL,
  "scheduled_at" timestamptz NOT NULL,
  "sent_at" timestamptz,
  "opened_at" timestamptz,
  "clicked_at" timestamptz,
  "status" text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending','sent','failed','skipped','unsubscribed')),
  "tracking_token" uuid DEFAULT gen_random_uuid() NOT NULL UNIQUE,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_queue_pending"
  ON "email_sequence_queue"("scheduled_at")
  WHERE "status" = 'pending';
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_queue_user"
  ON "email_sequence_queue"("user_id");
--> statement-breakpoint

-- Avoid duplicate enrollments — a (user, step) pair must be unique.
CREATE UNIQUE INDEX IF NOT EXISTS "idx_queue_user_step_unique"
  ON "email_sequence_queue"("user_id", "step_number");
--> statement-breakpoint

ALTER TABLE "organizations"
  ADD COLUMN IF NOT EXISTS "email_unsubscribed" boolean DEFAULT false NOT NULL;
--> statement-breakpoint

-- RLS: only the service role touches these tables. Users never query them
-- directly (tracking pixels/links go through server routes that use the
-- service-role client). We still enable RLS to refuse anon/authenticated.
ALTER TABLE "email_sequence_templates" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

ALTER TABLE "email_sequence_queue" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
