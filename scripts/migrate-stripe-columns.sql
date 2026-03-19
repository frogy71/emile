-- Migration: Add Stripe billing columns to organizations
-- Run this in Supabase SQL Editor

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS plan_status text DEFAULT 'inactive';

-- Add logframe data column to projects for extra fields
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS logframe_data jsonb DEFAULT '{}';

-- Add index for Stripe customer lookups
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer
  ON organizations(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- Add index for plan status queries (admin dashboard)
CREATE INDEX IF NOT EXISTS idx_organizations_plan_status
  ON organizations(plan_status)
  WHERE plan_status = 'active';

-- Add proposals link to project
ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects(id);
