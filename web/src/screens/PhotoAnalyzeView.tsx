import { useRef, useState } from "react";
import { postPhotoAnalyze, type PhotoAnalyzeResponse } from "../lib/api";
import { useLanguage } from "../lib/i18n";

export default function PhotoAnalyzeView() {
  const { t } = useLanguage();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<PhotoAnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileSelected(selected: File | undefined) {
    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      setError(t.photo_error_type);
      return;
    }
    setError(null);
    setResult(null);
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  }

  function handleRemove() {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
  }

  async function handleAnalyze() {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const res = await postPhotoAnalyze(file);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.unknown_error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="guide-panel">
      <div className="notes-card">
        <h2 className="guide-panel__title">{t.photo_title}</h2>
        <p className="symptom-card__subtitle">{t.photo_subtitle}</p>

        {!file ? (
          <div className="photo-buttons">
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={(e) => handleFileSelected(e.target.files?.[0])}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => handleFileSelected(e.target.files?.[0])}
            />
            <input
              ref={uploadInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => handleFileSelected(e.target.files?.[0])}
            />
            <button className="home-cta home-cta--primary" onClick={() => cameraInputRef.current?.click()}>
              📷 {t.photo_camera_button}
            </button>
            <button className="home-cta home-cta--secondary" onClick={() => galleryInputRef.current?.click()}>
              🖼️ {t.photo_gallery_button}
            </button>
            <button className="home-cta home-cta--secondary" onClick={() => uploadInputRef.current?.click()}>
              ⬆ {t.photo_upload_button}
            </button>
          </div>
        ) : (
          <div className="photo-preview">
            {previewUrl && <img src={previewUrl} alt="" className="photo-preview__image" />}
            <div className="photo-preview__actions">
              <button className="home-cta home-cta--primary" onClick={handleAnalyze} disabled={loading}>
                {loading ? t.photo_analyzing : t.photo_analyze_button}
              </button>
              <button className="home-cta home-cta--secondary" onClick={handleRemove} disabled={loading}>
                {t.photo_remove_button}
              </button>
            </div>
          </div>
        )}

        {error && <p className="chat-screen__error">{error}</p>}

        {result && (
          <div className="photo-result">
            <h3 className="notes-card__title">{t.photo_result_title}</h3>
            <p className="photo-result__text">{result.result}</p>
            {result.matched_drugs.length > 0 ? (
              <div className="chat-screen__sources">
                <span className="chat-screen__sources-label">{t.photo_matched_prefix}</span>
                {result.matched_drugs.map((d) => (
                  <span key={d} className="source-chip">
                    {d}
                  </span>
                ))}
              </div>
            ) : (
              <p className="chat-screen__hint">{t.photo_no_match}</p>
            )}
            <p className="symptom-footer">{t.photo_disclaimer}</p>
          </div>
        )}
      </div>
    </div>
  );
}
