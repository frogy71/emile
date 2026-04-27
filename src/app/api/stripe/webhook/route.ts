import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

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
      }
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
