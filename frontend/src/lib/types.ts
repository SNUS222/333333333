export type Plan = "FREE" | "PREMIUM";
export type Role = "USER" | "ADMIN";
export type ReportStatus =
  | "PENDING"
  | "ANALYZING"
  | "PLANNING"
  | "SEARCHING_SOURCES"
  | "WRITING"
  | "FORMATTING"
  | "RENDERING"
  | "COMPLETED"
  | "FAILED";

export interface User {
  id: string;
  email: string;
  name?: string | null;
  role: Role;
  plan: Plan;
  avatarUrl?: string | null;
  subscriptionStatus?: string | null;
  subscriptionPeriodEnd?: string | null;
}

export interface Template {
  id: string;
  name: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  styleJson: Record<string, unknown>;
  createdAt: string;
}

export interface Report {
  id: string;
  topic: string;
  discipline: string;
  language: string;
  pages: number;
  difficulty: string;
  requirements?: string | null;
  status: ReportStatus;
  progress: number;
  docxPath?: string | null;
  pdfPath?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
  template?: { id: string; name: string } | null;
}

export interface ProgressEvent {
  reportId: string;
  status?: ReportStatus;
  progress?: number;
  stage?: string;
  message?: string;
}
