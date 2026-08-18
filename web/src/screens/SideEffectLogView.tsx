import { useState } from "react";
import { useLanguage } from "../lib/i18n";
import { getLog, removeLogEntry, type LogEntry } from "../lib/sideEffectLog";

export default function SideEffectLogView() {
  const { t } = useLanguage();
  const [entries, setEntries] = useState<LogEntry[]>(getLog());

  function handleRemove(id: string) {
    removeLogEntry(id);
    setEntries(getLog());
  }

  return (
    <div className="guide-panel">
      <h2 className="guide-panel__title">{t.log_title}</h2>
      {entries.length === 0 ? (
        <p className="chat-screen__hint">{t.log_empty}</p>
      ) : (
        <ul className="pair-list">
          {entries.map((e) => (
            <li key={e.id} className="pair-list__item log-entry">
              <div>
                <strong>{e.drugName}</strong> · {e.symptom}
                <div className="log-entry__date">{new Date(e.timestamp).toLocaleString()}</div>
              </div>
              <button className="log-entry__remove" onClick={() => handleRemove(e.id)}>
                {t.log_remove}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
