import { useEffect, useState } from "react";
import { getMeds, type Med } from "../lib/api";
import { useLanguage } from "../lib/i18n";
import { addNote, getNotes, removeNote, type NoteEntry } from "../lib/notesLog";
import { getStatusFor, getUsageLog, setUsageStatus, todayKey, type UsageStatus } from "../lib/usageLog";

const STATUSES: UsageStatus[] = ["aldim", "atladim", "gecikti", "sorun"];

export default function NotesView() {
  const { t } = useLanguage();
  const [meds, setMeds] = useState<Med[]>([]);
  const [usageLog, setUsageLog] = useState(getUsageLog());
  const [notes, setNotes] = useState<NoteEntry[]>(getNotes());

  const [drugName, setDrugName] = useState("");
  const [rating, setRating] = useState(4);
  const [severity, setSeverity] = useState(1);
  const [comment, setComment] = useState("");

  useEffect(() => {
    getMeds()
      .then((list) => {
        setMeds(list);
        if (list.length > 0) setDrugName((prev) => prev || list[0].drug_name);
      })
      .catch(() => {});
  }, []);

  const today = todayKey();
  const statusLabel: Record<UsageStatus, string> = {
    aldim: t.notes_status_aldim,
    atladim: t.notes_status_atladim,
    gecikti: t.notes_status_gecikti,
    sorun: t.notes_status_sorun,
  };

  function handleMark(drug: string, status: UsageStatus) {
    setUsageStatus(today, drug, status);
    setUsageLog(getUsageLog());
  }

  function handleAddNote() {
    if (!drugName || !comment.trim()) return;
    addNote({ drugName, rating, severity, comment: comment.trim() });
    setNotes(getNotes());
    setComment("");
  }

  function handleRemoveNote(id: string) {
    removeNote(id);
    setNotes(getNotes());
  }

  return (
    <div className="guide-panel">
      <div className="notes-card">
        <h3 className="notes-card__title">{t.notes_today_title}</h3>
        <div className="usage-grid">
          {meds.map((med) => {
            const current = getStatusFor(usageLog, today, med.drug_name);
            return (
              <div key={med.source_file} className="usage-row">
                <span className="usage-row__name">{med.drug_name}</span>
                <div className="usage-row__buttons">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      className={`usage-pill usage-pill--${s} ${current === s ? "usage-pill--active" : ""}`}
                      onClick={() => handleMark(med.drug_name, s)}
                    >
                      {statusLabel[s]}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="notes-card">
        <h3 className="notes-card__title">{t.notes_add_title}</h3>
        <div className="notes-form">
          <select value={drugName} onChange={(e) => setDrugName(e.target.value)}>
            {meds.map((med) => (
              <option key={med.source_file} value={med.drug_name}>
                {med.drug_name}
              </option>
            ))}
          </select>

          <label className="notes-form__field">
            {t.notes_rating_label}
            <input
              type="range"
              min={1}
              max={5}
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            />
            <span>{rating}</span>
          </label>

          <label className="notes-form__field">
            {t.notes_severity_label}
            <input
              type="range"
              min={1}
              max={5}
              value={severity}
              onChange={(e) => setSeverity(Number(e.target.value))}
            />
            <span>{severity}</span>
          </label>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t.notes_comment_placeholder}
            rows={2}
          />

          <button className="home-cta home-cta--primary" onClick={handleAddNote} disabled={!comment.trim()}>
            {t.notes_add_button}
          </button>
        </div>
      </div>

      <div className="notes-card">
        <h3 className="notes-card__title">{t.notes_list_title}</h3>
        {notes.length === 0 ? (
          <p className="chat-screen__hint">{t.notes_list_empty}</p>
        ) : (
          <ul className="pair-list">
            {notes.map((n) => (
              <li key={n.id} className="pair-list__item log-entry">
                <div>
                  <strong>{n.drugName}</strong> · ★{n.rating} ·{" "}
                  {t.notes_severity_label.split(" ")[0]} {n.severity}
                  <div className="log-entry__date">{n.comment}</div>
                  <div className="log-entry__date">{new Date(n.timestamp).toLocaleString()}</div>
                </div>
                <button className="log-entry__remove" onClick={() => handleRemoveNote(n.id)}>
                  {t.log_remove}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
