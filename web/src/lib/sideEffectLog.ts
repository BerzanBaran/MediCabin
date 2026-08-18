const KEY = "ilac-dolabi-side-effect-log";

export interface LogEntry {
  id: string;
  symptom: string;
  drugName: string;
  snippet: string;
  timestamp: string;
}

export function getLog(): LogEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LogEntry[]) : [];
  } catch {
    return [];
  }
}

export function addLogEntry(entry: Omit<LogEntry, "id" | "timestamp">): void {
  const log = getLog();
  log.unshift({
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
  });
  localStorage.setItem(KEY, JSON.stringify(log));
}

export function removeLogEntry(id: string): void {
  const log = getLog().filter((e) => e.id !== id);
  localStorage.setItem(KEY, JSON.stringify(log));
}
