"use client";
import { useState, useEffect, useRef } from "react";
import { ChatMessage } from "@/types";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import { Heart } from "lucide-react";
import { SkeletonMessage } from "./Skeleton";

export default function ChatWindow({ characterId, characterName }: { characterId: string; characterName: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async (text: string) => {
    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: text, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ characterId, message: text }) });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      setMessages(prev => [...prev, data]);
    } catch (err) { console.error("Chat error:", err); }
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
            <p className="font-display text-xl text-[var(--text-secondary)]">Say hello to {characterName}</p>
            <p className="text-sm text-[var(--text-muted)] mt-2">Your first message begins something beautiful</p>
          </div>
        )}
        {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
        {loading && <SkeletonMessage />}
        <div ref={bottomRef} />
      </div>
      <ChatInput onSend={sendMessage} disabled={loading} />
    </div>
  );
}
