import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-02-25.clover",
    });
  }
  return _stripe;
}

export const PLANS = {
  monthly: {
    name: "Emile Pro — Mensuel",
    price: 7900, // cents
    interval: "month" as const,
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID,
  },
  annual: {
    name: "Emile Pro — Annuel",
    price: 70800, // cents (59€/month * 12)
    interval: "year" as const,
    priceId: process.env.STRIPE_ANNUAL_PRICE_ID,
  },
};
