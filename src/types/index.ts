import { DefaultSession } from "next-auth";

export interface CharacterData {
  id: string;
  slug: string;
  nameEn: string;
  nameZh: string;
  taglineEn: string;
  taglineZh: string;
  descriptionEn: string;
  descriptionZh: string;
  avatarUrl: string;
  isFree: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  audioUrl?: string;
  createdAt: string;
}

export interface MemoryContext {
  facts: { key: string; value: string }[];
  mood: string | null;
  stage: string;
  summary: string | null;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isSubscribed: boolean;
      language: string;
    } & DefaultSession["user"];
  }
}
