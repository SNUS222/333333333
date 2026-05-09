import { chatJson } from "./openai.js";
import type { ReportParams } from "./types.js";

export interface TopicAnalysis {
  refinedTopic: string;
  keyConcepts: string[];
  searchQueries: string[];
  suggestedAngle: string;
}

export async function analyzeTopic(params: ReportParams): Promise<TopicAnalysis> {
  const system = `You are an academic research strategist. You receive an essay topic and produce a JSON plan describing the refined topic, key concepts, search queries to use against scholarly databases, and the most useful angle for an essay of the given length and difficulty.

Always respond with strict JSON of shape:
{
  "refinedTopic": string,
  "keyConcepts": string[],
  "searchQueries": string[],
  "suggestedAngle": string
}
Write all values in the requested language.`;

  const user = `Topic: ${params.topic}
Discipline: ${params.discipline}
Language: ${params.language}
Target pages: ${params.pages}
Difficulty: ${params.difficulty}
Extra requirements: ${params.requirements ?? "none"}

Produce the JSON analysis.`;

  return chatJson<TopicAnalysis>({ system, user, temperature: 0.4 });
}
