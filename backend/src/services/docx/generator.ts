import {
  AlignmentType,
  Document,
  Footer,
  Header,
  HeadingLevel,
  LevelFormat,
  PageNumber,
  Paragraph,
  TabStopPosition,
  TabStopType,
  TextRun,
  Packer,
  type ISectionOptions,
  PageOrientation,
  TableOfContents,
} from "docx";
import fs from "node:fs/promises";
import path from "node:path";
import { generatedDir } from "../../utils/storage.js";
import { formatBibliographyEntry } from "../sources/index.js";
import type { ReportContent } from "../ai/types.js";
import type { TemplateStyle } from "../template/types.js";

const CM_TO_TWIPS = 567; // 1 cm = 567 twips
const PT_TO_HALF_PT = 2;

function ptToHalfPt(pt: number): number {
  return Math.round(pt * PT_TO_HALF_PT);
}

function lineSpacingToTwips(lineSpacing: number, fontSizePt: number): number {
  // Word's "line" value is in 240ths of a line; 240 = single, 360 = 1.5, 480 = double
  return Math.round(lineSpacing * 240);
}

function alignmentTypeFromString(a: "left" | "center" | "right"): typeof AlignmentType[keyof typeof AlignmentType] {
  if (a === "center") return AlignmentType.CENTER;
  if (a === "right") return AlignmentType.RIGHT;
  return AlignmentType.LEFT;
}

function bodyParagraph(text: string, style: TemplateStyle): Paragraph {
  return new Paragraph({
    spacing: {
      line: lineSpacingToTwips(style.lineSpacing, style.fontSize),
      lineRule: "auto",
      after: 120,
    },
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 720 },
    children: [
      new TextRun({
        text,
        font: style.font,
        size: ptToHalfPt(style.fontSize),
      }),
    ],
  });
}

function headingParagraph(
  text: string,
  level: 1 | 2 | 3,
  style: TemplateStyle,
  pageBreakBefore = false,
): Paragraph {
  const headingLevel =
    level === 1 ? HeadingLevel.HEADING_1 : level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3;
  const sizeOffset = level === 1 ? 0 : level === 2 ? -2 : -3;
  return new Paragraph({
    heading: headingLevel,
    pageBreakBefore,
    alignment: style.headingStyle.centered ? AlignmentType.CENTER : AlignmentType.LEFT,
    spacing: { before: 240, after: 240, line: lineSpacingToTwips(style.lineSpacing, style.fontSize), lineRule: "auto" },
    children: [
      new TextRun({
        text: style.headingStyle.uppercase ? text.toUpperCase() : text,
        bold: style.headingStyle.bold,
        font: style.font,
        size: ptToHalfPt(style.headingStyle.fontSize + sizeOffset),
      }),
    ],
  });
}

function buildTitlePage(report: ReportContent, style: TemplateStyle, meta: TitlePageMeta): Paragraph[] {
  const big = (text: string, size: number, bold = false): Paragraph =>
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: lineSpacingToTwips(style.lineSpacing, style.fontSize), lineRule: "auto", after: 120 },
      children: [new TextRun({ text, font: style.font, size: ptToHalfPt(size), bold })],
    });
  const blank = (count = 1): Paragraph[] =>
    Array.from({ length: count }, () => new Paragraph({ children: [new TextRun(" ")] }));

  return [
    big(meta.institution ?? (meta.language?.toLowerCase().startsWith("ru") ? "МИНИСТЕРСТВО ОБРАЗОВАНИЯ" : "UNIVERSITY"), style.fontSize, true),
    big(meta.faculty ?? (meta.language?.toLowerCase().startsWith("ru") ? "Факультет" : "Faculty"), style.fontSize),
    ...blank(6),
    big(meta.docType ?? (meta.language?.toLowerCase().startsWith("ru") ? "РЕФЕРАТ" : "ESSAY"), style.fontSize + 4, true),
    big(meta.language?.toLowerCase().startsWith("ru") ? `по дисциплине: ${meta.discipline}` : `in: ${meta.discipline}`, style.fontSize),
    big(meta.language?.toLowerCase().startsWith("ru") ? `на тему: «${report.title}»` : `on: "${report.title}"`, style.fontSize, true),
    ...blank(6),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text:
            meta.language?.toLowerCase().startsWith("ru")
              ? `Выполнил(а): ${meta.studentName ?? "_____________"}`
              : `Author: ${meta.studentName ?? "_____________"}`,
          font: style.font,
          size: ptToHalfPt(style.fontSize),
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text:
            meta.language?.toLowerCase().startsWith("ru")
              ? `Проверил(а): ${meta.advisor ?? "_____________"}`
              : `Advisor: ${meta.advisor ?? "_____________"}`,
          font: style.font,
          size: ptToHalfPt(style.fontSize),
        }),
      ],
    }),
    ...blank(6),
    big(meta.city ?? "", style.fontSize),
    big(String(new Date().getFullYear()), style.fontSize),
  ];
}

