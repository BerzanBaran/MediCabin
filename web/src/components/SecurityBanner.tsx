import type { RiskLevel } from "../lib/api";
import { useLanguage } from "../lib/i18n";

interface SecurityBannerProps {
  riskLevel: RiskLevel;
  totalDrugs: number;
  interactionCount: number;
  duplicateCount: number;
  onClick?: () => void;
}

const RISK_KEY: Record<RiskLevel, "risk_low" | "risk_medium" | "risk_high"> = {
  low: "risk_low",
  medium: "risk_medium",
  high: "risk_high",
};

export default function SecurityBanner({
  riskLevel,
  totalDrugs,
  interactionCount,
  duplicateCount,
  onClick,
}: SecurityBannerProps) {
  const { t } = useLanguage();

  return (
    <button className={`security-banner security-banner--${riskLevel}`} onClick={onClick} type="button">
      <div>
        <div className="security-banner__title">
          {t.panel_security_prefix} {t[RISK_KEY[riskLevel]]}
        </div>
        <div className="security-banner__summary">
          {t.panel_security_summary(totalDrugs, interactionCount, duplicateCount)}
        </div>
      </div>
      <span className="security-banner__arrow">→</span>
    </button>
  );
}
