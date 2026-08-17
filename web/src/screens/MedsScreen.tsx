import { useEffect, useState } from "react";
import MedCard from "../components/MedCard";
import { getMeds, type Med } from "../lib/api";

export default function MedsScreen() {
  const [meds, setMeds] = useState<Med[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMeds()
      .then(setMeds)
      .catch((err) => setError(err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="meds-screen__hint">Yükleniyor…</p>;
  if (error) return <p className="chat-screen__error">{error}</p>;
  if (meds.length === 0) return <p className="meds-screen__hint">İlaç dolabınız boş.</p>;

  return (
    <div className="meds-screen">
      {meds.map((med) => (
        <MedCard key={med.source_file} med={med} />
      ))}
    </div>
  );
}
