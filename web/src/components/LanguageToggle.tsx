import { useLanguage } from "../lib/i18n";

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="lang-toggle" role="group" aria-label="Language">
      <button
        className={`lang-toggle__option ${language === "tr" ? "lang-toggle__option--active" : ""}`}
        onClick={() => setLanguage("tr")}
      >
        TR
      </button>
      <button
        className={`lang-toggle__option ${language === "en" ? "lang-toggle__option--active" : ""}`}
        onClick={() => setLanguage("en")}
      >
        EN
      </button>
    </div>
  );
}
