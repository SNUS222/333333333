import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { forbidden } from "../utils/errors.js";
import type { Plan } from "@prisma/client";

export interface PlanLimits {
  maxPages: number;
  maxReportsPerMonth: number;
}

export function planLimits(plan: Plan): PlanLimits {
  if (plan === "PREMIUM") {
    return {
      maxPages: env.PREMIUM_PLAN_PAGE_LIMIT,
      maxReportsPerMonth: env.PREMIUM_PLAN_MONTHLY_LIMIT,
    };
  }
  return {
    maxPages: env.FREE_PLAN_PAGE_LIMIT,
    maxReportsPerMonth: env.FREE_PLAN_MONTHLY_LIMIT,
  };
}

export async function assertCanCreateReport(userId: string, requestedPages: number): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw forbidden("user not found");
  const limits = planLimits(user.plan);
  if (requestedPages > limits.maxPages) {
    throw forbidden(`Page limit exceeded for plan ${user.plan} (max ${limits.maxPages})`);
  }
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);
  const used = await prisma.report.count({
    where: { userId, createdAt: { gte: startOfMonth } },
  });
  if (used >= limits.maxReportsPerMonth) {
    throw forbidden(`Monthly report limit reached for plan ${user.plan}`);
  }
}
