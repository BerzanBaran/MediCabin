import { useEffect, useState } from "react";
import { useLanguage } from "../lib/i18n";
import { getSchedule, groupByTime, type ScheduleMap } from "../lib/schedule";
import { clearUsageStatus, getStatusFor, getUsageLog, setUsageStatus, todayKey, type UsageEntry } from "../lib/usageLog";

interface Entry {
  time: string;
  drugName: string;
}

export default function CalendarView() {
  const { t, language } = useLanguage();
  const [schedule, setSchedule] = useState<ScheduleMap>({});
  const [usageLog, setUsageLog] = useState<UsageEntry[]>([]);

  useEffect(() => {
    setSchedule(getSchedule());
    setUsageLog(getUsageLog());
  }, []);

  const today = todayKey();
  const dateLabel = new Date().toLocaleDateString(language === "tr" ? "tr-TR" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const entries: Entry[] = groupByTime(schedule).flatMap((slot) =>
    slot.drugNames.map((drugName) => ({ time: slot.time, drugName }))
  );

  const upcoming = entries.filter((e) => getStatusFor(usageLog, today, e.drugName, e.time) !== "aldim");
  const taken = entries.filter((e) => getStatusFor(usageLog, today, e.drugName, e.time) === "aldim");

  function handleMarkTaken(drugName: string, time: string) {
    setUsageStatus(today, drugName, "aldim", time);
    setUsageLog(getUsageLog());
  }

  function handleUndo(drugName: string, time: string) {
    clearUsageStatus(today, drugName, time);
    setUsageLog(getUsageLog());
  }

  return (
    <div className="guide-panel">
      <div className="notes-card">
        <div className="calendar-nav__date calendar-nav__date--centered">{dateLabel}</div>

        {entries.length === 0 ? (
          <div className="today-schedule__empty">
            <p>{t.calendar_empty}</p>
            <p className="login-info">{t.calendar_setup_hint}</p>
          </div>
        ) : (
          <>
            <h3 className="notes-card__title">{t.calendar_upcoming_title}</h3>
            {upcoming.length === 0 ? (
              <p className="chat-screen__hint">{t.calendar_all_taken}</p>
            ) : (
              <ul className="pair-list">
                {upcoming.map((e, i) => (
                  <li key={`${e.drugName}-${e.time}-${i}`} className="pair-list__item calendar-entry">
                    <span className="today-schedule__time">{e.time}</span>
                    <span className="calendar-entry__name">{e.drugName}</span>
                    <button className="calendar-entry__action" onClick={() => handleMarkTaken(e.drugName, e.time)}>
                      {t.calendar_mark_taken}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <h3 className="notes-card__title calendar-taken-title">{t.calendar_taken_title}</h3>
            {taken.length === 0 ? (
              <p className="chat-screen__hint">{t.calendar_none_taken}</p>
            ) : (
              <ul className="pair-list">
                {taken.map((e, i) => (
                  <li key={`${e.drugName}-${e.time}-${i}`} className="pair-list__item calendar-entry calendar-entry--done">
                    <span className="today-schedule__time">{e.time}</span>
                    <span className="calendar-entry__name">{e.drugName}</span>
                    <span className="calendar-entry__badge">✓</span>
                    <button className="login-link" onClick={() => handleUndo(e.drugName, e.time)}>
                      {t.calendar_undo}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
