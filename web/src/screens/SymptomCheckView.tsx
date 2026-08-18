import { useState } from "react";
import VoiceInputButton from "../components/VoiceInputButton";
import { postSymptomCheck, type SymptomCheckResponse } from "../lib/api";
import { useLanguage } from "../lib/i18n";
import { addLogEntry } from "../lib/sideEffectLog";

export default function SymptomCheckView() {
  const { t } = useLanguage();
  const [symptom, setSymptom] = useState("");
  const [result, setResult] = useState<SymptomCheckResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  async function runCheck(value: string) {
    const trimmed = value.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);
    setSavedIds(new Set());
    try {
      const res = await postSymptomCheck(trimmed);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.unknown_error);
    } finally {
      setLoading(false);
    }
  }

  function handleSaveToLog(drugName: string, snippet: string) {
    if (!result) return;
    addLogEntry({ symptom: result.symptom, drugName, snippet });
    setSavedIds((prev) => new Set(prev).add(drugName));
  }

  return (
    <div className="guide-panel">
      <div className="symptom-card">
        <div className="symptom-card__title">
          <span className="symptom-card__icon">⌁</span> {t.symptom_title}
        </div>
        <p className="symptom-card__subtitle">{t.symptom_subtitle(t.guide_nav_my_meds)}</p>

        <div className="symptom-input-row">
          <input
            type="text"
            value={symptom}
            onChange={(e) => setSymptom(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runCheck(symptom)}
            placeholder={t.symptom_placeholder}
          />
          <VoiceInputButton
            onTranscribed={(text) => {
              setSymptom(text);
              runCheck(text);
            }}
          />
          <button onClick={() => runCheck(symptom)} disabled={loading || !symptom.trim()}>
            {loading ? t.symptom_checking : t.symptom_check_button}
          </button>
        </div>

        <div className="symptom-examples">
          {t.symptom_examples.map((ex) => (
            <button
              key={ex}
              className="symptom-example-chip"
              onClick={() => {
                setSymptom(ex);
                runCheck(ex);
              }}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="chat-screen__error">{error}</p>}

      {result && (
        <>
          <p className="symptom-result-prefix">
            {result.matches.length > 0
              ? t.symptom_result_prefix(result.symptom)
              : t.symptom_no_match(result.symptom)}
          </p>

          <div className="symptom-results">
            {result.matches.map((m) => (
              <div key={m.drug_name} className="symptom-result-card">
                <div className="symptom-result-card__header">
                  <strong>{m.drug_name}</strong>
                  <span className="symptom-result-card__badge">
                    {m.direct_match ? t.symptom_direct_match : t.symptom_related_match}
                  </span>
                </div>
                <p className="symptom-result-card__snippet">{m.snippet}</p>
                <button
                  className="symptom-result-card__save"
                  onClick={() => handleSaveToLog(m.drug_name, m.snippet)}
                  disabled={savedIds.has(m.drug_name)}
                >
                  {savedIds.has(m.drug_name) ? t.symptom_saved_to_log : t.symptom_save_to_log}
                </button>
              </div>
            ))}
          </div>

          <p className="symptom-footer">{t.symptom_checked_drugs(result.checked_drugs.join(", "))}</p>
          <p className="symptom-footer">{t.symptom_disclaimer}</p>
        </>
      )}
    </div>
  );
}
