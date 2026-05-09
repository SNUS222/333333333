import { chatJson } from "./openai.js";
import type { ReportOutline, ReportParams } from "./types.js";
import type { TopicAnalysis } from "./topicAnalyzer.js";

const WORDS_PER_PAGE = 280;

export async function planOutline(
  params: ReportParams,
  analysis: TopicAnalysis,
): Promise<ReportOutline> {
  const totalWords = params.pages * WORDS_PER_PAGE;
  const system = `You are an academic essay planner. Build a detailed outline that fills approximately the requested word count.

Return strict JSON:
{
  "title": string,
  "introductionSummary": string,
  "sections": [
    {
      "title": string,
      "summary": string,
      "targetWords": number,
      "subsections": [{ "title": string, "summary": string, "targetWords": number }]
    }
  ],
  "conclusionSummary": string,
  "estimatedTotalWords": number
}
Distribute words such that introduction ~10%, conclusion ~10%, body ~80%.
Write all values in the requested language.`;

  const user = `Topic (refined): ${analysis.refinedTopic}
Original topic: ${params.topic}
Discipline: ${params.discipline}
Language: ${params.language}
Pages: ${params.pages} (~${totalWords} words total)
Difficulty: ${params.difficulty}
Key concepts: ${analysis.keyConcepts.join(", ")}
Suggested angle: ${analysis.suggestedAngle}
Requirements: ${params.requirements ?? "none"}

Produce the outline JSON.`;

  return chatJson<ReportOutline>({ system, user, temperature: 0.5 });
}
