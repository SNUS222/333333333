import OpenAI from "openai";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";

let client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!client) {
    if (!env.OPENAI_API_KEY) {
      logger.warn("OPENAI_API_KEY is not set - AI calls will fail until configured.");
    }
    client = new OpenAI({ apiKey: env.OPENAI_API_KEY || "missing" });
  }
  return client;
}

export interface ChatOptions {
  system?: string;
  user: string;
  model?: string;
  temperature?: number;
  json?: boolean;
  maxTokens?: number;
}

export async function chat({
  system,
  user,
  model,
  temperature = 0.7,
  json = false,
  maxTokens,
}: ChatOptions): Promise<string> {
  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: model ?? env.OPENAI_MODEL,
    temperature,
    max_tokens: maxTokens,
    response_format: json ? { type: "json_object" } : undefined,
    messages: [
      ...(system ? [{ role: "system" as const, content: system }] : []),
      { role: "user" as const, content: user },
    ],
  });
  return completion.choices[0]?.message?.content ?? "";
}

export async function chatJson<T>(opts: Omit<ChatOptions, "json">): Promise<T> {
  const text = await chat({ ...opts, json: true });
  return JSON.parse(text) as T;
}
