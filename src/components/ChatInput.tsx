"use client";
import { useState, useRef } from "react";

interface ChatInputProps {
  onSend: (msg: string) => void;
  disabled: boolean;
  lang?: "en" | "zh";
}

export default function ChatInput({ onSend, disabled, lang = "en" }: ChatInputProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    onSend(input.trim());
    setInput("");
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 sm:gap-3 p-3 sm:p-4 glass border-t-0 pb-safe">
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder={lang === "zh" ? "说点什么甜的..." : "Say something sweet..."}
        enterKeyHint="send"
        disabled={disabled}
        className="flex-1 px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl bg-white/5 border border-[var(--border-subtle)] focus:outline-none focus:border-[var(--accent-rose)] focus:ring-2 focus:ring-[var(--accent-rose)]/20 focus:bg-white/10 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] disabled:opacity-40 transition-colors duration-200"
      />
      <button
        type="submit"
        disabled={disabled || !input.trim()}
        aria-label={lang === "zh" ? "发送消息" : "Send message"}
        className="px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-[var(--accent-rose)] to-[var(--accent-warm)] text-white disabled:opacity-30 hover:shadow-[var(--glow-rose)] transition-colors duration-200 active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
        </svg>
      </button>
    </form>
  );
}
