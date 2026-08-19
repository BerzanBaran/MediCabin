import type { ReactNode } from "react";
import {
  IconBook,
  IconCalendar,
  IconCamera,
  IconChart,
  IconGrid,
  IconHelp,
  IconLayers,
  IconLink,
  IconNote,
  IconPulse,
  IconShield,
  IconUser,
} from "./icons";
import { useLanguage } from "../lib/i18n";
import type { GuideView } from "../screens/GuideScreen";

interface GuideSidebarProps {
  active: GuideView;
  onSelect: (view: GuideView) => void;
}

export default function GuideSidebar({ active, onSelect }: GuideSidebarProps) {
  const { t } = useLanguage();

  const mainItems: { id: GuideView; icon: ReactNode; label: string }[] = [
    { id: "panel", icon: <IconGrid size={18} />, label: t.guide_nav_panel },
    { id: "profile", icon: <IconUser size={18} />, label: t.guide_nav_profile },
    { id: "guide", icon: <IconBook size={18} />, label: t.guide_nav_guide },
    { id: "my-meds", icon: <IconLink size={18} />, label: t.guide_nav_my_meds },
    { id: "qa", icon: <IconHelp size={18} />, label: t.guide_nav_qa },
    { id: "photo", icon: <IconCamera size={18} />, label: t.guide_nav_photo },
  ];

  const trackItems: { id: GuideView; icon: ReactNode; label: string }[] = [
    { id: "notes", icon: <IconNote size={18} />, label: t.guide_nav_notes },
    { id: "analysis", icon: <IconChart size={18} />, label: t.guide_nav_analysis },
    { id: "symptom", icon: <IconPulse size={18} />, label: t.guide_nav_symptom },
    { id: "calendar", icon: <IconCalendar size={18} />, label: t.guide_nav_calendar },
    { id: "side-effects", icon: <IconNote size={18} />, label: t.guide_nav_side_effects },
  ];

  return (
    <aside className="guide-sidebar">
      <div className="guide-sidebar__header">
        <div className="guide-sidebar__icon">
          <IconPulse size={22} />
        </div>
        <div>
          <div className="guide-sidebar__title">{t.guide_header_title}</div>
          <div className="guide-sidebar__subtitle">{t.guide_header_subtitle}</div>
        </div>
      </div>

      <div className="guide-sidebar__badge">{t.guide_badge_local}</div>

      <nav className="guide-sidebar__nav">
        <div className="guide-sidebar__group-label">{t.guide_nav_group_main}</div>
        {mainItems.map((item) => (
          <button
            key={item.id}
            className={`guide-sidebar__item ${active === item.id ? "guide-sidebar__item--active" : ""}`}
            onClick={() => onSelect(item.id)}
          >
            {item.icon}
            {item.label}
          </button>
        ))}

        <div className="guide-sidebar__group-label">{t.guide_nav_group_track}</div>
        {trackItems.map((item) => (
          <button
            key={item.id}
            className={`guide-sidebar__item ${active === item.id ? "guide-sidebar__item--active" : ""}`}
            onClick={() => onSelect(item.id)}
          >
            {item.icon}
            {item.label}
          </button>
        ))}

        <div className="guide-sidebar__group-label">{t.guide_nav_group_safety}</div>
        <button
          className={`guide-sidebar__item ${active === "interactions" ? "guide-sidebar__item--active" : ""}`}
          onClick={() => onSelect("interactions")}
        >
          <IconShield size={18} />
          {t.guide_nav_interactions}
        </button>
        <button
          className={`guide-sidebar__item ${active === "polypharmacy" ? "guide-sidebar__item--active" : ""}`}
          onClick={() => onSelect("polypharmacy")}
        >
          <IconLayers size={18} />
          {t.guide_nav_polypharmacy}
        </button>
      </nav>
    </aside>
  );
}
