import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import { skipPendingForUser } from "@/lib/email/send-engine";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = getSupabase();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.metadata?.user_id;
      const plan = session.metadata?.plan || "pro";
      const nowIso = new Date().toISOString();

      if (userId) {
        // Only set plan_started_at the first time we activate this org. If the
        // org previously cancelled and is re-activating, we reset the start so
        // churn cohorts are based on the current subscription lifecycle.
        await supabase
          .from("organizations")
          .update({
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            plan,
            plan_status: "active",
            plan_started_at: nowIso,
            plan_cancelled_at: null,
          })
          .eq("user_id", userId);

        // User just converted — kill the rest of the nurture sequence so we
        // don't keep emailing a paying customer. Fire-and-forget; webhook
        // success isn't blocked on this.
        skipPendingForUser(userId, "converted").catch((err) =>
          console.error("[email-sequence] skip on conversion failed:", err)
        );
      }
      break;
    }

    // Invoice lifecycle — Stripe creates an invoice for every subscription
    // billing event. We mirror it locally so /settings/billing and
    // /admin/invoices can render the history without going through the portal.
    case "invoice.created":
    case "invoice.finalized":
    case "invoice.paid":
    case "invoice.payment_failed":
    case "invoice.payment_succeeded": {
      const invoice = event.data.object as unknown as {
        id: string;
        number: string | null;
        customer: string;
        subscription: string | null;
        amount_due: number;
        amount_paid: number;
        currency: string;
        status: string | null;
        hosted_invoice_url: string | null;
        invoice_pdf: string | null;
        status_transitions?: { paid_at?: number | null };
        lines?: { data?: Array<{ price?: { metadata?: { plan?: string } } }> };
      };

      // Find the org by stripe_customer_id (set on checkout.session.completed).
      const { data: org } = await supabase
        .from("organizations")
        .select("id")
        .eq("stripe_customer_id", invoice.customer)
        .maybeSingle();

      if (!org) break; // unknown customer — ignore (test webhooks etc.)

      const isPaid = invoice.status === "paid";
      const paidAt = invoice.status_transitions?.paid_at
        ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
        : isPaid
          ? new Date().toISOString()
          : null;

      const planFromLines =
        invoice.lines?.data?.[0]?.price?.metadata?.plan || null;

      await supabase
        .from("invoices")
        .upsert(
          {
            organization_id: org.id,
            invoice_number: invoice.number || `STRIPE-${invoice.id}`,
            amount_cents: invoice.amount_paid || invoice.amount_due,
            currency: invoice.currency,
            plan: planFromLines,
            status: invoice.status || "pending",
            stripe_invoice_id: invoice.id,
            stripe_subscription_id: invoice.subscription,
            hosted_invoice_url: invoice.hosted_invoice_url,
            pdf_url: invoice.invoice_pdf,
            paid_at: paidAt,
          },
          { onConflict: "stripe_invoice_id" }
        );
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object;
      const customerId = subscription.customer as string;
      const isActive = subscription.status === "active";

      await supabase
        .from("organizations")
        .update({
          plan_status: isActive ? "active" : "inactive",
          // If the subscription is now inactive (payment failed, paused...),
          // record the date for churn analytics. If it goes back active we
          // clear the cancellation timestamp.
          plan_cancelled_at: isActive ? null : new Date().toISOString(),
        })
        .eq("stripe_customer_id", customerId);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const customerId = subscription.customer as string;

      await supabase
        .from("organizations")
        .update({
          plan_status: "cancelled",
          plan_cancelled_at: new Date().toISOString(),
        })
        .eq("stripe_customer_id", customerId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
