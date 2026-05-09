import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { getStripe, isStripeEnabled } from "../services/billing/stripe.js";
import { badRequest, notFound } from "../utils/errors.js";
import { planLimits } from "../services/limits.js";

const router = Router();

router.get(
  "/plans",
  asyncHandler(async (_req, res) => {
    res.json({
      plans: [
        {
          id: "FREE",
          name: "Free",
          priceMonthlyUsd: 0,
          features: ["Up to 3 reports/month", "10 pages max", "Crossref + Semantic Scholar sources"],
          limits: planLimits("FREE"),
        },
        {
          id: "PREMIUM",
          name: "Premium",
          priceMonthlyUsd: 19,
          features: ["200 reports/month", "60 pages max", "Custom DOCX templates", "Priority queue"],
          limits: planLimits("PREMIUM"),
        },
      ],
      stripeEnabled: isStripeEnabled(),
    });
  }),
);

router.post(
  "/checkout",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!isStripeEnabled()) throw badRequest("Stripe not configured");
    const stripe = getStripe();
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw notFound();

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: env.STRIPE_PREMIUM_PRICE_ID, quantity: 1 }],
      success_url: `${env.FRONTEND_URL}/dashboard?checkout=success`,
      cancel_url: `${env.FRONTEND_URL}/dashboard?checkout=cancel`,
      allow_promotion_codes: true,
    });

    res.json({ url: session.url });
  }),
);

router.post(
  "/portal",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!isStripeEnabled()) throw badRequest("Stripe not configured");
    const stripe = getStripe();
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user?.stripeCustomerId) throw badRequest("No Stripe customer for this user");
    const portal = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${env.FRONTEND_URL}/dashboard`,
    });
    res.json({ url: portal.url });
  }),
);

export default router;
