import type { Med } from "../lib/api";
import { useLanguage } from "../lib/i18n";

interface MedCardProps {
  med: Med;
}

export default function MedCard({ med }: MedCardProps) {
  const { t } = useLanguage();

  return (
    <div className="med-card">
      <div className="med-card__name">{med.drug_name}</div>
      <div className="med-card__meta">
        {med.source_file} · {med.chunk_count} {t.meds_chunks}
      </div>
    </div>
  );
}
