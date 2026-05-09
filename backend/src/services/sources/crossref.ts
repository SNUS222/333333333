import axios from "axios";
import type { SourceRef } from "../ai/types.js";

interface CrossrefAuthor {
  given?: string;
  family?: string;
}
interface CrossrefItem {
  DOI?: string;
  title?: string[];
  author?: CrossrefAuthor[];
  issued?: { "date-parts"?: number[][] };
  "container-title"?: string[];
  URL?: string;
  abstract?: string;
}
interface CrossrefResponse {
  message?: { items?: CrossrefItem[] };
}

export async function searchCrossref(query: string, rows = 8): Promise<SourceRef[]> {
  try {
    const { data } = await axios.get<CrossrefResponse>("https://api.crossref.org/works", {
      params: { query, rows, select: "DOI,title,author,issued,container-title,URL,abstract" },
      timeout: 10_000,
      headers: { "User-Agent": "RefMaster-AI/0.1 (mailto:hello@refmaster.ai)" },
    });
    const items = data.message?.items ?? [];
    return items.map((it, idx) => ({
      id: `cr-${it.DOI ?? idx}`,
      title: it.title?.[0] ?? "Untitled",
      authors: (it.author ?? [])
        .map((a) => [a.given, a.family].filter(Boolean).join(" "))
        .filter(Boolean) as string[],
      year: it.issued?.["date-parts"]?.[0]?.[0],
      venue: it["container-title"]?.[0],
      url: it.URL,
      doi: it.DOI,
      abstract: it.abstract?.replace(/<[^>]+>/g, ""),
      source: "crossref" as const,
    }));
  } catch {
    return [];
  }
}
