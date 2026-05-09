import axios from "axios";
import { env } from "../../config/env.js";
import type { SourceRef } from "../ai/types.js";

interface S2Author { name?: string }
interface S2Paper {
  paperId?: string;
  title?: string;
  abstract?: string;
  year?: number;
  venue?: string;
  url?: string;
  externalIds?: { DOI?: string };
  authors?: S2Author[];
}
interface S2Response { data?: S2Paper[] }

export async function searchSemanticScholar(query: string, limit = 8): Promise<SourceRef[]> {
  try {
    const headers: Record<string, string> = {
      "User-Agent": "RefMaster-AI/0.1",
    };
    if (env.SEMANTIC_SCHOLAR_API_KEY) {
      headers["x-api-key"] = env.SEMANTIC_SCHOLAR_API_KEY;
    }
    const { data } = await axios.get<S2Response>(
      "https://api.semanticscholar.org/graph/v1/paper/search",
      {
        params: {
          query,
          limit,
          fields: "title,abstract,year,venue,url,externalIds,authors",
        },
        timeout: 10_000,
        headers,
      },
    );
    const items = data.data ?? [];
    return items.map((p, idx) => ({
      id: `s2-${p.paperId ?? idx}`,
      title: p.title ?? "Untitled",
      authors: (p.authors ?? []).map((a) => a.name ?? "").filter(Boolean),
      year: p.year,
      venue: p.venue,
      url: p.url,
      doi: p.externalIds?.DOI,
      abstract: p.abstract ?? undefined,
      source: "semanticscholar" as const,
    }));
  } catch {
    return [];
  }
}
