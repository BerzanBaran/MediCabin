const KEY = "ilac-dolabi-schedule";

export type ScheduleMap = Record<string, string[]>;

export function getSchedule(): ScheduleMap {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ScheduleMap) : {};
  } catch {
    return {};
  }
}

export function setDrugTimes(drugName: string, times: string[]): void {
  const schedule = getSchedule();
  const cleaned = times.map((t) => t.trim()).filter(Boolean);
  if (cleaned.length === 0) {
    delete schedule[drugName];
  } else {
    schedule[drugName] = cleaned;
  }
  localStorage.setItem(KEY, JSON.stringify(schedule));
}

export interface TimeSlot {
  time: string;
  drugNames: string[];
}

export function groupByTime(schedule: ScheduleMap): TimeSlot[] {
  const byTime = new Map<string, string[]>();
  for (const [drugName, times] of Object.entries(schedule)) {
    for (const time of times) {
      const list = byTime.get(time) ?? [];
      list.push(drugName);
      byTime.set(time, list);
    }
  }
  return Array.from(byTime.entries())
    .map(([time, drugNames]) => ({ time, drugNames }))
    .sort((a, b) => a.time.localeCompare(b.time));
}
