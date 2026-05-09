import { Router } from "express";
import { z } from "zod";
import path from "node:path";
import fs from "node:fs";
import { requireAuth } from "../middleware/auth.js";
import { generationLimiter } from "../middleware/rateLimit.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { badRequest, notFound } from "../utils/errors.js";
import { prisma } from "../config/prisma.js";
import { startReport } from "../services/pipeline/runner.js";
import { assertCanCreateReport } from "../services/limits.js";

const router = Router();
router.use(requireAuth);

const createSchema = z.object({
  topic: z.string().min(3).max(500),
  discipline: z.string().min(2).max(200),
  language: z.string().min(2).max(40).default("ru"),
  pages: z.coerce.number().int().min(1).max(120),
  difficulty: z.enum(["intro", "standard", "advanced"]).default("standard"),
  requirements: z.string().max(4000).optional(),
  templateId: z.string().optional(),
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const reports = await prisma.report.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
      include: { template: { select: { id: true, name: true } } },
    });
    res.json({ reports });
  }),
);

router.post(
  "/",
  generationLimiter,
  asyncHandler(async (req, res) => {
    const body = createSchema.parse(req.body);
    await assertCanCreateReport(req.user!.id, body.pages);
    if (body.templateId) {
      const t = await prisma.template.findFirst({
        where: { id: body.templateId, userId: req.user!.id },
      });
      if (!t) throw badRequest("template not found");
    }
    const report = await prisma.report.create({
      data: {
        userId: req.user!.id,
        topic: body.topic,
        discipline: body.discipline,
        language: body.language,
        pages: body.pages,
        difficulty: body.difficulty,
        requirements: body.requirements,
        templateId: body.templateId,
        status: "PENDING",
      },
    });
    void startReport(report);
    res.json({ report });
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const report = await prisma.report.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
      include: {
        template: { select: { id: true, name: true } },
        events: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!report) throw notFound();
    res.json({ report });
  }),
);

router.get(
  "/:id/download/:kind",
  asyncHandler(async (req, res) => {
    const kind = req.params.kind;
    if (kind !== "docx" && kind !== "pdf") throw badRequest("kind must be docx or pdf");
    const report = await prisma.report.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });
    if (!report) throw notFound();
    const filePath = kind === "docx" ? report.docxPath : report.pdfPath;
    if (!filePath || !fs.existsSync(filePath)) throw notFound("file not ready");
    res.download(filePath, path.basename(filePath));
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const report = await prisma.report.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });
    if (!report) throw notFound();
    await prisma.report.delete({ where: { id: report.id } });
    for (const p of [report.docxPath, report.pdfPath]) {
      if (p) {
        try {
          fs.unlinkSync(p);
        } catch {
          // ignore
        }
      }
    }
    res.json({ ok: true });
  }),
);

export default router;
