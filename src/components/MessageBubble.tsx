"use client";
import { ChatMessage } from "@/types";
import AudioPlayButton from "./AudioPlayButton";

export default function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={`mb-4 msg-in ${isUser ? "flex flex-col items-end" : "flex flex-col items-start"}`}>
      {/* Main row: avatar + bubble */}
      <div className={`flex ${isUser ? "justify-end" : "justify-start"} w-full`}>
        {!isUser && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-rose)] to-[var(--accent-warm)] flex-shrink-0 mr-2 self-end shadow-[var(--glow-rose)]" />
        )}
        <div
          className={
            isUser
              ? "max-w-[70%] px-5 py-3 rounded-2xl rounded-br-sm bg-gradient-to-r from-[var(--accent-rose)] to-[var(--accent-warm)] text-white shadow-[var(--glow-rose)]"
              : "max-w-[70%] px-5 py-3 rounded-2xl rounded-bl-sm glass text-[var(--text-primary)]"
          }
        >
          <p className="text-base leading-relaxed whitespace-pre-wrap">{msg.content}</p>
        </div>
      </div>

      {/* Audio play button — outside the bubble, for AI messages only */}
      {msg.audioUrl && !isUser && (
        <div className="ml-10">
          <AudioPlayButton audioUrl={msg.audioUrl} />
        </div>
      )}
    </div>
  );
}
