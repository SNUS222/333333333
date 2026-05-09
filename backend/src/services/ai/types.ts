export interface ReportParams {
  topic: string;
  discipline: string;
  language: string;
  pages: number;
  difficulty: "intro" | "standard" | "advanced";
  requirements?: string;
}

export interface OutlineSection {
  title: string;
  summary: string;
  targetWords: number;
  subsections?: OutlineSection[];
}

export interface ReportOutline {
  title: string;
  introductionSummary: string;
  sections: OutlineSection[];
  conclusionSummary: string;
  estimatedTotalWords: number;
}

export interface SourceRef {
  id: string;
  title: string;
  authors: string[];
  year?: number;
  venue?: string;
  url?: string;
  doi?: string;
  abstract?: string;
  source: "crossref" | "semanticscholar" | "manual";
}

export interface RenderedSection {
  title: string;
  level: 1 | 2 | 3;
  paragraphs: string[];
}

export interface ReportContent {
  title: string;
  introduction: RenderedSection;
  body: RenderedSection[];
  conclusion: RenderedSection;
  references: SourceRef[];
}
