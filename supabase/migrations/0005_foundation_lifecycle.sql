-- Foundation call-for-projects lifecycle tracking
--
-- Goal: for every AAP (appel à projets) crawled from a private foundation
-- portal, record when we first saw it, when we last confirmed it, when
-- it disappeared, when it was closed (deadline passed) and any transition
-- between those states. The admin dashboard reads from this to surface
-- per-foundation health and the notification system reads `opened` /
-- `closing_soon` / `reopened` events to email the right users.
--
-- Designed to be idempotent — every crawl run UPDATES the same grant row
-- if it sees the same stable key, and INSERTS a new lifecycle_event only
-- when the state actually transitions.

-- 1) Extend `grants` with lifecycle columns. Safe on grants from every
--    source — rows that never disappear just never see their
--    `disappeared_at` column set.
ALTER TABLE "grants"
  ADD COLUMN IF NOT EXISTS "first_seen_at" timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS "last_seen_at" timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS "disappeared_at" timestamptz,
  ADD COLUMN IF NOT EXISTS "reopened_at" timestamptz,
  ADD COLUMN IF NOT EXISTS "portal_stable_key" text,
  ADD COLUMN IF NOT EXISTS "missed_crawls" integer DEFAULT 0;
--> statement-breakpoint

-- Uniqueness: (source_name, portal_stable_key) lets the crawler upsert
-- the same AAP across runs without creating dupes. Partial index so old
-- grants with no stable key don't conflict.
CREATE UNIQUE INDEX IF NOT EXISTS "grants_portal_stable_key_idx"
  ON "grants" ("source_name", "portal_stable_key")
  WHERE "portal_stable_key" IS NOT NULL;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "grants_first_seen_at_idx"
  ON "grants" ("first_seen_at" DESC)
  WHERE "first_seen_at" IS NOT NULL;
--> statement-breakpoint

-- 2) Lifecycle events table — append-only journal of every state
--    transition for a grant. Serves the admin timeline and the alert
--    engine (notifies users on opened/closing_soon/reopened).
CREATE TABLE IF NOT EXISTS "grant_lifecycle_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "grant_id" uuid NOT NULL REFERENCES "grants"("id") ON DELETE CASCADE,
  "event_type" text NOT NULL CHECK (event_type IN (
    'opened',          -- first time we observed this AAP
    'still_open',      -- confirmed present on this crawl (heartbeat)
    'deadline_changed',-- deadline was set or modified
    'closing_soon',    -- deadline within 14 days
    'disappeared',     -- missing for N consecutive crawls
    'closed',          -- deadline passed
    'reopened'         -- came back after being marked disappeared
  )),
  "detected_at" timestamptz DEFAULT now() NOT NULL,
  "previous_status" text,
  "new_status" text,
  "deadline_before" timestamptz,
  "deadline_after" timestamptz,
  "crawl_run_id" uuid,
  "notes" text
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "grant_lifecycle_events_grant_idx"
  ON "grant_lifecycle_events" ("grant_id", "detected_at" DESC);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "grant_lifecycle_events_type_idx"
  ON "grant_lifecycle_events" ("event_type", "detected_at" DESC);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "grant_lifecycle_events_run_idx"
  ON "grant_lifecycle_events" ("crawl_run_id")
  WHERE "crawl_run_id" IS NOT NULL;
--> statement-breakpoint

-- 3) Foundation portal health — one row per funder, updated by the
--    crawler. Lets the admin dashboard show at-a-glance "which portals
--    haven't yielded any call in 3 runs = probably changed structure".
CREATE TABLE IF NOT EXISTS "foundation_portal_health" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "funder" text NOT NULL UNIQUE,
  "portal_url" text NOT NULL,
  "last_crawled_at" timestamptz,
  "last_success_at" timestamptz,
  "last_reachable" boolean DEFAULT true,
  "active_calls_count" integer DEFAULT 0,
  "empty_crawls_in_a_row" integer DEFAULT 0,
  "health" text DEFAULT 'unknown' CHECK (health IN (
    'healthy',    -- reachable, at least one active call OR ok with 0 calls for < 3 runs
    'no_calls',   -- reachable but 0 calls for 3+ runs — portal structure may have changed
    'unreachable',-- HTTP failure
    'unknown'
  )),
  "last_error" text,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "foundation_portal_health_health_idx"
  ON "foundation_portal_health" ("health");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "foundation_portal_health_last_crawled_idx"
  ON "foundation_portal_health" ("last_crawled_at" DESC);
--> statement-breakpoint

-- RLS: admin-only. Service role always bypasses RLS so the crawler and
-- admin API are unaffected; no client policies are needed.
ALTER TABLE "grant_lifecycle_events" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "foundation_portal_health" ENABLE ROW LEVEL SECURITY;
