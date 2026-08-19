import { useEffect, useState } from "react";
import { getMeds, type Med } from "../lib/api";
import { useLanguage } from "../lib/i18n";
import { getProfiles, seedSampleProfilesIfEmpty, type Profile } from "../lib/profiles";
import {
  addReminder,
  getCompletions,
  getReminders,
  isCompleted,
  removeReminder,
  seedSampleRemindersIfEmpty,
  toDateKey,
  toggleCompletion,
  type Reminder,
} from "../lib/reminders";

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export default function CalendarView() {
  const { t, language } = useLanguage();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [meds, setMeds] = useState<Med[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [completions, setCompletions] = useState(getCompletions());

  const [personName, setPersonName] = useState(t.calendar_person_self);
  const [drugName, setDrugName] = useState("");
  const [time, setTime] = useState("08:00");

  useEffect(() => {
    getMeds()
      .then((list) => {
        setMeds(list);
        if (list.length > 0) setDrugName((prev) => prev || list[0].drug_name);
      })
      .catch(() => {});

    seedSampleProfilesIfEmpty();
    seedSampleRemindersIfEmpty();
    setProfiles(getProfiles());
    setReminders(getReminders());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const todayKey = toDateKey(new Date());
  const dateKey = toDateKey(selectedDate);
  const isFuture = dateKey > todayKey;

  const dayReminders = [...reminders].sort((a, b) => a.time.localeCompare(b.time));

  const dateLabel = selectedDate.toLocaleDateString(language === "tr" ? "tr-TR" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  function handleToggle(reminderId: string) {
    if (isFuture) return;
    toggleCompletion(reminderId, dateKey);
    setCompletions(getCompletions());
  }

  function handleAdd() {
    if (!personName || !drugName || !time) return;
    addReminder({ personName, drugName, time });
    setReminders(getReminders());
  }

  function handleRemove(id: string) {
    removeReminder(id);
    setReminders(getReminders());
  }

  return (
    <div className="guide-panel">
      <div className="notes-card">
        <div className="calendar-nav">
          <button className="home-cta home-cta--secondary" onClick={() => setSelectedDate((d) => addDays(d, -1))}>
            {t.calendar_prev}
          </button>
          <div className="calendar-nav__date">
            {dateLabel}
            {dateKey === todayKey && <span className="calendar-nav__today-badge">{t.calendar_today}</span>}
          </div>
          <button className="home-cta home-cta--secondary" onClick={() => setSelectedDate((d) => addDays(d, 1))}>
            {t.calendar_next}
          </button>
        </div>
        {dateKey !== todayKey && (
          <button className="login-link" onClick={() => setSelectedDate(new Date())}>
            {t.calendar_today}
          </button>
        )}

        {dayReminders.length === 0 ? (
          <p className="chat-screen__hint">{t.calendar_empty}</p>
        ) : (
          <ul className="pair-list">
            {dayReminders.map((r) => {
              const done = isCompleted(completions, r.id, dateKey);
              return (
                <li key={r.id} className="pair-list__item calendar-entry">
                  <label className={`calendar-entry__check ${isFuture ? "calendar-entry__check--disabled" : ""}`}>
                    <input
                      type="checkbox"
                      checked={done}
                      disabled={isFuture}
                      onChange={() => handleToggle(r.id)}
                    />
                    <span className="today-schedule__time">{r.time}</span>
                    <span>
                      {r.personName} · {r.drugName}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
        {isFuture && <p className="login-info">{t.calendar_future_note}</p>}
      </div>

      <div className="notes-card">
        <h3 className="notes-card__title">{t.calendar_add_title}</h3>
        <div className="notes-form">
          <label className="login-field">
            {t.calendar_person_label}
            <select value={personName} onChange={(e) => setPersonName(e.target.value)}>
              <option value={t.calendar_person_self}>{t.calendar_person_self}</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="login-field">
            {t.calendar_drug_label}
            <select value={drugName} onChange={(e) => setDrugName(e.target.value)}>
              {meds.map((med) => (
                <option key={med.source_file} value={med.drug_name}>
                  {med.drug_name}
                </option>
              ))}
            </select>
          </label>
          <label className="login-field">
            {t.calendar_time_label}
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </label>
          <button className="home-cta home-cta--primary" onClick={handleAdd}>
            {t.calendar_add_button}
          </button>
        </div>
      </div>

      <div className="notes-card">
        <h3 className="notes-card__title">{t.calendar_list_title}</h3>
        {reminders.length === 0 ? (
          <p className="chat-screen__hint">{t.calendar_list_empty}</p>
        ) : (
          <ul className="pair-list">
            {[...reminders]
              .sort((a, b) => a.time.localeCompare(b.time))
              .map((r) => (
                <li key={r.id} className="pair-list__item log-entry">
                  <div>
                    <span className="today-schedule__time">{r.time}</span> {r.personName} · {r.drugName}
                  </div>
                  <button className="log-entry__remove" onClick={() => handleRemove(r.id)}>
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
