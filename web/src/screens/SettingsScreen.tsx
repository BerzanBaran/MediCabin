import { useState } from "react";
import { checkHealth } from "../lib/api";
import { DEFAULT_SERVER_URL, getServerUrl, setServerUrl } from "../lib/storage";

export default function SettingsScreen() {
  const [url, setUrl] = useState(getServerUrl());
  const [status, setStatus] = useState<string | null>(null);

  function handleSave() {
    setServerUrl(url.trim() || DEFAULT_SERVER_URL);
    setStatus(null);
  }

  async function handleTest() {
    setStatus("Bağlantı test ediliyor…");
    try {
      const health = await checkHealth();
      setStatus(health.index_loaded ? "✓ Bağlantı başarılı, ilaç dolabı hazır." : "✓ Sunucuya ulaşıldı ama index henüz yüklenmedi.");
    } catch (err) {
      setStatus(`✗ Bağlantı hatası: ${err instanceof Error ? err.message : "bilinmeyen hata"}`);
    }
  }

  return (
    <div className="settings-screen">
      <label htmlFor="server-url">Sunucu Adresi</label>
      <input
        id="server-url"
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder={DEFAULT_SERVER_URL}
      />
      <div className="settings-screen__actions">
        <button onClick={handleSave}>Kaydet</button>
        <button onClick={handleTest}>Bağlantıyı Test Et</button>
      </div>
      {status && <p className="settings-screen__status">{status}</p>}
      <p className="settings-screen__note">
        Backend ve web arayüzü aynı bilgisayarda çalıştığı için genelde varsayılan adres
        ({DEFAULT_SERVER_URL}) yeterlidir.
      </p>
    </div>
  );
}
