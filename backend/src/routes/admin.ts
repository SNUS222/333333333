import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../config/prisma.js";

const router = Router();
router.use(requireAuth, requireRole("ADMIN"));

router.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const [users, reports, completed, failed, premium] = await Promise.all([
      prisma.user.count(),
      prisma.report.count(),
      prisma.report.count({ where: { status: "COMPLETED" } }),
      prisma.report.count({ where: { status: "FAILED" } }),
      prisma.user.count({ where: { plan: "PREMIUM" } }),
    ]);
    const last7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentReports = await prisma.report.count({ where: { createdAt: { gte: last7 } } });
    res.json({
      users,
      premium,
      reports,
      completed,
      failed,
      recentReports,
    });
  }),
);

router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const pageSize = 50;
    const [total, items] = await Promise.all([
      prisma.user.count(),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: pageSize,
        skip: (page - 1) * pageSize,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          plan: true,
          createdAt: true,
          subscriptionStatus: true,
          _count: { select: { reports: true, templates: true } },
        },
      }),
    ]);
    res.json({ page, pageSize, total, items });
  }),
);

router.patch(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const allowed = ["role", "plan"] as const;
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (req.body && key in req.body) data[key] = req.body[key];
    }
    const user = await prisma.user.update({ where: { id: req.params.id }, data });
    res.json({ user });
  }),
);

router.get(
  "/usage",
  asyncHandler(async (_req, res) => {
    const events = await prisma.usageEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { user: { select: { id: true, email: true } } },
    });
    res.json({ events });
  }),
);

router.get(
  "/reports",
  asyncHandler(async (_req, res) => {
    const reports = await prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { id: true, email: true } } },
    });
    res.json({ reports });
  }),
);

export default router;
