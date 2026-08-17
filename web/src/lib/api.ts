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
