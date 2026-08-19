import { useEffect, useState } from "react";
import FeatureCard from "../components/FeatureCard";
import GuideSidebar from "../components/GuideSidebar";
import { IconLayers, IconPulse, IconSearch, IconShield } from "../components/icons";
import MedCard from "../components/MedCard";
import { getMeds, getSafetyScan, type Med, type SafetyScan } from "../lib/api";
import { useLanguage } from "../lib/i18n";
import { getSchedule, groupByTime, setDrugTimes, type ScheduleMap } from "../lib/schedule";
import AnalysisView from "./AnalysisView";
import ChatScreen from "./ChatScreen";
import SecurityBanner from "../components/SecurityBanner";
import SideEffectLogView from "./SideEffectLogView";
import NotesView from "./NotesView";
import ProfileView from "./ProfileView";
import SymptomCheckView from "./SymptomCheckView";

export type GuideView =
  | "panel"
  | "profile"
  | "guide"
  | "my-meds"
  | "qa"
  | "notes"
  | "analysis"
  | "symptom"
  | "calendar"
  | "side-effects"
  | "interactions"
  | "polypharmacy";

const SOON_VIEWS: GuideView[] = ["calendar"];

function ComingSoon() {
  const { t } = useLanguage();
  return (
    <div className="guide-panel">
      <p className="chat-screen__hint">{t.soon_body}</p>
    </div>
  );
}

interface GuideScreenProps {
  initialView?: GuideView;
}

export default function GuideScreen({ initialView }: GuideScreenProps) {
  const { t } = useLanguage();
  const [view, setView] = useState<GuideView>(initialView ?? "panel");
  const [meds, setMeds] = useState<Med[]>([]);
  const [scan, setScan] = useState<SafetyScan | null>(null);
  const [schedule, setSchedule] = useState<ScheduleMap>(getSchedule());
  const [searchValue, setSearchValue] = useState("");
  const [qaInitialQuestion, setQaInitialQuestion] = useState<string | undefined>(undefined);

  useEffect(() => {
    getMeds().then(setMeds).catch(() => {});
    getSafetyScan().then(setScan).catch(() => {});
  }, []);

  function handleSearchSubmit() {
    if (!searchValue.trim()) return;
    setQaInitialQuestion(searchValue.trim());
    setView("qa");
  }

  function handleSaveTimes(drugName: string, raw: string) {
    setDrugTimes(drugName, raw.split(","));
    setSchedule(getSchedule());
  }

  const todaySlots = groupByTime(schedule);

  return (
    <div className="guide-screen">
      <GuideSidebar active={view} onSelect={setView} />

      <div className="guide-main">
        {view === "panel" && (
          <div className="guide-panel">
            <div className="guide-search">
              <IconSearch size={18} />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
                placeholder={t.panel_search_placeholder}
              />
              <button onClick={handleSearchSubmit} aria-label="search">
                →
              </button>
            </div>

            {scan ? (
              <SecurityBanner
                riskLevel={scan.risk_level}
                totalDrugs={scan.total_drugs}
                interactionCount={scan.interaction_count}
                duplicateCount={scan.duplicate_count}
                onClick={() => setView("interactions")}
              />
            ) : (
              <p className="chat-screen__hint">{t.panel_loading}</p>
            )}

            <div className="guide-panel__grid">
              <div className="today-schedule">
                <div className="today-schedule__title">{t.panel_today_title}</div>
                {todaySlots.length === 0 ? (
                  <div className="today-schedule__empty">
                    <p>{t.panel_today_empty}</p>
                    <button className="home-cta home-cta--secondary" onClick={() => setView("my-meds")}>
                      {t.panel_today_cta}
                    </button>
                  </div>
                ) : (
                  <ul className="today-schedule__list">
                    {todaySlots.map((slot) => (
                      <li key={slot.time}>
                        <span className="today-schedule__time">{slot.time}</span>
                        <span>{slot.drugNames.join(", ")}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="guide-quick-actions">
                <FeatureCard
                  icon={<IconPulse />}
                  title={t.card_symptom_title}
                  description={t.card_symptom_desc}
                  onClick={() => setView("symptom")}
                />
                <FeatureCard
                  icon={<IconShield />}
                  title={t.guide_nav_interactions}
                  description={t.guide_nav_interactions_sub}
                  onClick={() => setView("interactions")}
                />
                <FeatureCard
                  icon={<IconLayers />}
                  title={t.guide_nav_polypharmacy}
                  description={t.guide_nav_polypharmacy_sub}
                  onClick={() => setView("polypharmacy")}
                />
              </div>
            </div>
          </div>
        )}

        {view === "qa" && <ChatScreen initialQuestion={qaInitialQuestion} />}

        {(view === "guide" || view === "my-meds") && (
          <div className="guide-panel">
            <h2 className="guide-panel__title">{view === "my-meds" ? t.my_meds_title : t.guide_nav_guide}</h2>
            <div className="meds-screen">
              {meds.map((med) =>
                view === "my-meds" ? (
                  <ScheduleEditorCard
                    key={med.source_file}
                    med={med}
                    initialTimes={schedule[med.drug_name]?.join(", ") ?? ""}
                    onSave={(raw) => handleSaveTimes(med.drug_name, raw)}
                  />
                ) : (
                  <MedCard key={med.source_file} med={med} />
                )
              )}
            </div>
          </div>
        )}

        {view === "interactions" && (
          <div className="guide-panel">
            <h2 className="guide-panel__title">{t.interactions_title}</h2>
            {!scan || scan.interacting_pairs.length === 0 ? (
              <p className="chat-screen__hint">{t.interactions_empty}</p>
            ) : (
              <ul className="pair-list">
                {scan.interacting_pairs.map((p, i) => (
                  <li key={i} className="pair-list__item">
                    {p.drug_a} <span>↔</span> {p.drug_b}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {view === "symptom" && <SymptomCheckView />}

        {view === "side-effects" && <SideEffectLogView />}

        {view === "polypharmacy" && (
          <div className="guide-panel">
            <h2 className="guide-panel__title">{t.polypharmacy_title}</h2>
            {!scan || scan.duplicate_groups.length === 0 ? (
              <p className="chat-screen__hint">{t.polypharmacy_empty}</p>
            ) : (
              <ul className="pair-list">
                {scan.duplicate_groups.map((g, i) => (
                  <li key={i} className="pair-list__item">
                    {g.active_ingredient}: {g.drugs.join(", ")}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {view === "profile" && <ProfileView />}

        {view === "notes" && <NotesView />}

        {view === "analysis" && <AnalysisView />}

        {SOON_VIEWS.includes(view) && <ComingSoon />}
      </div>
    </div>
  );
}

function ScheduleEditorCard({
  med,
  initialTimes,
  onSave,
}: {
  med: Med;
  initialTimes: string;
  onSave: (raw: string) => void;
}) {
  const { t } = useLanguage();
  const [value, setValue] = useState(initialTimes);
  const [saved, setSaved] = useState(false);

  return (
    <div className="med-card">
      <div className="med-card__name">{med.drug_name}</div>
      <label className="schedule-editor__label">{t.my_meds_time_label}</label>
      <div className="schedule-editor__row">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setSaved(false);
          }}
          placeholder="08:00, 20:00"
        />
        <button
          onClick={() => {
            onSave(value);
            setSaved(true);
          }}
        >
          {t.my_meds_save}
        </button>
      </div>
      {saved && <div className="schedule-editor__saved">{t.my_meds_saved}</div>}
    </div>
  );
}
