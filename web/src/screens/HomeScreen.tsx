import FeatureCard from "../components/FeatureCard";
import {
  IconBook,
  IconCalendar,
  IconCamera,
  IconChart,
  IconHelp,
  IconNote,
  IconPulse,
  IconShield,
  IconUser,
} from "../components/icons";
import { useLanguage } from "../lib/i18n";
import type { GuideView } from "./GuideScreen";

interface HomeScreenProps {
  onNavigate: (tab: "chat" | "meds" | "guide", guideView?: GuideView) => void;
}

export default function HomeScreen({ onNavigate }: HomeScreenProps) {
  const { t } = useLanguage();

  return (
    <div className="home-screen">
      <section className="home-hero">
        <div className="home-hero__icon">
          <IconPulse size={28} />
        </div>
        <h2 className="home-hero__title">
          {t.hero_title_1} <span className="home-hero__title-accent">{t.hero_title_2}</span>
        </h2>
        <p className="home-hero__subtitle">{t.hero_subtitle}</p>

        <div className="home-hero__badges">
          <span className="home-badge">{t.badge_offline}</span>
          <span className="home-badge">{t.badge_local}</span>
          <span className="home-badge">{t.badge_sourced}</span>
        </div>

        <div className="home-hero__actions">
          <button className="home-cta home-cta--primary" onClick={() => onNavigate("chat")}>
            {t.cta_start} →
          </button>
          <button className="home-cta home-cta--secondary" onClick={() => onNavigate("guide")}>
            {t.cta_guide}
          </button>
        </div>
      </section>

      <section className="home-grid">
        <FeatureCard
          icon={<IconUser />}
          title={t.card_profile_title}
          description={t.card_profile_desc}
          onClick={() => onNavigate("guide", "profile")}
        />
        <FeatureCard
          icon={<IconBook />}
          title={t.card_guide_title}
          description={t.card_guide_desc}
          onClick={() => onNavigate("guide")}
        />
        <FeatureCard
          icon={<IconHelp />}
          title={t.card_qa_title}
          description={t.card_qa_desc}
          onClick={() => onNavigate("chat")}
        />
        <FeatureCard
          icon={<IconNote />}
          title={t.card_notes_title}
          description={t.card_notes_desc}
          onClick={() => onNavigate("guide", "notes")}
        />
        <FeatureCard
          icon={<IconChart />}
          title={t.card_analysis_title}
          description={t.card_analysis_desc}
          onClick={() => onNavigate("guide", "analysis")}
        />
        <FeatureCard
          icon={<IconPulse />}
          title={t.card_symptom_title}
          description={t.card_symptom_desc}
          onClick={() => onNavigate("guide", "symptom")}
        />
        <FeatureCard
          icon={<IconShield />}
          title={t.card_safety_title}
          description={t.card_safety_desc}
          onClick={() => onNavigate("guide", "interactions")}
        />
        <FeatureCard
          icon={<IconCamera />}
          title={t.card_photo_title}
          description={t.card_photo_desc}
          onClick={() => onNavigate("guide", "photo")}
        />
        <FeatureCard
          icon={<IconCalendar />}
          title={t.card_calendar_title}
          description={t.card_calendar_desc}
          onClick={() => onNavigate("guide", "calendar")}
        />
      </section>
    </div>
  );
}
