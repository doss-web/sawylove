"use client";
import { useState, useEffect, useRef } from "react";
import { ChatMessage } from "@/types";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import { Heart } from "lucide-react";
import { SkeletonMessage } from "./Skeleton";

export default function ChatWindow({ characterId, characterName, lang = "en" }: { characterId: string; characterName: string; lang?: "en" | "zh" }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [error, setError] = useState("");

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async (text: string) => {
    const tempId = Date.now().toString();
    const userMsg: ChatMessage = { id: tempId, role: "user", content: text, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ characterId, message: text }) });
      const data = await res.json();
      if (data.error) {
        // Roll back optimistic message
        setMessages(prev => prev.filter(m => m.id !== tempId));
        setError(data.error);
        return;
      }
      setMessages(prev => [...prev, data]);
    } catch (err) {
      // Roll back optimistic message on network error
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setError(lang === "zh" ? "网络错误，请重试" : "Network error. Please try again.");
      console.error("Chat error:", err);
    }
    finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center relative">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="particle w-2 h-2 bg-[var(--accent-rose)] top-1/4 left-1/4" />
              <div className="particle w-1.5 h-1.5 bg-[var(--accent-gold)] top-1/3 right-1/3" />
              <div className="particle w-1 h-1 bg-[var(--accent-warm)] top-1/2 left-1/3" />
              <div className="particle w-2 h-2 bg-[var(--accent-rose)] bottom-1/3 right-1/4" />
            </div>
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--accent-rose)] to-[var(--accent-warm)] flex items-center justify-center mb-5 shadow-[var(--glow-rose)]">
              <Heart className="w-10 h-10 text-white fill-white" />
            </div>
            <p className="font-display text-lg sm:text-xl text-[var(--text-secondary)]">
              {lang === "zh" ? `向 ${characterName} 打个招呼` : `Say hello to ${characterName}`}
            </p>
            <p className="text-sm text-[var(--text-muted)] mt-2">
              {lang === "zh" ? "你的第一条消息将开启一段美好的故事" : "Your first message begins something beautiful"}
            </p>
          </div>
        )}
        {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
        {error && (
          <div className="flex justify-center mb-4">
            <span className="text-xs text-[var(--accent-rose)] bg-[var(--accent-rose)]/10 px-4 py-2 rounded-full">{error}</span>
          </div>
        )}
        {loading && <SkeletonMessage />}
        <div ref={bottomRef} />
      </div>
      <ChatInput onSend={sendMessage} disabled={loading} lang={lang} />
    </div>
  );
}
