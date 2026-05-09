import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs/promises";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { badRequest, notFound } from "../utils/errors.js";
import { prisma } from "../config/prisma.js";
import { uploadDir } from "../utils/storage.js";
import { analyzeAndStoreTemplate } from "../services/pipeline/runner.js";

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ].includes(file.mimetype);
    if (!ok) cb(new Error("Only PDF and DOCX files are allowed"));
    else cb(null, true);
  },
});

const router = Router();

router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const templates = await prisma.template.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
    });
    res.json({ templates });
  }),
);

router.post(
  "/",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) throw badRequest("file is required");
    const meta = z
      .object({ name: z.string().max(120).optional(), useAi: z.coerce.boolean().optional() })
      .parse(req.body ?? {});
    const t = await analyzeAndStoreTemplate({
      userId: req.user!.id,
      filePath: req.file.path,
      mime: req.file.mimetype,
      size: req.file.size,
      originalFilename: req.file.originalname,
      name: meta.name ?? req.file.originalname,
      storageRelPath: path.relative(process.cwd(), req.file.path),
      useAi: meta.useAi ?? true,
    });
    res.json({ template: t });
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const t = await prisma.template.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });
    if (!t) throw notFound();
    res.json({ template: t });
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const t = await prisma.template.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });
    if (!t) throw notFound();
    await prisma.template.delete({ where: { id: t.id } });
    try {
      await fs.unlink(path.resolve(t.storagePath));
    } catch {
      // ignore
    }
    res.json({ ok: true });
  }),
);

export default router;
