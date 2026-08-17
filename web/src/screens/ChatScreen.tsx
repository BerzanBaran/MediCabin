import { useState } from "react";
import ChatBubble from "../components/ChatBubble";
import InteractionBanner from "../components/InteractionBanner";
import { postChat, type ChatResponse } from "../lib/api";

interface Message {
  role: "user" | "assistant";
  text: string;
  response?: ChatResponse;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
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
      setError(err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu.");
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
        {messages.length === 0 && (
          <p className="chat-screen__hint">
            Örnek: "Coumadin ile Nurofen'i birlikte alabilir miyim?"
          </p>
        )}
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
                    <span className="chat-screen__sources-label">Kaynaklar:</span>
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
        {loading && <p className="chat-screen__hint">Yanıt hazırlanıyor…</p>}
        {error && <p className="chat-screen__error">{error}</p>}
      </div>

      <div className="chat-screen__input-row">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="İlaçlarınız hakkında bir soru sorun…"
          disabled={loading}
        />
        <button onClick={handleSend} disabled={loading || !question.trim()}>
          Gönder
        </button>
      </div>
    </div>
  );
}
