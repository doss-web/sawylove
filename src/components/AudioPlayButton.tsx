"use client";
import { useState, useRef, useEffect } from "react";

export default function AudioPlayButton({ audioUrl }: { audioUrl: string }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.onended = () => setPlaying(false);
    audio.onerror = () => setPlaying(false);
    return () => {
      audio.pause();
      audio.onended = null;
      audio.onerror = null;
      audio.removeAttribute("src");
      audio.load();
      audioRef.current = null;
    };
  }, [audioUrl]);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
    } else {
      audioRef.current.play().catch(() => setPlaying(false));
      setPlaying(true);
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={playing ? "Pause voice" : "Play voice"}
      className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--accent-rose)] transition-colors duration-200 mt-1.5 min-h-[44px] cursor-pointer"
    >
      <span
        className={`inline-flex items-center justify-center w-[44px] h-[44px] rounded-full border transition-colors duration-200 ${
          playing
            ? "bg-[var(--accent-rose)]/10 border-[var(--accent-rose)]/30 shadow-[var(--glow-rose)]"
            : "border-[var(--border-subtle)] bg-white/5"
        }`}
      >
        {playing ? (
          // Pause icon (two vertical bars)
          <svg className="w-4 h-4 text-[var(--accent-rose)]" viewBox="0 0 10 10" fill="currentColor">
            <rect x="1" y="1" width="2.5" height="8" rx="0.5" />
            <rect x="6" y="1" width="2.5" height="8" rx="0.5" />
          </svg>
        ) : (
          // Play icon (triangle)
          <svg className="w-4 h-4 ml-0.5 text-[var(--accent-rose)]" viewBox="0 0 10 12" fill="currentColor">
            <path d="M0 0L10 6L0 12Z" />
          </svg>
        )}
      </span>
      <span className={playing ? "text-[var(--accent-rose)]" : ""}>
        {playing ? "Listening..." : "Tap to hear his voice"}
      </span>
    </button>
  );
}
