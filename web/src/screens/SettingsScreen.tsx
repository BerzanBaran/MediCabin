import { useState } from "react";
import { checkHealth } from "../lib/api";
import { useLanguage } from "../lib/i18n";
import { DEFAULT_SERVER_URL, getServerUrl, setServerUrl } from "../lib/storage";

export default function SettingsScreen() {
  const { t } = useLanguage();
  const [url, setUrl] = useState(getServerUrl());
  const [status, setStatus] = useState<string | null>(null);

  function handleSave() {
    setServerUrl(url.trim() || DEFAULT_SERVER_URL);
    setStatus(null);
  }

  async function handleTest() {
    setStatus(t.settings_testing);
    try {
      const health = await checkHealth();
      setStatus(health.index_loaded ? t.settings_ok : t.settings_ok_no_index);
    } catch (err) {
      setStatus(t.settings_error(err instanceof Error ? err.message : t.unknown_error));
    }
  }

  return (
    <div className="settings-screen">
      <label htmlFor="server-url">{t.settings_server_label}</label>
      <input
        id="server-url"
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder={DEFAULT_SERVER_URL}
      />
      <div className="settings-screen__actions">
        <button onClick={handleSave}>{t.settings_save}</button>
        <button onClick={handleTest}>{t.settings_test}</button>
      </div>
      {status && <p className="settings-screen__status">{status}</p>}
      <p className="settings-screen__note">{t.settings_note(DEFAULT_SERVER_URL)}</p>
    </div>
  );
}
