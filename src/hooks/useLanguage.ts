"use client";
import { useSession } from "@/lib/auth-client";

export function useLanguage(): "en" | "zh" {
  const { data: session } = useSession();
  return (session?.user as any)?.language === "zh" ? "zh" : "en";
}
