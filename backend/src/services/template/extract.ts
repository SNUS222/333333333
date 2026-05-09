import fs from "node:fs/promises";
import mammoth from "mammoth";
import pdfParse from "pdf-parse";

export interface ExtractedDoc {
  text: string;
  html?: string;
  pages?: number;
  rawFontHints: string[];
}

export async function extractFromFile(filePath: string, mime: string): Promise<ExtractedDoc> {
  const buf = await fs.readFile(filePath);
  if (mime.includes("pdf") || filePath.toLowerCase().endsWith(".pdf")) {
    const result = await pdfParse(buf);
    return { text: result.text, pages: result.numpages, rawFontHints: [] };
  }
  if (
    mime.includes("officedocument.wordprocessingml") ||
    mime.includes("msword") ||
    filePath.toLowerCase().endsWith(".docx")
  ) {
    const [textRes, htmlRes] = await Promise.all([
      mammoth.extractRawText({ buffer: buf }),
      mammoth.convertToHtml({ buffer: buf }),
    ]);
    const fontHints = Array.from(
      htmlRes.value.matchAll(/font-family:\s*([^;"']+)/gi),
    ).map((m) => m[1].trim());
    return { text: textRes.value, html: htmlRes.value, rawFontHints: fontHints };
  }
  // fallback: treat as plain text
  return { text: buf.toString("utf-8"), rawFontHints: [] };
}