function buildToc(style: TemplateStyle, language: string): Paragraph[] {
  return [
    headingParagraph(language.toLowerCase().startsWith("ru") ? "Содержание" : "Contents", 1, style, true),
    new Paragraph({
      children: [
        new TextRun({
          text: language.toLowerCase().startsWith("ru")
            ? "(Содержание обновляется автоматически в Word: F9)"
            : "(Right-click and \"Update field\" in Word to refresh)",
          italics: true,
          font: style.font,
          size: ptToHalfPt(style.fontSize - 2),
        }),
      ],
    }),
    new Paragraph({
      children: [new TableOfContents("toc", { hyperlink: true, headingStyleRange: "1-3" })],
    }),
  ];
}

export interface TitlePageMeta {
  institution?: string;
  faculty?: string;
  docType?: string;
  studentName?: string;
  advisor?: string;
  city?: string;
  discipline: string;
  language: string;
}

export interface BuildDocxInput {
  report: ReportContent;
  style: TemplateStyle;
  titleMeta: TitlePageMeta;
  outputName?: string;
}

export interface BuildDocxResult {
  filePath: string;
  fileName: string;
  bytes: number;
}

export async function buildDocx({ report, style, titleMeta, outputName }: BuildDocxInput): Promise<BuildDocxResult> {
  const language = titleMeta.language;
  const sections: ISectionOptions[] = [];

  // Section 1: title page (no page numbers)
  if (style.titlePage.detected !== false) {
    sections.push({
      properties: {
        page: {
          margin: {
            left: Math.round(style.marginLeft * CM_TO_TWIPS),
            right: Math.round(style.marginRight * CM_TO_TWIPS),
            top: Math.round(style.marginTop * CM_TO_TWIPS),
            bottom: Math.round(style.marginBottom * CM_TO_TWIPS),
          },
          size: { orientation: PageOrientation.PORTRAIT },
        },
        titlePage: true,
      },
      children: buildTitlePage(report, style, titleMeta),
    });
  }

  // Section 2: TOC + body + bibliography (page numbers from 2 onwards)
  const bodyChildren: (Paragraph | TableOfContents)[] = [];

  if (style.toc.detected !== false) {
    bodyChildren.push(...buildToc(style, language));
  }

  // Introduction
  bodyChildren.push(headingParagraph(report.introduction.title, 1, style, true));
  for (const p of report.introduction.paragraphs) bodyChildren.push(bodyParagraph(p, style));

  // Body sections
  for (const section of report.body) {
    bodyChildren.push(headingParagraph(section.title, section.level, style, section.level === 1));
    for (const p of section.paragraphs) bodyChildren.push(bodyParagraph(p, style));
  }

  // Conclusion
  bodyChildren.push(headingParagraph(report.conclusion.title, 1, style, true));
  for (const p of report.conclusion.paragraphs) bodyChildren.push(bodyParagraph(p, style));

  // References
  if (report.references.length > 0) {
    bodyChildren.push(
      headingParagraph(
        language.toLowerCase().startsWith("ru") ? "Список литературы" : "References",
        1,
        style,
        true,
      ),
    );
    report.references.forEach((ref, idx) => {
      bodyChildren.push(
        new Paragraph({
          spacing: {
            line: lineSpacingToTwips(style.lineSpacing, style.fontSize),
            lineRule: "auto",
            after: 80,
          },
          children: [
            new TextRun({
              text: formatBibliographyEntry(ref, idx + 1),
              font: style.font,
              size: ptToHalfPt(style.fontSize),
            }),
          ],
        }),
      );
    });
  }

  sections.push({
    properties: {
      page: {
        margin: {
          left: Math.round(style.marginLeft * CM_TO_TWIPS),
          right: Math.round(style.marginRight * CM_TO_TWIPS),
          top: Math.round(style.marginTop * CM_TO_TWIPS),
          bottom: Math.round(style.marginBottom * CM_TO_TWIPS),
        },
      },
    },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: report.title,
                font: style.font,
                size: ptToHalfPt(style.fontSize - 2),
                italics: true,
              }),
            ],
          }),
        ],
      }),
    },
    footers: style.numbering.pageNumbers
      ? {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: alignmentTypeFromString(style.numbering.numberAlignment),
                children: [
                  new TextRun({ font: style.font, size: ptToHalfPt(style.fontSize - 2), children: [PageNumber.CURRENT] }),
                ],
              }),
            ],
          }),
        }
      : undefined,
    children: bodyChildren,
  });

  const doc = new Document({
    creator: "RefMaster AI",
    title: report.title,
    description: `Generated by RefMaster AI for discipline ${titleMeta.discipline}`,
    styles: {
      default: {
        document: {
          run: { font: style.font, size: ptToHalfPt(style.fontSize) },
        },
      },
    },
    numbering: {
      config: [
        {
          reference: "refmaster-list",
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.START,
              style: { paragraph: { indent: { left: 720, hanging: 260 } } },
            },
          ],
        },
      ],
    },
    sections,
  });

  const fileName = outputName ?? `${slug(report.title)}-${Date.now()}.docx`;
  const filePath = path.join(generatedDir, fileName);
  const buffer = await Packer.toBuffer(doc);
  await fs.writeFile(filePath, buffer);
  return { filePath, fileName, bytes: buffer.length };
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "report";
}
