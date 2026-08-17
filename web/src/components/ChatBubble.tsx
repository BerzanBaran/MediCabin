interface ChatBubbleProps {
  role: "user" | "assistant";
  text: string;
}

export default function ChatBubble({ role, text }: ChatBubbleProps) {
  return (
    <div className={`chat-bubble chat-bubble--${role}`}>
      <span className="chat-bubble__text">{text}</span>
    </div>
  );
}
