import { useState } from "react";
import ChatBubble from "../components/ChatBubble";
import InteractionBanner from "../components/InteractionBanner";
import { postChat, type ChatResponse } from "../lib/api";
import { useLanguage } from "../lib/i18n";

interface Message {
  role: "user" | "assistant";
  text: string;
  response?: ChatResponse;
}

interface ChatScreenProps {
  initialQuestion?: string;
}

export default function ChatScreen({ initialQuestion }: ChatScreenProps) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState(initialQuestion ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setQuestion("");
    setLoading(true);
    setError(null);

    try {
      const response = await postChat(trimmed);
      setMessages((prev) => [...prev, { role: "assistant", text: response.answer, response }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.unknown_error);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSend();
  }

  return (
    <div className="chat-screen">
      <div className="chat-screen__messages">
        {messages.length === 0 && <p className="chat-screen__hint">{t.chat_hint}</p>}
        {messages.map((m, i) => (
          <div key={i} className="chat-screen__message-block">
            <ChatBubble role={m.role} text={m.text} />
            {m.response && (
              <div className="chat-screen__response-meta">
                {m.response.interaction_warning && (
                  <InteractionBanner matchedDrugs={m.response.matched_drugs} />
                )}
                {m.response.sources.length > 0 && (
                  <div className="chat-screen__sources">
                    <span className="chat-screen__sources-label">{t.chat_sources_label}</span>
                    {m.response.sources.map((s, j) => (
                      <span key={j} className="source-chip" title={s.snippet}>
                        {s.drug_name} · {s.section_title} (s.{s.page_number})
                      </span>
                    ))}
                  </div>
                )}
                <p className="chat-screen__disclaimer">{m.response.disclaimer}</p>
              </div>
            )}
          </div>
        ))}
        {loading && <p className="chat-screen__hint">{t.chat_preparing}</p>}
        {error && <p className="chat-screen__error">{error}</p>}
      </div>

      <div className="chat-screen__input-row">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t.chat_placeholder}
          disabled={loading}
        />
        <button onClick={handleSend} disabled={loading || !question.trim()}>
          {t.chat_send}
        </button>
      </div>
    </div>
  );
}
