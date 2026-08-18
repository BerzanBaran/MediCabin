const KEY = "ilac-dolabi-profiles";

export interface Profile {
  id: string;
  name: string;
  age: number;
  gender: "kadin" | "erkek";
  conditions: string[];
  allergies: string[];
  note?: string;
}

const SAMPLE_PROFILES: Omit<Profile, "id">[] = [
  {
    name: "Ayşe Yılmaz",
    age: 58,
    gender: "kadin",
    conditions: ["Tip 2 Diyabet", "Hipertansiyon"],
    allergies: ["Penisilin"],
    note: "Düzenli olarak Glucophage ve Beloc kullanıyor.",
  },
  {
    name: "Mehmet Demir",
    age: 45,
    gender: "erkek",
    conditions: ["Yüksek Kolesterol", "Reflü (GERD)"],
    allergies: [],
    note: "Lipitor ve Nexium kullanıyor.",
  },
  {
    name: "Fatma Kaya",
    age: 34,
    gender: "kadin",
    conditions: ["Migren", "Mevsimsel Alerji"],
    allergies: ["Polen", "İbuprofen"],
    note: "Ağrı kesici olarak Parol tercih ediyor, ibuprofen içerikli ilaçlardan kaçınıyor.",
  },
  {
    name: "Ali Şahin",
    age: 67,
    gender: "erkek",
    conditions: ["Atriyal Fibrilasyon", "Osteoartrit"],
    allergies: [],
    note: "Coumadin kullanıyor, düzenli INR takibi yapılıyor.",
  },
  {
    name: "Zeynep Arslan",
    age: 29,
    gender: "kadin",
    conditions: ["Tekrarlayan Sinüzit"],
    allergies: ["Aspirin"],
    note: "Son sinüzit atağında Augmentin kullandı.",
  },
];

export function getProfiles(): Profile[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Profile[]) : [];
  } catch {
    return [];
  }
}

function saveAll(profiles: Profile[]): void {
  localStorage.setItem(KEY, JSON.stringify(profiles));
}

export function addProfile(profile: Omit<Profile, "id">): void {
  const profiles = getProfiles();
  profiles.push({ ...profile, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` });
  saveAll(profiles);
}

export function removeProfile(id: string): void {
  saveAll(getProfiles().filter((p) => p.id !== id));
}

/** Idempotent — only seeds the 5 sample profiles if none exist yet. */
export function seedSampleProfilesIfEmpty(): void {
  if (getProfiles().length > 0) return;
  const seeded = SAMPLE_PROFILES.map((p, i) => ({ ...p, id: `seed-${i}` }));
  saveAll(seeded);
}
