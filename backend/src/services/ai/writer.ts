import { chat } from "./openai.js";
import type {
  RenderedSection,
  ReportContent,
  ReportOutline,
  ReportParams,
  SourceRef,
} from "./types.js";

const WORDS_PER_PARAGRAPH = 110;

function citationsBlock(sources: SourceRef[]): string {
  if (sources.length === 0) return "(no external sources available; cite only generally)";
  return sources
    .slice(0, 12)
    .map(
      (s, i) =>
        `[${i + 1}] ${s.authors.slice(0, 3).join(", ")}${s.authors.length > 3 ? " et al." : ""}${
          s.year ? ` (${s.year})` : ""
        }. ${s.title}.${s.venue ? ` ${s.venue}.` : ""}${s.doi ? ` doi:${s.doi}` : ""}`,
    )
    .join("\n");
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

async function writeSectionBody(
  params: ReportParams,
  outline: ReportOutline,
  sectionTitle: string,
  sectionSummary: string,
  targetWords: number,
  sources: SourceRef[],
): Promise<string[]> {
  const system = `You are an expert academic writer. Write in clear, formal academic prose in the requested language.
- Use neutral, objective tone.
- Connect ideas with smooth transitions.
- Use inline numbered citations like [1], [3] referencing the provided sources where appropriate.
- Do NOT invent citation numbers beyond the supplied list.
- Do NOT include the section heading in your output - only the body paragraphs.
- Separate paragraphs with a blank line.`;

  const user = `Essay topic: ${outline.title}
Discipline: ${params.discipline}
Language: ${params.language}
Difficulty: ${params.difficulty}

Section to write: "${sectionTitle}"
Section goal/summary: ${sectionSummary}
Target length: ~${targetWords} words (${Math.max(2, Math.round(targetWords / WORDS_PER_PARAGRAPH))} paragraphs)

Available sources:
${citationsBlock(sources)}

Write the section body now.`;

  const text = await chat({
    system,
    user,
    temperature: 0.75,
    maxTokens: Math.min(4000, Math.ceil(targetWords * 2.2)),
  });
  return splitParagraphs(text);
}

async function writeIntroduction(
  params: ReportParams,
  outline: ReportOutline,
  sources: SourceRef[],
): Promise<RenderedSection> {
  const target = Math.round(outline.estimatedTotalWords * 0.1);
  const system = `You are an expert academic writer. Produce only the introduction body for an academic essay in the requested language.
- State the topic, motivation, scope, and roadmap.
- 2-4 paragraphs, separated by blank lines.
- You may reference sources with inline numbered citations like [1].`;
  const user = `Title: ${outline.title}
Discipline: ${params.discipline}
Language: ${params.language}
Outline summary of introduction goal: ${outline.introductionSummary}
Body sections (titles): ${outline.sections.map((s) => s.title).join("; ")}
Target words: ~${target}

Available sources:
${citationsBlock(sources)}

Write the introduction now.`;
  const text = await chat({ system, user, temperature: 0.7, maxTokens: 1800 });
  return { title: params.language.toLowerCase().startsWith("ru") ? "Введение" : "Introduction", level: 1, paragraphs: splitParagraphs(text) };
}

async function writeConclusion(
  params: ReportParams,
  outline: ReportOutline,
  body: RenderedSection[],
): Promise<RenderedSection> {
  const target = Math.round(outline.estimatedTotalWords * 0.1);
  const system = `You are an expert academic writer. Produce only the conclusion body for an academic essay in the requested language.
- Synthesize main findings, restate significance, suggest open questions.
- 2-3 paragraphs, separated by blank lines.`;
  const bodyDigest = body
    .map((s) => `${s.title}: ${s.paragraphs[0]?.slice(0, 240) ?? ""}`)
    .join("\n");
  const user = `Title: ${outline.title}
Discipline: ${params.discipline}
Language: ${params.language}
Conclusion goal: ${outline.conclusionSummary}
Target words: ~${target}

Body digest:
${bodyDigest}

Write the conclusion now.`;
  const text = await chat({ system, user, temperature: 0.6, maxTokens: 1500 });
  return { title: params.language.toLowerCase().startsWith("ru") ? "Заключение" : "Conclusion", level: 1, paragraphs: splitParagraphs(text) };
}

export interface WriteReportInput {
  params: ReportParams;
  outline: ReportOutline;
  sources: SourceRef[];
  onProgress?: (current: number, total: number, label: string) => void;
}

export async function writeReport({
  params,
  outline,
  sources,
  onProgress,
}: WriteReportInput): Promise<ReportContent> {
  const totalSteps = outline.sections.length + 2;
  let step = 0;

  const introduction = await writeIntroduction(params, outline, sources);
  onProgress?.(++step, totalSteps, "introduction");

  const body: RenderedSection[] = [];
  for (const section of outline.sections) {
    const paragraphs = await writeSectionBody(
      params,
      outline,
      section.title,
      section.summary,
      section.targetWords,
      sources,
    );
    const rendered: RenderedSection = { title: section.title, level: 1, paragraphs };
    body.push(rendered);

    if (section.subsections && section.subsections.length > 0) {
      for (const sub of section.subsections) {
        const subParas = await writeSectionBody(
          params,
          outline,
          sub.title,
          sub.summary,
          sub.targetWords,
          sources,
        );
        body.push({ title: sub.title, level: 2, paragraphs: subParas });
      }
    }

    onProgress?.(++step, totalSteps, `section: ${section.title}`);
  }

  const conclusion = await writeConclusion(params, outline, body);
  onProgress?.(++step, totalSteps, "conclusion");

  return { title: outline.title, introduction, body, conclusion, references: sources };
}
