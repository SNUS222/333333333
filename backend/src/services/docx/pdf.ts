import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import fs from "node:fs/promises";
import { generatedDir } from "../../utils/storage.js";
import { logger } from "../../config/logger.js";

const execFileAsync = promisify(execFile);

export async function convertDocxToPdf(docxPath: string): Promise<string | null> {
  try {
    await execFileAsync("soffice", [
      "--headless",
      "--convert-to",
      "pdf",
      "--outdir",
      generatedDir,
      docxPath,
    ], { timeout: 120_000 });
    const pdfName = path.basename(docxPath).replace(/\.docx$/i, ".pdf");
    const pdfPath = path.join(generatedDir, pdfName);
    await fs.access(pdfPath);
    return pdfPath;
  } catch (err) {
    logger.warn({ err, docxPath }, "LibreOffice DOCX->PDF conversion failed (is libreoffice installed?)");
    return null;
  }
}
