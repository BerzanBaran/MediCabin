import { useEffect, useState } from "react";
import UsageBarChart from "../components/UsageBarChart";
import { getMeds, postAnalysisSummary } from "../lib/api";
import { useLanguage } from "../lib/i18n";
import { average, getNotes } from "../lib/notesLog";
import { getLog as getSideEffectLog } from "../lib/sideEffectLog";
import { countsByDay, getUsageLog } from "../lib/usageLog";

export default function AnalysisView() {
  const { t } = useLanguage();
  const [totalDrugs, setTotalDrugs] = useState(0);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    getMeds()
      .then((meds) => setTotalDrugs(meds.length))
      .catch(() => {});
  }, []);

  const sideEffects = getSideEffectLog();
  const notes = getNotes();
  const usageLog = getUsageLog();
  const days = countsByDay(usageLog, 14);

  const takenCount = usageLog.filter((e) => e.status === "aldim").length;
  const skippedCount = usageLog.filter((e) => e.status === "atladim").length;
  const delayedCount = usageLog.filter((e) => e.status === "gecikti").length;
  const problemCount = usageLog.filter((e) => e.status === "sorun").length;

  const avgSeverity = average(notes.map((n) => n.severity));
  const avgRating = average(notes.map((n) => n.rating));

  const stats = {
    total_drugs: totalDrugs,
    side_effect_count: sideEffects.length,
    usage_note_count: usageLog.length,
    comment_count: notes.length,
    avg_severity: avgSeverity,
    avg_rating: avgRating,
    taken_count: takenCount,
    skipped_count: skippedCount,
    delayed_count: delayedCount,
    problem_count: problemCount,
  };

  async function handleAiSummary() {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await postAnalysisSummary(stats);
      setAiSummary(res.summary);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : t.unknown_error);
    } finally {
      setAiLoading(false);
    }
  }

  const hasUsageData = usageLog.length > 0;

  return (
    <div className="guide-panel">
      <div className="analysis-header">
        <div className="analysis-header__icon">▤</div>
        <div className="analysis-header__text">
          <div className="analysis-header__title">{t.analysis_header_title}</div>
          <p className="analysis-header__subtitle">{t.analysis_header_subtitle}</p>
        </div>
        <button className="home-cta home-cta--primary analysis-ai-btn" onClick={handleAiSummary} disabled={aiLoading}>
          ✦ {aiLoading ? t.analysis_ai_loading : t.analysis_ai_button}
        </button>
      </div>

      {aiError && <p className="chat-screen__error">{aiError}</p>}
      {aiSummary && <div className="analysis-ai-summary">{aiSummary}</div>}

      <div className="analysis-stats">
        <div className="analysis-stat">
          <div className="analysis-stat__label">{t.analysis_stat_plan}</div>
          <div className="analysis-stat__value">{totalDrugs}</div>
        </div>
        <div className="analysis-stat">
          <div className="analysis-stat__label">{t.analysis_stat_side_effect}</div>
          <div className="analysis-stat__value">{sideEffects.length}</div>
        </div>
        <div className="analysis-stat">
          <div className="analysis-stat__label">{t.analysis_stat_usage_note}</div>
          <div className="analysis-stat__value">{usageLog.length}</div>
        </div>
        <div className="analysis-stat">
          <div className="analysis-stat__label">{t.analysis_stat_comment}</div>
          <div className="analysis-stat__value">{notes.length}</div>
        </div>
      </div>

      <div className="analysis-stats analysis-stats--secondary">
        <div className="analysis-stat">
          <div className="analysis-stat__label">{t.analysis_stat_severity}</div>
          <div className="analysis-stat__value">{avgSeverity || "—"}</div>
        </div>
        <div className="analysis-stat">
          <div className="analysis-stat__label">{t.analysis_stat_rating}</div>
          <div className="analysis-stat__value">{avgRating || "—"}</div>
        </div>
      </div>

      <div className="guide-panel">
        <h3 className="notes-card__title">{t.analysis_chart_title}</h3>
        {hasUsageData ? <UsageBarChart data={days} /> : <p className="chat-screen__hint">{t.analysis_chart_empty}</p>}
      </div>
    </div>
  );
}
