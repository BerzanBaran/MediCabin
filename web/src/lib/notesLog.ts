const KEY = "ilac-dolabi-notes";

export interface NoteEntry {
  id: string;
  drugName: string;
  rating: number; // 1-5, memnuniyet
  severity: number; // 1-5, ciddiyet
  comment: string;
  timestamp: string;
}

export function getNotes(): NoteEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as NoteEntry[]) : [];
  } catch {
    return [];
  }
}

export function addNote(entry: Omit<NoteEntry, "id" | "timestamp">): void {
  const notes = getNotes();
  notes.unshift({
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
  });
  localStorage.setItem(KEY, JSON.stringify(notes));
}

export function removeNote(id: string): void {
  const notes = getNotes().filter((n) => n.id !== id);
  localStorage.setItem(KEY, JSON.stringify(notes));
}

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
}
