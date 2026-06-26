"use client";
import { useRouter } from "next/navigation";

interface AuthButtonProps {
  lang?: "en" | "zh";
  loggedIn: boolean;
  userName?: string | null;
}

const t = (lang: "en" | "zh", key: "signIn" | "signOut") => {
  const map = {
    signIn: { en: "Sign In", zh: "登录" },
    signOut: { en: "Sign Out", zh: "退出" },
  };
  return map[key][lang];
};

export default function AuthButton({ lang = "en", loggedIn, userName }: AuthButtonProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      const { signOut } = await import("@/lib/auth-client");
      await signOut();
      window.location.href = "/";
    } catch {
      window.location.href = "/api/auth/signout";
    }
  };

  if (loggedIn) {
    return (
      <div className="flex items-center gap-3">
        {userName && (
          <span className="text-sm text-[var(--text-secondary)]">{userName}</span>
        )}
        <button
          onClick={handleSignOut}
          className="text-sm text-[var(--text-muted)] hover:text-[var(--accent-rose)] transition-colors min-h-[44px] px-2"
        >
          {t(lang, "signOut")}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => router.push("/login")}
      className="px-4 sm:px-5 py-2.5 rounded-full bg-gradient-to-r from-[var(--accent-rose)] to-[var(--accent-warm)] text-white text-sm font-medium hover:shadow-[var(--glow-rose)] transition-shadow duration-200 cursor-pointer min-h-[44px]"
    >
      {t(lang, "signIn")}
    </button>
  );
}
