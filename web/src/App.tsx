import { useState } from "react";
import "./App.css";
import ChatScreen from "./screens/ChatScreen";
import MedsScreen from "./screens/MedsScreen";
import SettingsScreen from "./screens/SettingsScreen";

type Tab = "chat" | "meds" | "settings";

const TABS: { id: Tab; label: string }[] = [
  { id: "chat", label: "Sohbet" },
  { id: "meds", label: "İlaç Dolabım" },
  { id: "settings", label: "Ayarlar" },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("chat");

  return (
    <div className="app">
      <header className="app__header">
        <h1>İlaç Dolabı Asistanı</h1>
        <nav className="app__tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`app__tab ${tab === t.id ? "app__tab--active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="app__content">
        {tab === "chat" && <ChatScreen />}
        {tab === "meds" && <MedsScreen />}
        {tab === "settings" && <SettingsScreen />}
      </main>
    </div>
  );
}
