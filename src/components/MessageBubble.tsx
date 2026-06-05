"use client";
import { ChatMessage } from "@/types";

export default function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`max-w-[75%] px-4 py-3 rounded-2xl ${isUser ? "bg-rose-500 text-white" : "bg-gray-100 text-gray-900"}`}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
        {msg.audioUrl && !isUser && (
          <audio controls className="mt-2 w-full" src={msg.audioUrl}>
            Your browser does not support audio.
          </audio>
        )}
      </div>
    </div>
  );
}
