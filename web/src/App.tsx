import { useState } from "react";
import "./App.css";
import LanguageToggle from "./components/LanguageToggle";
import { LanguageProvider, useLanguage } from "./lib/i18n";
import ChatScreen from "./screens/ChatScreen";
import GuideScreen from "./screens/GuideScreen";
import HomeScreen from "./screens/HomeScreen";
import LoginScreen from "./screens/LoginScreen";
import MedsScreen from "./screens/MedsScreen";
import SettingsScreen from "./screens/SettingsScreen";

type Tab = "home" | "chat" | "meds" | "settings" | "guide" | "login";

function AppShell() {
  const [tab, setTab] = useState<Tab>("home");
  const { t } = useLanguage();

  const TABS: { id: Tab; label: string }[] = [
    { id: "home", label: t.tab_home },
    { id: "chat", label: t.tab_chat },
    { id: "meds", label: t.tab_meds },
    { id: "settings", label: t.tab_settings },
    { id: "login", label: t.tab_login },
  ];

  const fullBleed = tab === "home" || tab === "guide";

  return (
    <div className={`app ${tab === "guide" ? "app--wide" : ""}`}>
      <header className="app__header">
        <div className="app__header-row">
          <h1>{t.appName}</h1>
          <LanguageToggle />
        </div>
        <nav className="app__tabs">
          {TABS.map((tb) => (
            <button
              key={tb.id}
              className={`app__tab ${tab === tb.id ? "app__tab--active" : ""} ${
                tb.id === "login" ? "app__tab--push-right" : ""
              }`}
              onClick={() => setTab(tb.id)}
            >
              {tb.label}
            </button>
          ))}
        </nav>
      </header>

      <main className={`app__content ${fullBleed ? "app__content--home" : ""}`}>
        {tab === "home" && <HomeScreen onNavigate={setTab} />}
        {tab === "chat" && <ChatScreen />}
        {tab === "meds" && <MedsScreen />}
        {tab === "settings" && <SettingsScreen />}
        {tab === "guide" && <GuideScreen />}
        {tab === "login" && <LoginScreen onLoggedIn={() => setTab("home")} />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppShell />
    </LanguageProvider>
  );
}
