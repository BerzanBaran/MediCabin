import { useEffect, useState } from "react";
import { useLanguage } from "../lib/i18n";
import {
  addProfile,
  getProfiles,
  removeProfile,
  seedSampleProfilesIfEmpty,
  type Profile,
} from "../lib/profiles";

export default function ProfileView() {
  const { t } = useLanguage();
  const [profiles, setProfiles] = useState<Profile[]>([]);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Profile["gender"]>("kadin");
  const [conditions, setConditions] = useState("");
  const [allergies, setAllergies] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    seedSampleProfilesIfEmpty();
    setProfiles(getProfiles());
  }, []);

  function handleAdd() {
    if (!name.trim() || !age) return;
    addProfile({
      name: name.trim(),
      age: Number(age),
      gender,
      conditions: conditions.split(",").map((c) => c.trim()).filter(Boolean),
      allergies: allergies.split(",").map((a) => a.trim()).filter(Boolean),
      note: note.trim() || undefined,
    });
    setProfiles(getProfiles());
    setName("");
    setAge("");
    setConditions("");
    setAllergies("");
    setNote("");
  }

  function handleRemove(id: string) {
    removeProfile(id);
    setProfiles(getProfiles());
  }

  return (
    <div className="guide-panel">
      <div className="notes-card">
        <h2 className="guide-panel__title">{t.profile_title}</h2>
        {profiles.length === 0 ? (
          <p className="chat-screen__hint">{t.profile_list_empty}</p>
        ) : (
          <div className="profile-grid">
            {profiles.map((p) => (
              <div key={p.id} className="profile-card">
                <div className="profile-card__header">
                  <div>
                    <div className="profile-card__name">{p.name}</div>
                    <div className="profile-card__meta">
                      {p.age} · {p.gender === "kadin" ? t.profile_gender_kadin : t.profile_gender_erkek}
                    </div>
                  </div>
                  <button className="log-entry__remove" onClick={() => handleRemove(p.id)}>
                    {t.log_remove}
                  </button>
                </div>

                <div className="profile-card__section">
                  <span className="profile-card__label">{t.profile_conditions_label.split(" (")[0]}</span>
                  <div className="profile-card__chips">
                    {p.conditions.length > 0 ? (
                      p.conditions.map((c) => (
                        <span key={c} className="source-chip">
                          {c}
                        </span>
                      ))
                    ) : (
                      <span className="chat-screen__hint">{t.profile_no_conditions}</span>
                    )}
                  </div>
                </div>

                <div className="profile-card__section">
                  <span className="profile-card__label">{t.profile_allergies_label.split(" (")[0]}</span>
                  <div className="profile-card__chips">
                    {p.allergies.length > 0 ? (
                      p.allergies.map((a) => (
                        <span key={a} className="source-chip source-chip--warning">
                          {a}
                        </span>
                      ))
                    ) : (
                      <span className="chat-screen__hint">{t.profile_no_allergies}</span>
                    )}
                  </div>
                </div>

                {p.note && <p className="profile-card__note">{p.note}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="notes-card">
        <h3 className="notes-card__title">{t.profile_add_title}</h3>
        <div className="notes-form">
          <label className="login-field">
            {t.profile_name_label}
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="login-field">
            {t.profile_age_label}
            <input type="number" min={0} max={120} value={age} onChange={(e) => setAge(e.target.value)} />
          </label>
          <label className="login-field">
            {t.profile_gender_label}
            <select value={gender} onChange={(e) => setGender(e.target.value as Profile["gender"])}>
              <option value="kadin">{t.profile_gender_kadin}</option>
              <option value="erkek">{t.profile_gender_erkek}</option>
            </select>
          </label>
          <label className="login-field">
            {t.profile_conditions_label}
            <input type="text" value={conditions} onChange={(e) => setConditions(e.target.value)} />
          </label>
          <label className="login-field">
            {t.profile_allergies_label}
            <input type="text" value={allergies} onChange={(e) => setAllergies(e.target.value)} />
          </label>
          <label className="login-field">
            {t.profile_note_label}
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          <button className="home-cta home-cta--primary" onClick={handleAdd} disabled={!name.trim() || !age}>
            {t.profile_add_button}
          </button>
        </div>
      </div>
    </div>
  );
}
