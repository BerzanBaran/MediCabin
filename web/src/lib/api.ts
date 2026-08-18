import { getServerUrl } from "./storage";

export interface Med {
  drug_name: string;
  source_file: string;
  chunk_count: number;
}

export interface ChatSource {
  drug_name: string;
  source_file: string;
  section_title: string;
  page_number: number;
  snippet: string;
}

export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
  interaction_warning: boolean;
  matched_drugs: string[];
  disclaimer: string;
}

export type RiskLevel = "low" | "medium" | "high";

export interface DrugPair {
  drug_a: string;
  drug_b: string;
}

export interface DuplicateGroup {
  active_ingredient: string;
  drugs: string[];
}

export interface SafetyScan {
  total_drugs: number;
  interaction_count: number;
  duplicate_count: number;
  risk_level: RiskLevel;
  interacting_pairs: DrugPair[];
  duplicate_groups: DuplicateGroup[];
}

export interface SymptomMatch {
  drug_name: string;
  section_title: string;
  page_number: number;
  snippet: string;
  direct_match: boolean;
  score: number;
}

export interface SymptomCheckResponse {
  symptom: string;
  matches: SymptomMatch[];
  checked_drugs: string[];
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${getServerUrl()}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`İstek başarısız (${res.status}): ${detail}`);
  }
  return res.json() as Promise<T>;
}

export function getMeds(): Promise<Med[]> {
  return request<Med[]>("/meds");
}

export function postChat(question: string, topK?: number): Promise<ChatResponse> {
  return request<ChatResponse>("/chat", {
    method: "POST",
    body: JSON.stringify({ question, top_k: topK }),
  });
}

export function checkHealth(): Promise<{ status: string; index_loaded: boolean }> {
  return request("/health");
}

export function getSafetyScan(): Promise<SafetyScan> {
  return request<SafetyScan>("/meds/safety-scan");
}

export function postSymptomCheck(symptom: string): Promise<SymptomCheckResponse> {
  return request<SymptomCheckResponse>("/symptom-check", {
    method: "POST",
    body: JSON.stringify({ symptom }),
  });
}

export async function postTranscribe(audioBlob: Blob): Promise<{ text: string }> {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");
  const res = await fetch(`${getServerUrl()}/transcribe`, { method: "POST", body: formData });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`İstek başarısız (${res.status}): ${detail}`);
  }
  return res.json() as Promise<{ text: string }>;
}

export interface AnalysisStats {
  total_drugs: number;
  side_effect_count: number;
  usage_note_count: number;
  comment_count: number;
  avg_severity: number;
  avg_rating: number;
  taken_count: number;
  skipped_count: number;
  delayed_count: number;
  problem_count: number;
}

export function postAnalysisSummary(stats: AnalysisStats): Promise<{ summary: string }> {
  return request("/analysis-summary", {
    method: "POST",
    body: JSON.stringify(stats),
  });
}
