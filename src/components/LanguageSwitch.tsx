"use client";
import { useSession } from "next-auth/react";

export default function LanguageSwitch() {
  const { data: session, update } = useSession();
  const lang = (session?.user as any)?.language || "en";

  const toggleLang = async () => {
    const newLang = lang === "en" ? "zh" : "en";
    await fetch("/api/user/language", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: newLang }),
    });
    update();
  };

  return (
    <button
      onClick={toggleLang}
      className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1 rounded border border-gray-200"
    >
      {lang === "en" ? "中文" : "English"}
    </button>
  );
}
