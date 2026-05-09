import { Router, raw } from "express";
import type Stripe from "stripe";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { getStripe, isStripeEnabled } from "../services/billing/stripe.js";
import { logger } from "../config/logger.js";

const router = Router();

router.post(
  "/webhook",
  raw({ type: "application/json" }),
  async (req, res) => {
    if (!isStripeEnabled() || !env.STRIPE_WEBHOOK_SECRET) {
      res.status(503).json({ error: "Stripe webhook disabled" });
      return;
    }
    const stripe = getStripe();
    const sig = req.headers["stripe-signature"];
    if (!sig || typeof sig !== "string") {
      res.status(400).json({ error: "missing signature" });
      return;
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.body as Buffer, sig, env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      logger.warn({ err }, "stripe signature verification failed");
      res.status(400).send("invalid signature");
      return;
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
          const subId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
          if (customerId) {
            await prisma.user.updateMany({
              where: { stripeCustomerId: customerId },
              data: {
                plan: "PREMIUM",
                stripeSubscriptionId: subId ?? undefined,
                subscriptionStatus: "active",
              },
            });
          }
          break;
        }
        case "customer.subscription.updated":
        case "customer.subscription.created": {
          const sub = event.data.object as Stripe.Subscription;
          const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
          const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end;
          await prisma.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: {
              plan: sub.status === "active" || sub.status === "trialing" ? "PREMIUM" : "FREE",
              stripeSubscriptionId: sub.id,
              subscriptionStatus: sub.status,
              subscriptionPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : undefined,
            },
          });
          break;
        }
        case "customer.subscription.deleted": {
          const sub = event.data.object as Stripe.Subscription;
          const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
          await prisma.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: { plan: "FREE", subscriptionStatus: "canceled" },
          });
          break;
        }
        default:
          logger.debug({ type: event.type }, "unhandled stripe event");
      }
      res.json({ received: true });
    } catch (err) {
      logger.error({ err }, "webhook handler failed");
      res.status(500).end();
    }
  },
);

export default router;
