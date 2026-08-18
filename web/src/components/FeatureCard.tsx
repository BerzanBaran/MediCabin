import type { ReactNode } from "react";
import { useLanguage } from "../lib/i18n";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
  comingSoon?: boolean;
}

export default function FeatureCard({ icon, title, description, onClick, comingSoon }: FeatureCardProps) {
  const { t } = useLanguage();

  return (
    <button
      className={`feature-card ${comingSoon ? "feature-card--soon" : ""}`}
      onClick={onClick}
      type="button"
    >
      <span className="feature-card__icon">{icon}</span>
      <span className="feature-card__body">
        <span className="feature-card__title-row">
          <span className="feature-card__title">{title}</span>
          {comingSoon && <span className="feature-card__badge">{t.badge_soon}</span>}
        </span>
        <span className="feature-card__desc">{description}</span>
      </span>
    </button>
  );
}
