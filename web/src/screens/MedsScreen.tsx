import { useEffect, useState } from "react";
import MedCard from "../components/MedCard";
import { getMeds, type Med } from "../lib/api";
import { useLanguage } from "../lib/i18n";

export default function MedsScreen() {
  const { t } = useLanguage();
  const [meds, setMeds] = useState<Med[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMeds()
      .then(setMeds)
      .catch((err) => setError(err instanceof Error ? err.message : t.unknown_error))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <p className="meds-screen__hint">{t.meds_loading}</p>;
  if (error) return <p className="chat-screen__error">{error}</p>;
  if (meds.length === 0) return <p className="meds-screen__hint">{t.meds_empty}</p>;

  return (
    <div className="meds-screen">
      {meds.map((med) => (
        <MedCard key={med.source_file} med={med} />
      ))}
    </div>
  );
}
