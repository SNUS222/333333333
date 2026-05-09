import { prisma } from "../../config/prisma.js";
import { logger } from "../../config/logger.js";
import { analyzeTopic } from "../ai/topicAnalyzer.js";
import { planOutline } from "../ai/outlinePlanner.js";
import { writeReport } from "../ai/writer.js";
import { findSources } from "../sources/index.js";
import { analyzeTemplate } from "../template/analyzer.js";
import { defaultTemplateStyle, type TemplateStyle } from "../template/types.js";
import { buildDocx } from "../docx/generator.js";
import { convertDocxToPdf } from "../docx/pdf.js";
import { emitReportProgress } from "../realtime/io.js";
import type { ReportParams } from "../ai/types.js";
import type { Report, Template, ReportStatus, PipelineStage } from "@prisma/client";

interface ProgressInput {
  reportId: string;
  status?: ReportStatus;
  progress?: number;
  stage?: PipelineStage;
  message?: string;
  payload?: unknown;
}

async function progress(input: ProgressInput): Promise<void> {
  const data: { status?: ReportStatus; progress?: number } = {};
  if (input.status) data.status = input.status;
  if (typeof input.progress === "number") data.progress = input.progress;
  if (Object.keys(data).length > 0) {
    await prisma.report.update({ where: { id: input.reportId }, data });
  }
  if (input.stage && input.message) {
    await prisma.pipelineEvent.create({
      data: {
        reportId: input.reportId,
        stage: input.stage,
        message: input.message,
        payload: (input.payload ?? null) as never,
      },
    });
  }
  emitReportProgress(input.reportId, {
    reportId: input.reportId,
    status: input.status,
    progress: input.progress,
    stage: input.stage,
    message: input.message,
  });
}

export async function runReportPipeline(reportId: string): Promise<void> {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { template: true, user: true },
  });
  if (!report) throw new Error("report not found");

  await prisma.report.update({
    where: { id: reportId },
    data: { startedAt: new Date(), status: "ANALYZING", progress: 1 },
  });

  try {
    const params: ReportParams = {
      topic: report.topic,
      discipline: report.discipline,
      language: report.language,
      pages: report.pages,
      difficulty: (report.difficulty as ReportParams["difficulty"]) ?? "standard",
      requirements: report.requirements ?? undefined,
    };

    await progress({
      reportId,
      status: "ANALYZING",
      progress: 5,
      stage: "TOPIC_ANALYSIS",
      message: "Analyzing topic",
    });
    const analysis = await analyzeTopic(params);

    let style: TemplateStyle = defaultTemplateStyle;
    if (report.template) {
      await progress({
        reportId,
        progress: 15,
        stage: "TEMPLATE_ANALYSIS",
        message: "Analyzing uploaded template",
      });
      style = (report.template.styleJson as unknown as TemplateStyle) ?? defaultTemplateStyle;
    }

    await progress({
      reportId,
      status: "PLANNING",
      progress: 25,
      stage: "STRUCTURE",
      message: "Planning chapter structure",
    });
    const outline = await planOutline(params, analysis);

    await progress({
      reportId,
      status: "SEARCHING_SOURCES",
      progress: 40,
      stage: "SOURCES",
      message: "Searching scholarly sources",
    });
    const sources = await findSources({ queries: analysis.searchQueries.slice(0, 4), perQuery: 4 });

    await progress({
      reportId,
      status: "WRITING",
      progress: 50,
      stage: "WRITING",
      message: "Writing sections",
    });
    const content = await writeReport({
      params,
      outline,
      sources,
      onProgress: (current, total, label) => {
        const pct = 50 + Math.round((current / total) * 35);
        emitReportProgress(reportId, {
          reportId,
          progress: pct,
          status: "WRITING",
          stage: "WRITING",
          message: `Writing ${label}`,
        });
      },
    });

    await progress({
      reportId,
      status: "FORMATTING",
      progress: 88,
      stage: "FORMATTING",
      message: "Applying formatting",
    });

    const titleMeta = {
      discipline: report.discipline,
      language: report.language,
      institution: undefined,
      faculty: undefined,
      docType: undefined,
      studentName: report.user.name ?? undefined,
      advisor: undefined,
      city: undefined,
    };

    await progress({
      reportId,
      status: "RENDERING",
      progress: 92,
      stage: "RENDERING",
      message: "Rendering DOCX",
    });
    const docx = await buildDocx({ report: content, style, titleMeta });

    await progress({
      reportId,
      progress: 96,
      stage: "EXPORT",
      message: "Converting to PDF",
    });
    const pdfPath = await convertDocxToPdf(docx.filePath);

    await prisma.report.update({
      where: { id: reportId },
      data: {
        status: "COMPLETED",
        progress: 100,
        completedAt: new Date(),
        outlineJson: outline as unknown as object,
        sourcesJson: sources as unknown as object,
        contentJson: content as unknown as object,
        styleJson: style as unknown as object,
        docxPath: docx.filePath,
        pdfPath: pdfPath ?? undefined,
      },
    });

    await prisma.usageEvent.create({
      data: {
        userId: report.userId,
        kind: "report.completed",
        pages: report.pages,
        metadata: { reportId },
      },
    });

    emitReportProgress(reportId, {
      reportId,
      status: "COMPLETED",
      progress: 100,
      stage: "EXPORT",
      message: "Done",
    });
  } catch (err) {
    logger.error({ err, reportId }, "Pipeline failed");
    await prisma.report.update({
      where: { id: reportId },
      data: {
        status: "FAILED",
        errorMessage: err instanceof Error ? err.message : "unknown",
      },
    });
    emitReportProgress(reportId, {
      reportId,
      status: "FAILED",
      message: err instanceof Error ? err.message : "unknown",
    });
  }
}

export async function analyzeAndStoreTemplate(opts: {
  userId: string;
  filePath: string;
  mime: string;
  size: number;
  originalFilename: string;
  name: string;
  storageRelPath: string;
  useAi: boolean;
}): Promise<Template> {
  const style = await analyzeTemplate({ filePath: opts.filePath, mime: opts.mime, useAi: opts.useAi });
  const template = await prisma.template.create({
    data: {
      userId: opts.userId,
      name: opts.name,
      originalFilename: opts.originalFilename,
      mimeType: opts.mime,
      size: opts.size,
      storagePath: opts.storageRelPath,
      styleJson: style as unknown as object,
    },
  });
  return template;
}

export async function startReport(report: Report): Promise<void> {
  // fire-and-forget; real production would use a queue
  setImmediate(() => {
    runReportPipeline(report.id).catch((err) => logger.error({ err }, "pipeline crashed"));
  });
}
