import type { SourceRef } from "../ai/types.js";
import { searchCrossref } from "./crossref.js";
import { searchSemanticScholar } from "./semanticScholar.js";

export interface FindSourcesInput {
  queries: string[];
  perQuery?: number;
  totalLimit?: number;
}

export async function findSources({
  queries,
  perQuery = 5,
  totalLimit = 18,
}: FindSourcesInput): Promise<SourceRef[]> {
  const all: SourceRef[] = [];
  const seen = new Set<string>();
  for (const q of queries) {
    const [cr, s2] = await Promise.all([
      searchCrossref(q, perQuery),
      searchSemanticScholar(q, perQuery),
    ]);
    for (const ref of [...cr, ...s2]) {
      const key = ref.doi ?? ref.url ?? `${ref.title}|${ref.authors.join(",")}`;
      if (seen.has(key)) continue;
      seen.add(key);
      all.push(ref);
      if (all.length >= totalLimit) return all;
    }
  }
  return all;
}

export function formatBibliographyEntry(ref: SourceRef, index: number): string {
  const authors = ref.authors.length > 0 ? ref.authors.slice(0, 6).join(", ") : "Unknown author";
  const year = ref.year ? ` (${ref.year})` : "";
  const venue = ref.venue ? ` ${ref.venue}.` : "";
  const doi = ref.doi ? ` doi: ${ref.doi}` : ref.url ? ` ${ref.url}` : "";
  return `${index}. ${authors}${year}. ${ref.title}.${venue}${doi}`;
}
