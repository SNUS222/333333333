import { chatJson } from "../ai/openai.js";
import { extractFromFile, type ExtractedDoc } from "./extract.js";
import { defaultTemplateStyle, type TemplateStyle } from "./types.js";

function heuristicAnalysis(doc: ExtractedDoc): TemplateStyle {
  const style: TemplateStyle = JSON.parse(JSON.stringify(defaultTemplateStyle));

  if (doc.rawFontHints.length > 0) {
    const counts = new Map<string, number>();
    for (const f of doc.rawFontHints) {
      counts.set(f, (counts.get(f) ?? 0) + 1);
    }
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    if (top) style.font = top.replace(/['"]/g, "").trim();
  }

  const upper = doc.text.toUpperCase();
  if (/СОДЕРЖАНИЕ|ОГЛАВЛЕНИЕ|TABLE OF CONTENTS|CONTENTS/.test(upper)) {
    style.toc.detected = true;
  }
  if (/МИНИСТЕРСТВО|UNIVERSITY|УНИВЕРСИТЕТ|ВЫПОЛНИЛ|STUDENT/.test(upper)) {
    style.titlePage.detected = true;
  }
  if (/\bТАБЛИЦА\b|\bTABLE\b/.test(upper)) {
    style.tablesDetected = true;
  }
  if (/\bРИС\.|\bFIGURE\b|\bРИСУНОК\b/.test(upper)) {
    style.imagesDetected = true;
  }
  return style;
}

export interface AnalyzeTemplateInput {
  filePath: string;
  mime: string;
  useAi?: boolean;
}

export async function analyzeTemplate(input: AnalyzeTemplateInput): Promise<TemplateStyle> {
  const doc = await extractFromFile(input.filePath, input.mime);
  const baseline = heuristicAnalysis(doc);
  if (!input.useAi) return baseline;

  const sample = doc.text.slice(0, 6000);
  try {
    const aiStyle = await chatJson<Partial<TemplateStyle>>({
      system: `You are a document style analyzer. Given a sample of an academic document, infer its formatting.
Return strict JSON matching this TypeScript type:
{
  "font": string,
  "fontSize": number,
  "lineSpacing": number,
  "marginLeft": number,
  "marginRight": number,
  "marginTop": number,
  "marginBottom": number,
  "headingStyle": { "bold": boolean, "uppercase": boolean, "fontSize": number, "centered": boolean },
  "numbering": { "pageNumbers": boolean, "numberAlignment": "left"|"center"|"right", "startsAt": number },
  "titlePage": { "detected": boolean, "institution": string|null, "sampleTitle": string|null, "sampleStudent": string|null },
  "toc": { "detected": boolean, "style": "numbered"|"leader-dots"|"plain" },
  "tablesDetected": boolean,
  "imagesDetected": boolean,
  "notes": string[]
}
Use centimeters for margins. If unsure, use sensible academic defaults (Times New Roman, 14pt, 1.5 spacing, 3/1.5/2/2 cm margins).`,
      user: `Document sample (truncated to 6000 chars):

${sample}`,
      temperature: 0.2,
    });
    return { ...baseline, ...aiStyle, headingStyle: { ...baseline.headingStyle, ...(aiStyle.headingStyle ?? {}) } };
  } catch {
    return baseline;
  }
}
