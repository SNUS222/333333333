import Stripe from "stripe";
import { env } from "../../config/env.js";

let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  if (!client) {
    client = new Stripe(env.STRIPE_SECRET_KEY);
  }
  return client;
}

export function isStripeEnabled(): boolean {
  return Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_PREMIUM_PRICE_ID);
}
