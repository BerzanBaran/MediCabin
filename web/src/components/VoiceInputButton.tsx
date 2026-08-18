import { useRef, useState } from "react";
import { postTranscribe } from "../lib/api";

type RecordState = "idle" | "recording" | "transcribing" | "error";

interface VoiceInputButtonProps {
  onTranscribed: (text: string) => void;
}

export default function VoiceInputButton({ onTranscribed }: VoiceInputButtonProps) {
  const [state, setState] = useState<RecordState>("idle");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        setState("transcribing");
        try {
          const { text } = await postTranscribe(blob);
          if (text) onTranscribed(text);
          setState("idle");
        } catch {
          setState("error");
          setTimeout(() => setState("idle"), 2000);
        }
      };

      recorderRef.current = recorder;
      recorder.start();
      setState("recording");
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 2000);
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
  }

  return (
    <button
      type="button"
      className={`voice-btn voice-btn--${state}`}
      onClick={state === "recording" ? stopRecording : startRecording}
      disabled={state === "transcribing"}
      aria-label="voice input"
      title={state === "recording" ? "Kaydı durdur" : "Sesle söyle"}
    >
      {state === "recording" ? "●" : state === "transcribing" ? "…" : "🎤"}
    </button>
  );
}
