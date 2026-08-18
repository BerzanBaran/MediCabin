import { useLanguage } from "../lib/i18n";

interface InteractionBannerProps {
  matchedDrugs: string[];
}

export default function InteractionBanner({ matchedDrugs }: InteractionBannerProps) {
  const { t } = useLanguage();

  return (
    <div className="interaction-banner" role="alert">
      <strong>{t.interaction_title}</strong>
      <p>{t.interaction_body(matchedDrugs.join(` ${t.interaction_and} `))}</p>
    </div>
  );
}
