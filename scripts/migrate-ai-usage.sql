-- Migration: AI usage tracking for cost monitoring
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  org_id uuid,
  action text NOT NULL, -- 'scoring', 'proposal'
  model text NOT NULL, -- 'claude-haiku-4-5', 'claude-sonnet-4'
  input_tokens integer DEFAULT 0,
  output_tokens integer DEFAULT 0,
  cost_usd numeric(10, 6) DEFAULT 0, -- cost in USD
  metadata jsonb DEFAULT '{}', -- grant_id, project_id, etc.
  created_at timestamptz DEFAULT now()
);

-- Index for admin dashboard queries
CREATE INDEX IF NOT EXISTS idx_ai_usage_created ON ai_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_action ON ai_usage_logs(action);
