import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { PLANS, type PlanKey } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { plan } = await request.json();
    const planKey: PlanKey = plan === "expert" ? "expert" : "pro";
    const planConfig = PLANS[planKey];
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await getStripe().checkout.sessions.create({
      customer_email: user.email,
      mode: "subscription",
      tax_id_collection: { enabled: true },
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: planConfig.name,
              description: planConfig.description,
            },
            unit_amount: planConfig.price,
            recurring: { interval: planConfig.interval },
          },
          quantity: 1,
        },
      ],
      custom_text: {
        submit: {
          message:
            "Associations : TVA non applicable (art. 261-7-1° CGI). Le montant affiché est le prix final.",
        },
      },
      metadata: {
        user_id: user.id,
        plan: planKey,
      },
      success_url: `${appUrl}/settings?payment=success`,
      cancel_url: `${appUrl}/settings?payment=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur Stripe";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
