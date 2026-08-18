const KEY = "ilac-dolabi-usage-log";

export type UsageStatus = "aldim" | "atladim" | "gecikti" | "sorun";

export interface UsageEntry {
  date: string; // YYYY-MM-DD
  drugName: string;
  status: UsageStatus;
}

export function getUsageLog(): UsageEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as UsageEntry[]) : [];
  } catch {
    return [];
  }
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function setUsageStatus(date: string, drugName: string, status: UsageStatus): void {
  const log = getUsageLog().filter((e) => !(e.date === date && e.drugName === drugName));
  log.push({ date, drugName, status });
  localStorage.setItem(KEY, JSON.stringify(log));
}

export function getStatusFor(log: UsageEntry[], date: string, drugName: string): UsageStatus | null {
  return log.find((e) => e.date === date && e.drugName === drugName)?.status ?? null;
}

export interface DayCounts {
  date: string;
  aldim: number;
  atladim: number;
  gecikti: number;
  sorun: number;
}

export function countsByDay(log: UsageEntry[], days: number): DayCounts[] {
  const byDate = new Map<string, DayCounts>();
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    byDate.set(key, { date: key, aldim: 0, atladim: 0, gecikti: 0, sorun: 0 });
  }
  for (const entry of log) {
    const bucket = byDate.get(entry.date);
    if (bucket) bucket[entry.status] += 1;
  }
  return Array.from(byDate.values());
}
