import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * GET /api/invoices — list invoices for the current user's organization.
 * RLS would also enforce this, but we use the service-role client to keep
 * a single happy-path that mirrors how /api/profile reads org data.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: org } = await supabaseAdmin
    .from("organizations")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!org) {
    return NextResponse.json({ invoices: [] });
  }

  const { data, error } = await supabaseAdmin
    .from("invoices")
    .select(
      "id, invoice_number, amount_cents, currency, plan, status, hosted_invoice_url, pdf_url, created_at, paid_at"
    )
    .eq("organization_id", org.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ invoices: data || [] });
}
