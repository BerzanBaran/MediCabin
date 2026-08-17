import type { Med } from "../lib/api";

interface MedCardProps {
  med: Med;
}

export default function MedCard({ med }: MedCardProps) {
  return (
    <div className="med-card">
      <div className="med-card__name">{med.drug_name}</div>
      <div className="med-card__meta">
        {med.source_file} · {med.chunk_count} parça
      </div>
    </div>
  );
}
