const KEY = "ilac-dolabi-notes";

export interface NoteEntry {
  id: string;
  drugName: string;
  rating: number; // 1-5, memnuniyet
  severity: number; // 1-5, ciddiyet
  comment: string;
  timestamp: string;
  authorName?: string;
}

const SAMPLE_NOTES: Omit<NoteEntry, "id" | "timestamp">[] = [
  {
    authorName: "Ayşe Yılmaz",
    drugName: "Glucophage",
    rating: 4,
    severity: 2,
    comment: "Kan şekerim çok daha dengeli hale geldi, ilk haftalarda hafif mide bulantısı dışında sorun yaşamadım.",
  },
  {
    authorName: "Ayşe Yılmaz",
    drugName: "Beloc",
    rating: 4,
    severity: 1,
    comment: "Tansiyonum stabil seyrediyor, günlük yaşamımı etkileyen bir yan etki yaşamadım.",
  },
  {
    authorName: "Mehmet Demir",
    drugName: "Lipitor",
    rating: 5,
    severity: 1,
    comment: "3 ayda kolesterol değerlerim normale döndü, herhangi bir yan etki hissetmedim.",
  },
  {
    authorName: "Fatma Kaya",
    drugName: "Parol",
    rating: 2,
    severity: 2,
    comment: "Migren ağrımı yeterince hafifletmedi, üstüne hafif mide rahatsızlığı da oldu.",
  },
  {
    authorName: "Ali Şahin",
    drugName: "Coumadin",
    rating: 3,
    severity: 4,
    comment: "Etkili ama doz ayarlaması zor, sık kan tahlili gerektiriyor ve günlük hayatımı biraz kısıtlıyor.",
  },
  {
    authorName: "Zeynep Arslan",
    drugName: "Augmentin",
    rating: 2,
    severity: 3,
    comment: "Enfeksiyonu geçirdi ama midem çok bozuldu, birkaç gün iştahsız kaldım.",
  },
];

export function getNotes(): NoteEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as NoteEntry[]) : [];
  } catch {
    return [];
  }
}

function saveAll(notes: NoteEntry[]): void {
  localStorage.setItem(KEY, JSON.stringify(notes));
}

export function addNote(entry: Omit<NoteEntry, "id" | "timestamp">): void {
  const notes = getNotes();
  notes.unshift({
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
  });
  saveAll(notes);
}

export function removeNote(id: string): void {
  saveAll(getNotes().filter((n) => n.id !== id));
}

/** Idempotent — only seeds the sample author comments if no notes exist yet,
 * so it doesn't clobber notes the user has already added themselves. */
export function seedSampleNotesIfEmpty(): void {
  if (getNotes().length > 0) return;
  const now = Date.now();
  const seeded = SAMPLE_NOTES.map((n, i) => ({
    ...n,
    id: `seed-${i}`,
    timestamp: new Date(now - i * 3600_000).toISOString(),
  }));
  saveAll(seeded);
}

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
}
