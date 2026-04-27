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

export type PlanKey = "pro" | "expert";

export const PLANS: Record<
  PlanKey,
  {
    name: string;
    description: string;
    price: number; // cents
    interval: "month";
    priceId: string | undefined;
  }
> = {
  pro: {
    name: "Emile Pro",
    description:
      "Matchings illimités, 5 dossiers IA / mois, alertes intelligentes, export DOCX, support email.",
    price: 7900,
    interval: "month",
    priceId: process.env.STRIPE_PRO_PRICE_ID,
  },
  expert: {
    name: "Emile Expert",
    description:
      "Tout illimité, dossiers IA illimités, accès prioritaire aux nouvelles subventions, dashboard analytics, support prioritaire.",
    price: 19900,
    interval: "month",
    priceId: process.env.STRIPE_EXPERT_PRICE_ID,
  },
};
