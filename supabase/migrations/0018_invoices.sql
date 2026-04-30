-- Local invoice ledger.
-- Stripe is the source of truth for payment status, but we mirror invoices
-- here so the admin can see the full billing history at a glance, the org
-- user can list their own invoices in /settings/billing, and we can render
-- a branded PDF (link or hosted) without going through the portal.

CREATE TABLE IF NOT EXISTS "invoices" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "invoice_number" text NOT NULL UNIQUE,
  "amount_cents" integer NOT NULL,
  "currency" text NOT NULL DEFAULT 'eur',
  "plan" text,
  "status" text NOT NULL DEFAULT 'pending',
  "stripe_invoice_id" text,
  "stripe_subscription_id" text,
  "hosted_invoice_url" text,
  "pdf_url" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "paid_at" timestamp with time zone
);

CREATE INDEX IF NOT EXISTS "invoices_organization_id_idx"
  ON "invoices" ("organization_id");
CREATE INDEX IF NOT EXISTS "invoices_stripe_invoice_id_idx"
  ON "invoices" ("stripe_invoice_id");
CREATE INDEX IF NOT EXISTS "invoices_status_idx"
  ON "invoices" ("status");

ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;

-- Org members can read their own invoices
CREATE POLICY "invoices_owner_select" ON "invoices"
  FOR SELECT
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE user_id = auth.uid()
    )
  );
