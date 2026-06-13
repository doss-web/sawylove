"use client";
import Link from "next/link";
import { Heart } from "lucide-react";
import AuthButton from "./AuthButton";
import LanguageSwitch from "./LanguageSwitch";

interface PageHeaderProps {
  lang: "en" | "zh";
  loggedIn: boolean;
  userName?: string | null;
}

export default function PageHeader({ lang, loggedIn, userName }: PageHeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-deep)]">
      <Link href="/" className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-[var(--text-primary)]">
        <Heart className="w-5 h-5 text-[var(--accent-rose)] fill-[var(--accent-rose)]" />
        <span>Swoonly</span>
      </Link>
      <div className="flex items-center gap-3">
        <LanguageSwitch lang={lang} loggedIn={loggedIn} />
        <AuthButton loggedIn={loggedIn} userName={userName} />
      </div>
    </header>
  );
}
