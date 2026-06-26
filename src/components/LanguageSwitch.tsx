"use client";

interface LanguageSwitchProps {
  lang?: "en" | "zh";
  loggedIn?: boolean;
}

export default function LanguageSwitch({ lang = "en", loggedIn = false }: LanguageSwitchProps) {
  const toggleLang = async () => {
    const newLang = lang === "en" ? "zh" : "en";

    if (loggedIn) {
      // Authenticated: save to DB via API
      await fetch("/api/user/language", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: newLang }),
      });
    } else {
      // Unauthenticated: save to cookie
      document.cookie = `NEXT_LOCALE=${newLang}; path=/; max-age=31536000`;
    }

    window.location.reload();
  };

  return (
    <button
      onClick={toggleLang}
      className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] px-3 py-2 rounded-full border border-[var(--border-subtle)] glass text-sm transition-colors duration-200 cursor-pointer min-h-[44px]"
    >
      {lang === "en" ? "中文" : "English"}
    </button>
  );
}
