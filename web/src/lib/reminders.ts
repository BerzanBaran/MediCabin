const REMINDERS_KEY = "ilac-dolabi-reminders";
const COMPLETIONS_KEY = "ilac-dolabi-reminder-completions";

export interface Reminder {
  id: string;
  personName: string;
  drugName: string;
  time: string; // HH:MM
}

export interface ReminderCompletion {
  reminderId: string;
  date: string; // YYYY-MM-DD
}

const SAMPLE_REMINDERS: Omit<Reminder, "id">[] = [
  { personName: "Ayşe Yılmaz", drugName: "Glucophage", time: "08:00" },
  { personName: "Ayşe Yılmaz", drugName: "Beloc", time: "08:00" },
  { personName: "Mehmet Demir", drugName: "Lipitor", time: "21:00" },
  { personName: "Fatma Kaya", drugName: "Parol", time: "12:30" },
  { personName: "Ali Şahin", drugName: "Coumadin", time: "09:00" },
  { personName: "Zeynep Arslan", drugName: "Augmentin", time: "08:00" },
  { personName: "Zeynep Arslan", drugName: "Augmentin", time: "20:00" },
];

export function getReminders(): Reminder[] {
  try {
    const raw = localStorage.getItem(REMINDERS_KEY);
    return raw ? (JSON.parse(raw) as Reminder[]) : [];
  } catch {
    return [];
  }
}

function saveReminders(reminders: Reminder[]): void {
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
}

export function addReminder(reminder: Omit<Reminder, "id">): void {
  const reminders = getReminders();
  reminders.push({ ...reminder, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` });
  saveReminders(reminders);
}

export function removeReminder(id: string): void {
  saveReminders(getReminders().filter((r) => r.id !== id));
}

/** Idempotent — only seeds if no reminders exist yet. */
export function seedSampleRemindersIfEmpty(): void {
  if (getReminders().length > 0) return;
  saveReminders(SAMPLE_REMINDERS.map((r, i) => ({ ...r, id: `seed-${i}` })));
}

export function getCompletions(): ReminderCompletion[] {
  try {
    const raw = localStorage.getItem(COMPLETIONS_KEY);
    return raw ? (JSON.parse(raw) as ReminderCompletion[]) : [];
  } catch {
    return [];
  }
}

export function isCompleted(completions: ReminderCompletion[], reminderId: string, date: string): boolean {
  return completions.some((c) => c.reminderId === reminderId && c.date === date);
}

export function toggleCompletion(reminderId: string, date: string): void {
  const completions = getCompletions();
  const exists = isCompleted(completions, reminderId, date);
  const next = exists
    ? completions.filter((c) => !(c.reminderId === reminderId && c.date === date))
    : [...completions, { reminderId, date }];
  localStorage.setItem(COMPLETIONS_KEY, JSON.stringify(next));
}

export function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}
