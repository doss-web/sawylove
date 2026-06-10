"use client";
import Link from "next/link";

interface ChatHeaderProps {
  slug: string;
  nameEn: string;
  nameZh: string;
  lang: "en" | "zh";
}

export default function ChatHeader({ slug, nameEn, nameZh, lang }: ChatHeaderProps) {
  const name = lang === "zh" ? nameZh : nameEn;

  return (
    <header className="flex items-center gap-3 px-5 py-3 border-b border-[var(--border-subtle)] glass">
      <Link href="/" className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors text-sm">
        {lang === "zh" ? "← 返回" : "← Back"}
      </Link>
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--accent-rose)] to-[var(--accent-warm)] flex items-center justify-center shadow-[var(--glow-rose)]">
        <img src={`/avatars/${slug}.png`} alt={name} className="w-full h-full rounded-full object-cover" />
      </div>
      <div>
        <span className="font-medium text-[var(--text-primary)]">{name}</span>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-[10px] text-[var(--text-muted)]">Online</span>
        </div>
      </div>
    </header>
  );
}
