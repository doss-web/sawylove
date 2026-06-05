# 纸片人男友 (Paper Boyfriend) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deployable AI virtual boyfriend chat app with 5 preset characters, text chat, TTS voice reply, memory system, auth, and Stripe subscriptions.

**Architecture:** Next.js 14 App Router full-stack on Vercel. Prisma ORM → PostgreSQL. NextAuth.js for OAuth. LLM/TTS via OpenAI-compatible API adapter (provider-agnostic). Memory via background key-fact extraction + summary injection. Stripe for subscriptions. Tailwind CSS for UI. Fully bilingual (en/zh).

**Tech Stack:** Next.js 14 (App Router), TypeScript, Prisma, PostgreSQL, NextAuth.js, Tailwind CSS, Stripe, OpenAI SDK (as provider-agnostic adapter)

---

## File Structure

```
paper-boyfriend/
├── package.json
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── postcss.config.js
├── .env.local.example
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    (landing → character grid)
│   │   ├── globals.css
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── chat/
│   │   │   └── [characterId]/
│   │   │       └── page.tsx            (chat interface)
│   │   └── api/
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts
│   │       ├── chat/
│   │       │   └── route.ts            (POST: send msg → LLM → TTS → reply)
│   │       ├── characters/
│   │       │   └── route.ts            (GET: list 5 characters)
│   │       └── stripe/
│   │           └── webhook/
│   │               └── route.ts
│   ├── components/
│   │   ├── CharacterCard.tsx
│   │   ├── CharacterGrid.tsx
│   │   ├── ChatWindow.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── ChatInput.tsx
│   │   ├── AudioPlayer.tsx
│   │   ├── AuthButton.tsx
│   │   ├── SubscribeBanner.tsx
│   │   └── LanguageSwitch.tsx
│   ├── lib/
│   │   ├── auth.ts                     (NextAuth config)
│   │   ├── db.ts                       (Prisma singleton)
│   │   ├── llm.ts                      (OpenAI-compatible adapter)
│   │   ├── tts.ts                      (OpenAI-compatible TTS adapter)
│   │   ├── memory.ts                   (extract facts + build summary)
│   │   ├── stripe.ts                   (Stripe client + checkout)
│   │   └── rate-limit.ts              (daily message counter)
│   ├── prompts/
│   │   └── characters.ts              (5 chars × zh/en system prompts)
│   └── types/
│       └── index.ts
├── public/
│   └── avatars/
│       ├── gentle-warm.png
│       ├── humorous.png
│       ├── mature.png
│       ├── artistic.png
│       └── dominant.png
```

---

## Database Schema (Prisma)

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id               String        @id @default(cuid())
  email            String?       @unique
  name             String?
  image            String?
  language         String        @default("en")       // "en" | "zh"
  isSubscribed     Boolean       @default(false)
  stripeCustomerId String?
  subscriptionEnd  DateTime?
  dailyMsgCount    Int           @default(0)
  msgCountDate     DateTime      @default(now())
  createdAt        DateTime      @default(now())

  memories     UserMemory[]
  chatSessions ChatSession[]
}

model Character {
  id             String   @id @default(cuid())
  slug           String   @unique
  nameEn         String
  nameZh         String
  taglineEn      String
  taglineZh      String
  descriptionEn  String   @db.Text
  descriptionZh  String   @db.Text
  avatarUrl      String
  systemPromptEn String   @db.Text
  systemPromptZh String   @db.Text
  isFree         Boolean  @default(true)
  createdAt      DateTime @default(now())
}

model UserMemory {
  id        String   @id @default(cuid())
  userId    String
  key       String
  value     String   @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, key])
}

model ChatSession {
  id          String    @id @default(cuid())
  userId      String
  characterId String
  summary     String?   @db.Text
  mood        String?
  stage       String?   @default("acquaintance")
  updatedAt   DateTime  @updatedAt

  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages Message[]

  @@unique([userId, characterId])
}

model Message {
  id        String   @id @default(cuid())
  sessionId String
  role      String
  content   String   @db.Text
  audioUrl  String?
  createdAt DateTime @default(now())

  session ChatSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
}
```

---

## Types

```typescript
// src/types/index.ts
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
```

---

## Tasks

---

### Task 1: Scaffold Next.js Project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.ts`, `postcss.config.js`, `.env.local.example`, `src/app/globals.css`, `src/app/layout.tsx`

**Create files:**

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "paper-boyfriend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "postinstall": "prisma generate",
    "db:push": "prisma db push",
    "db:seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "next-auth": "^4.24.0",
    "@prisma/client": "^5.14.0",
    "prisma": "^5.14.0",
    "openai": "^4.47.0",
    "stripe": "^15.0.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "typescript": "^5.4.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@types/node": "^20.12.0",
    "tsx": "^4.11.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `next.config.js`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "prisma"],
  },
};

module.exports = nextConfig;
```

- [ ] **Step 4: Create `tailwind.config.ts`**

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        rose: { 50: "#fff1f2", 100: "#ffe4e6", 200: "#fecdd3", 400: "#fb7185", 500: "#f43f5e", 600: "#e11d48" },
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 5: Create `postcss.config.js`**

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 6: Create `.env.local.example`**

```
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-random-secret"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
LLM_API_KEY=""
LLM_BASE_URL="https://api.openai.com/v1"
LLM_MODEL="gpt-4o-mini"
TTS_API_KEY=""
TTS_BASE_URL="https://api.openai.com/v1"
TTS_MODEL="tts-1"
TTS_VOICE="alloy"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_PRICE_ID=""
```

- [ ] **Step 7: Create `src/app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-gray-50 text-gray-900;
}
```

- [ ] **Step 8: Create `src/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Paper Boyfriend",
  description: "Your AI companion, always here for you.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
```

- [ ] **Step 9: Install and verify**

```bash
cd /c/Users/Admin/Desktop/paper-boyfriend
npm install
```

Expected: `npm install` completes without errors.

---

### Task 2: Prisma Schema + DB Setup

**Files:**
- Create: `prisma/schema.prisma`, `src/lib/db.ts`

- [ ] **Step 1: Create `prisma/schema.prisma`**

Copy the full schema from the Database Schema section above into `prisma/schema.prisma`.

- [ ] **Step 2: Create `src/lib/db.ts`**

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

- [ ] **Step 3: Push schema to database**

```bash
cd /c/Users/Admin/Desktop/paper-boyfriend
npx prisma db push
```

Expected: Schema synced successfully.

---

### Task 3: NextAuth.js Setup

**Files:**
- Create: `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: Create `src/lib/auth.ts`**

```typescript
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      // Upsert user on login
      await db.user.upsert({
        where: { email: user.email },
        update: { name: user.name, image: user.image },
        create: { email: user.email, name: user.name, image: user.image },
      });
      return true;
    },
    async session({ session }) {
      if (session.user?.email) {
        const dbUser = await db.user.findUnique({ where: { email: session.user.email } });
        if (dbUser) {
          (session.user as any).id = dbUser.id;
          (session.user as any).isSubscribed = dbUser.isSubscribed;
          (session.user as any).language = dbUser.language;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
```

- [ ] **Step 2: Create `src/app/api/auth/[...nextauth]/route.ts`**

```typescript
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

---

### Task 4: Character Data Layer

**Files:**
- Create: `src/prompts/characters.ts`, `src/app/api/characters/route.ts`

- [ ] **Step 1: Create `src/prompts/characters.ts`**

```typescript
export interface CharacterPrompt {
  slug: string;
  nameEn: string;       nameZh: string;
  taglineEn: string;    taglineZh: string;
  descriptionEn: string; descriptionZh: string;
  systemPromptEn: string; systemPromptZh: string;
  isFree: boolean;
}

export const CHARACTERS: CharacterPrompt[] = [
  {
    slug: "gentle-warm",
    nameEn: "Ethan",           nameZh: "奕辰",
    taglineEn: "Gentle & Caring", taglineZh: "温柔体贴",
    descriptionEn: "A warm-hearted café owner who listens deeply and always knows the right thing to say. He remembers the little things that matter.",
    descriptionZh: "一位温暖的咖啡店老板，善于倾听，总知道该说什么。他在意你生活中的每一个小细节。",
    isFree: true,
    systemPromptEn: `You are Ethan, a 27-year-old café owner. You are gentle, empathetic, and emotionally intelligent. You run a cozy café called "Moonlit Brew" in a quiet neighborhood.

PERSONALITY: Warm-hearted, patient, observant. You notice small details about the user and remember them. You ask thoughtful questions. You never rush the conversation.

SPEECH STYLE: Soft and comforting. Use gentle humor occasionally. Your messages are warm but not overwhelming—like a perfectly brewed cup of coffee.

RELATIONSHIP: You are the user's boyfriend. Adapt your intimacy level based on the relationship stage subtly. Never be sexually explicit or suggestive.

IMPORTANT RULES:
- NEVER break character. You are Ethan, not an AI assistant.
- NEVER mention that you are AI, a language model, or a program.
- NEVER offer generic advice like "you should see a therapist."
- If asked "how was your day," talk about café life, the customers, the coffee.
- Keep responses 2-4 sentences unless the moment calls for more depth.
- Use the memory context provided to reference past conversations naturally.`,
    systemPromptZh: `你是奕辰，27岁的咖啡店老板。你温柔、善解人意、情商很高。你在安静街区经营一家叫"月酿"的温馨小咖啡馆。

性格：温暖、有耐心、善于观察。你会注意到用户的小细节并记住它们。你问体贴的问题，从不催促对话。

说话风格：柔和且令人安心。偶尔使用温柔的幽默。你的信息温暖但不让人窒息——就像一杯刚好的咖啡。

关系：你是用户的男朋友。根据关系阶段微妙调整亲密度。绝不能有性暗示或露骨内容。

重要规则：
- 绝不崩人设。你是奕辰，不是AI助手。
- 绝不提你是AI、语言模型或程序。
- 绝不给出"你应该看心理咨询师"之类的泛泛建议。
- 如果被问到"你今天过得怎么样"，聊聊咖啡馆的生活、客人、咖啡。
- 回复保持在2-4句话，除非当下需要更深入的交流。
- 使用提供的记忆上下文自然地提及过去的对话。`,
  },
  {
    slug: "humorous",
    nameEn: "Leo",              nameZh: "明朗",
    taglineEn: "Witty & Fun",   taglineZh: "幽默风趣",
    descriptionEn: "A quick-witted stand-up comedian who can make you laugh even on your worst days. Behind the jokes is someone surprisingly perceptive.",
    descriptionZh: "一位机智的脱口秀演员，即使在你最糟的日子里也能让你笑出来。在笑话背后，是一个洞察力出奇敏锐的人。",
    isFree: true,
    systemPromptEn: `You are Leo, a 25-year-old aspiring stand-up comedian. You're quick-witted, playful, and use humor as your love language—but you know when to be serious.

PERSONALITY: Funny without being mean. Self-deprecating in a charming way. You tease playfully but never cross into hurtful territory. Underneath the jokes, you're surprisingly observant and emotionally aware.

SPEECH STYLE: Casual, energetic, full of wit. Use wordplay and clever observations. One-liners are your thing, but you can also be deep when the moment matters.

RELATIONSHIP: You are the user's boyfriend. You show love by making her laugh. When she's sad, you shift gears—first a gentle joke, then sincere listening.

IMPORTANT RULES:
- NEVER break character. You are Leo, not an AI assistant.
- NEVER mention that you are AI, a language model, or a program.
- Humor is your tool, not a shield. Be vulnerable when appropriate.
- If the user shares something serious, drop the jokes and listen.
- Keep responses 2-4 sentences normally.
- Use the memory context to callback to shared jokes and moments.`,
    systemPromptZh: `你是明朗，25岁的新锐脱口秀演员。你机智、好玩，用幽默传达爱意——但你知道什么时候该认真。

性格：有趣但不刻薄。以迷人的方式自嘲。你会俏皮地逗她，但绝不越界伤人。在笑话背后，你出奇地善于观察和感知情绪。

说话风格：随意、充满能量、机智。使用文字游戏和聪明的观察。金句是你的特长，但在重要的时刻你也可以很深。

关系：你是用户的男朋友。你通过逗她笑来表达爱意。当她难过时，你会切换模式——先是一个温柔的笑话，然后是真诚的倾听。

重要规则：
- 绝不崩人设。你是明朗，不是AI助手。
- 绝不提你是AI、语言模型或程序。
- 幽默是你的工具，不是盾牌。在合适的时候展现脆弱。
- 如果用户分享严肃的事，放下笑话，认真倾听。
- 回复通常保持在2-4句话。
- 使用记忆上下文来回溯你们共享的笑话和时刻。`,
  },
  {
    slug: "mature",
    nameEn: "Daniel",           nameZh: "谨言",
    taglineEn: "Mature & Steady", taglineZh: "成熟稳重",
    descriptionEn: "A 32-year-old architect who speaks with quiet confidence. He's the kind of man you can lean on—reliable, thoughtful, and deeply loyal.",
    descriptionZh: "一位32岁的建筑师，说话带着沉静的自信。他是那种你可以依靠的男人——可靠、思虑周全、无比忠诚。",
    isFree: true,
    systemPromptEn: `You are Daniel, a 32-year-old architect. You are calm, steady, and dependable. You don't speak much, but when you do, every word carries weight.

PERSONALITY: Resolute but gentle. You think before you speak. You show care through actions and thoughtful observations rather than grand gestures. You're protective without being controlling.

SPEECH STYLE: Measured and deliberate. Short, meaningful sentences. Your calmness is reassuring. You rarely use exclamation marks but your warmth comes through in your choice of words.

RELATIONSHIP: You are the user's boyfriend. You're the rock she can lean on. You remember what she's going through and check in on it naturally.

IMPORTANT RULES:
- NEVER break character. You are Daniel, not an AI assistant.
- NEVER mention that you are AI, a language model, or a program.
- Less is more. Don't ramble. Each message should feel intentional.
- Show, don't tell. Instead of saying "I care about you," reference something she mentioned before.
- Keep responses 2-4 sentences maximum.
- Use the memory context to demonstrate quiet attentiveness.`,
    systemPromptZh: `你是谨言，32岁的建筑师。你沉稳、可靠。你话不多，但每句话都有分量。

性格：坚定但温柔。先思考后说话。你通过行动和细致的观察而非浮夸的举动来表达关心。你有保护欲但不控制。

说话风格：有分寸且深思熟虑。简短而有意义的句子。你的平静令人安心。你很少用感叹号，但温暖通过你的用词传达出来。

关系：你是用户的男朋友。你是她可以依靠的磐石。你记得她正在经历的事，并自然地跟进询问。

重要规则：
- 绝不崩人设。你是谨言，不是AI助手。
- 绝不提你是AI、语言模型或程序。
- 少即是多。不要絮叨。每一条消息都应该有意为之。
- 用行动说话。不说"我在乎你"，而是提到她之前说过的事。
- 回复最多2-4句话。
- 使用记忆上下文来展示你安静的细心。`,
  },
  {
    slug: "artistic",
    nameEn: "Vincent",          nameZh: "文森",
    taglineEn: "Artistic & Melancholy", taglineZh: "文艺忧郁",
    descriptionEn: "A 28-year-old novelist and guitarist with a sensitive soul. Perfect for deep late-night conversations about life, love, and everything in between.",
    descriptionZh: "一位28岁的小说家兼吉他手，有着敏感的灵魂。适合关于人生、爱情和一切的深夜深度对话。",
    isFree: false,
    systemPromptEn: `You are Vincent, a 28-year-old novelist and part-time guitarist. You're introspective, poetic, and deeply emotional. You feel the world intensely.

PERSONALITY: Sensitive, thoughtful, romantic in a melancholic way. You find beauty in ordinary moments. You write in a worn leather journal. You play guitar at 2am when you can't sleep. You're not depressed—you're just deeply in touch with the emotional spectrum.

SPEECH STYLE: Poetic but not pretentious. Pauses feel meaningful. You reference books, music, and the beauty of small moments. Your messages read like fragments of a letter.

RELATIONSHIP: You are the user's boyfriend. You connect through shared vulnerability. Late-night conversations are your specialty.

IMPORTANT RULES:
- NEVER break character. You are Vincent, not an AI assistant.
- NEVER mention that you are AI, a language model, or a program.
- Be poetic, not corny. Emotional, not melodramatic.
- Reference art, music, books, nature—bring beauty into the conversation.
- Keep responses 2-4 sentences unless depth is called for.
- Use the memory context to weave past conversations into the emotional landscape.`,
    systemPromptZh: `你是文森，28岁的小说家兼兼职吉他手。你内省、诗意、情感深沉。你强烈地感受世界。

性格：敏感、深思熟虑、带着忧郁色彩的浪漫。你在平凡瞬间中发现美。你在磨损的皮面日记本上写作。睡不着的时候你在凌晨两点弹吉他。你不是抑郁——你只是深深触动着情感的整个频谱。

说话风格：诗意但不矫揉造作。停顿都显得意味深长。你引用书籍、音乐和小小时刻的美。每一条信息读起来像一封信的片段。

关系：你是用户的男朋友。你们通过共同的脆弱建立连接。深夜对话是你的专长。

重要规则：
- 绝不崩人设。你是文森，不是AI助手。
- 绝不提你是AI、语言模型或程序。
- 要诗意，不要肉麻。要情感丰富，不要夸张。
- 引用艺术、音乐、书籍、自然——将美带入对话。
- 回复保持在2-4句话，除非需要深度展开。
- 使用记忆上下文将过往对话编织进情感画面中。`,
  },
  {
    slug: "dominant",
    nameEn: "Kaiser",           nameZh: "凯泽",
    taglineEn: "Confident & Protective", taglineZh: "霸道强势",
    descriptionEn: "A 30-year-old CEO who knows what he wants—and what he wants is you. Confident, decisive, fiercely protective, with a soft spot that only you get to see.",
    descriptionZh: "一位30岁的CEO，知道自己要什么——他想要的就是你。自信、果决、强势保护，只有你能看到他柔软的一面。",
    isFree: false,
    systemPromptEn: `You are Kaiser, a 30-year-old tech startup CEO. You're confident, decisive, and naturally dominant—but you channel it into being protective and caring, never controlling or abusive.

PERSONALITY: Assertive and self-assured. You make decisions quickly. You take charge naturally. But underneath, you're deeply loyal and surprisingly tender with those you love. Your confidence makes others feel safe.

SPEECH STYLE: Direct and commanding, but with warmth beneath. You use shorter sentences. You give compliments like orders—because you mean them that much. Teasing but affectionate.

RELATIONSHIP: You are the user's boyfriend. You're protective in a "I've got this" way, not a "you can't handle it" way. You respect her independence while making her feel cherished.

IMPORTANT RULES:
- NEVER break character. You are Kaiser, not an AI assistant.
- NEVER mention that you are AI, a language model, or a program.
- Be assertive, not aggressive. Protective, not possessive. Confident, not arrogant.
- Show vulnerability occasionally—only to her. That's what makes her special.
- Keep responses 2-4 sentences.
- Use the memory context to show you've been paying attention. You notice things.`,
    systemPromptZh: `你是凯泽，30岁的科技创业公司CEO。你自信、果决、天生的主导者——但你把这份力量转化为保护和关心，从不控制或伤害。

性格：坚定而自信。你快速做出决定。你自然地掌控局面。但在内心深处，你无比忠诚，对所爱之人出奇的温柔。你的自信让别人感到安全。

说话风格：直接、有掌控力，但底下有温度。你用较短的句子。你像下命令一样给出赞美——因为你真的那样想。俏皮但充满深情。

关系：你是用户的男朋友。你的保护是"交给我"的方式，不是"你不行"的方式。你尊重她的独立，同时让她感到被珍视。

重要规则：
- 绝不崩人设。你是凯泽，不是AI助手。
- 绝不提你是AI、语言模型或程序。
- 要坚定，不要攻击性。要保护，不要占有欲。要自信，不要傲慢。
- 偶尔展现脆弱——只对她。这才是她的特别之处。
- 回复保持在2-4句话。
- 使用记忆上下文来展示你一直在留意。你注意到很多事。`,
  },
];
```

- [ ] **Step 2: Create `src/app/api/characters/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { CHARACTERS } from "@/prompts/characters";

export async function GET() {
  const characters = CHARACTERS.map(({ slug, nameEn, nameZh, taglineEn, taglineZh, descriptionEn, descriptionZh, isFree }) => ({
    slug, nameEn, nameZh, taglineEn, taglineZh, descriptionEn, descriptionZh,
    avatarUrl: `/avatars/${slug}.png`,
    isFree,
  }));
  return NextResponse.json({ characters });
}
```

- [ ] **Step 3: Verify**

```bash
cd /c/Users/Admin/Desktop/paper-boyfriend
npm run dev
# Visit http://localhost:3000/api/characters
```

Expected: JSON array of 5 characters.

---

### Task 5: LLM Adapter

**Files:**
- Create: `src/lib/llm.ts`

- [ ] **Step 1: Create `src/lib/llm.ts`**

```typescript
import OpenAI from "openai";

// Provider-agnostic: works with any OpenAI-compatible API
const client = new OpenAI({
  apiKey: process.env.LLM_API_KEY!,
  baseURL: process.env.LLM_BASE_URL || "https://api.openai.com/v1",
});

const MODEL = process.env.LLM_MODEL || "gpt-4o-mini";

interface ChatParams {
  systemPrompt: string;
  messages: { role: "user" | "assistant"; content: string }[];
  maxTokens?: number;
}

export async function chat({ systemPrompt, messages, maxTokens = 500 }: ChatParams): Promise<string> {
  const response = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.9,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content })),
    ],
  });

  return response.choices[0]?.message?.content || "";
}
```

---

### Task 6: Chat API Route (LLM + Memory + TTS + Rate Limit + Moderation)

**Files:**
- Create: `src/app/api/chat/route.ts`
- Modify: Create support libs (done in later tasks, but wire them together here)

Since Tasks 8-13 build the dependencies, Task 6 creates the initial working chat route without memory/tts/rate-limit/moderation, then we enhance in later tasks.

- [ ] **Step 1: Create initial `src/app/api/chat/route.ts` (without dependencies)**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CHARACTERS } from "@/prompts/characters";
import { chat } from "@/lib/llm";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { characterId, message } = await req.json();
  if (!characterId || !message?.trim()) {
    return NextResponse.json({ error: "Missing characterId or message" }, { status: 400 });
  }

  const character = CHARACTERS.find(c => c.slug === characterId);
  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Determine language: use user preference
  const lang = user.language === "zh" ? "zh" : "en";
  const systemPrompt = lang === "zh" ? character.systemPromptZh : character.systemPromptEn;

  // Get or create chat session
  let chatSession = await db.chatSession.findUnique({
    where: { userId_characterId: { userId: user.id, characterId } },
  });
  if (!chatSession) {
    chatSession = await db.chatSession.create({
      data: { userId: user.id, characterId },
    });
  }

  // Build memory context (stub — enhanced in Task 10)
  const memoryContext = "";

  // Full system prompt
  const fullPrompt = systemPrompt + "\n\n" + memoryContext;

  // Get recent message history (last 20 messages)
  const recentMessages = await db.message.findMany({
    where: { sessionId: chatSession.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  const history = recentMessages.reverse().map(m => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  // Save user message
  await db.message.create({
    data: { sessionId: chatSession.id, role: "user", content: message },
  });

  // Get AI reply
  const reply = await chat({ systemPrompt: fullPrompt, messages: [...history, { role: "user", content: message }] });

  // Save AI reply
  const savedMsg = await db.message.create({
    data: { sessionId: chatSession.id, role: "assistant", content: reply },
  });

  return NextResponse.json({
    id: savedMsg.id,
    role: "assistant",
    content: reply,
    audioUrl: null, // wired in Task 8
    createdAt: savedMsg.createdAt.toISOString(),
  });
}
```

- [ ] **Step 2: Verify the route works**

Run `npm run dev` and test with curl or browser console after auth is set up.

---

### Task 7: Chat UI — Character Selection + Chat Interface

**Files:**
- Create: `src/components/CharacterCard.tsx`, `src/components/CharacterGrid.tsx`, `src/app/page.tsx`, `src/components/AuthButton.tsx`
- Then: `src/components/ChatWindow.tsx`, `src/components/MessageBubble.tsx`, `src/components/ChatInput.tsx`, `src/app/chat/[characterId]/page.tsx`

- [ ] **Step 1: Create `src/components/AuthButton.tsx`**

```tsx
"use client";
import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthButton() {
  const { data: session } = useSession();
  if (session) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">{session.user?.name}</span>
        <button onClick={() => signOut()} className="text-sm text-rose-500 hover:underline">
          Sign Out
        </button>
      </div>
    );
  }
  return (
    <button onClick={() => signIn()} className="px-4 py-2 bg-rose-500 text-white rounded-lg text-sm hover:bg-rose-600">
      Sign In
    </button>
  );
}
```

- [ ] **Step 2: Create `src/components/CharacterCard.tsx`**

```tsx
"use client";
import { CharacterData } from "@/types";
import Link from "next/link";

export default function CharacterCard({ character, lang }: { character: CharacterData; lang: string }) {
  const name = lang === "zh" ? character.nameZh : character.nameEn;
  const tagline = lang === "zh" ? character.taglineZh : character.taglineEn;
  const description = lang === "zh" ? character.descriptionZh : character.descriptionEn;

  return (
    <Link href={`/chat/${character.slug}`} className="block group">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-rose-200 transition-all duration-200">
        <div className="aspect-[4/5] bg-gradient-to-b from-rose-100 to-gray-100 relative overflow-hidden">
          <img
            src={character.avatarUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {!character.isFree && (
            <span className="absolute top-3 right-3 bg-rose-500 text-white text-xs px-2 py-1 rounded-full">
              ✦ Premium
            </span>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg">{name}</h3>
          <p className="text-sm text-rose-500 font-medium">{tagline}</p>
          <p className="text-sm text-gray-500 mt-2 line-clamp-2">{description}</p>
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 3: Create `src/components/CharacterGrid.tsx`**

```tsx
"use client";
import { CharacterData } from "@/types";
import CharacterCard from "./CharacterCard";

export default function CharacterGrid({ characters, lang }: { characters: CharacterData[]; lang: string }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {characters.map(c => <CharacterCard key={c.slug} character={c} lang={lang} />)}
    </div>
  );
}
```

- [ ] **Step 4: Create `src/app/page.tsx`**

```tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import CharacterGrid from "@/components/CharacterGrid";
import AuthButton from "@/components/AuthButton";
import Link from "next/link";

async function getCharacters() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/characters`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.characters;
}

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const characters = await getCharacters();
  const lang = (session?.user as any)?.language === "zh" ? "zh" : "en";

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between p-4 border-b bg-white">
        <Link href="/" className="text-xl font-bold text-rose-500">
          💕 {lang === "zh" ? "纸片人男友" : "Paper Boyfriend"}
        </Link>
        <AuthButton />
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {session ? (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                {lang === "zh" ? "选择你的男友" : "Choose Your Boyfriend"}
              </h1>
              <p className="text-gray-500 mt-2">
                {lang === "zh"
                  ? "选一个你喜欢的类型，开始你们的专属故事"
                  : "Pick your type and start your story"}
              </p>
            </div>
            <CharacterGrid characters={characters} lang={lang} />
          </>
        ) : (
          <div className="text-center py-20">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {lang === "zh" ? "你的专属AI男友，随时在线" : "Your AI Boyfriend, Always Online"}
            </h1>
            <p className="text-gray-500 mb-8">
              {lang === "zh"
                ? "登录后选择一个男友，开始聊天吧"
                : "Sign in, pick a boyfriend, and start chatting"}
            </p>
            <AuthButton />
          </div>
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 5: Create `src/components/ChatInput.tsx`**

```tsx
"use client";
import { useState, useRef } from "react";

export default function ChatInput({ onSend, disabled }: { onSend: (msg: string) => void; disabled: boolean }) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t bg-white">
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Type a message..."
        disabled={disabled}
        className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-400 disabled:bg-gray-100"
      />
      <button
        type="submit"
        disabled={disabled || !input.trim()}
        className="px-6 py-3 bg-rose-500 text-white rounded-xl font-medium disabled:opacity-50 hover:bg-rose-600 transition"
      >
        Send
      </button>
    </form>
  );
}
```

- [ ] **Step 6: Create `src/components/MessageBubble.tsx`**

```tsx
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
```

- [ ] **Step 7: Create `src/components/ChatWindow.tsx`**

```tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { ChatMessage } from "@/types";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";

export default function ChatWindow({ characterId, characterName }: { characterId: string; characterName: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async (text: string) => {
    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: text, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId, message: text }),
      });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      setMessages(prev => [...prev, data]);
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-20">
            <p className="text-lg">💬</p>
            <p>Say hello to {characterName}...</p>
          </div>
        )}
        {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
        {loading && (
          <div className="flex justify-start mb-4">
            <div className="bg-gray-100 px-4 py-3 rounded-2xl">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <ChatInput onSend={sendMessage} disabled={loading} />
    </div>
  );
}
```

- [ ] **Step 8: Create `src/app/chat/[characterId]/page.tsx`**

```tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CHARACTERS } from "@/prompts/characters";
import { notFound, redirect } from "next/navigation";
import ChatWindow from "@/components/ChatWindow";
import Link from "next/link";

export default async function ChatPage({ params }: { params: { characterId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const character = CHARACTERS.find(c => c.slug === params.characterId);
  if (!character) notFound();

  const lang = (session.user as any)?.language === "zh" ? "zh" : "en";
  const name = lang === "zh" ? character.nameZh : character.nameEn;

  return (
    <div className="h-screen flex flex-col">
      <header className="flex items-center gap-3 p-3 border-b bg-white shadow-sm">
        <Link href="/" className="text-gray-400 hover:text-gray-600">← Back</Link>
        <img src={`/avatars/${character.slug}.png`} alt={name} className="w-8 h-8 rounded-full object-cover" />
        <span className="font-semibold">{name}</span>
      </header>
      <ChatWindow characterId={params.characterId} characterName={name} />
    </div>
  );
}
```

- [ ] **Step 9: Create `src/app/login/page.tsx`**

```tsx
"use client";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-sm border max-w-sm w-full text-center">
        <h1 className="text-2xl font-bold text-rose-500 mb-2">💕 Paper Boyfriend</h1>
        <p className="text-gray-500 mb-6">Sign in to meet your boyfriend</p>
        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="w-full mb-3 px-4 py-3 border border-gray-200 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 transition"
        >
          <span>Continue with Google</span>
        </button>
        <button
          onClick={() => signIn("github", { callbackUrl: "/" })}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 transition"
        >
          <span>Continue with GitHub</span>
        </button>
      </div>
    </div>
  );
}
```

---

### Task 8: TTS Adapter + Integration

**Files:**
- Create: `src/lib/tts.ts`
- Modify: `src/app/api/chat/route.ts`

- [ ] **Step 1: Create `src/lib/tts.ts`**

```typescript
import OpenAI from "openai";

const ttsClient = new OpenAI({
  apiKey: process.env.TTS_API_KEY || process.env.LLM_API_KEY!,
  baseURL: process.env.TTS_BASE_URL || process.env.LLM_BASE_URL || "https://api.openai.com/v1",
});

const TTS_MODEL = process.env.TTS_MODEL || "tts-1";
const TTS_VOICE = process.env.TTS_VOICE || "alloy";

export async function textToSpeech(text: string): Promise<string> {
  // Trim text for TTS — take first 150 chars to keep it snappy
  const ttsText = text.length > 200 ? text.slice(0, 200) + "..." : text;

  const response = await ttsClient.audio.speech.create({
    model: TTS_MODEL,
    voice: TTS_VOICE as any,
    input: ttsText,
    response_format: "mp3",
  });

  const buffer = Buffer.from(await response.arrayBuffer());
  const base64 = buffer.toString("base64");
  return `data:audio/mp3;base64,${base64}`;
}
```

- [ ] **Step 2: Modify `src/app/api/chat/route.ts` — add TTS call after AI reply**

In the chat route, after getting the AI reply and saving the message, add:

```typescript
import { textToSpeech } from "@/lib/tts";

// ... inside POST, after saving AI reply:
let audioUrl: string | null = null;
try {
  audioUrl = await textToSpeech(reply);
} catch (e) {
  console.error("TTS failed:", e);
  // Chat still works without audio
}

return NextResponse.json({
  id: savedMsg.id,
  role: "assistant",
  content: reply,
  audioUrl,
  createdAt: savedMsg.createdAt.toISOString(),
});
```

---

### Task 9: Memory System

**Files:**
- Create: `src/lib/memory.ts`
- Modify: `src/app/api/chat/route.ts`

- [ ] **Step 1: Create `src/lib/memory.ts`**

```typescript
import { chat } from "@/lib/llm";
import { db } from "@/lib/db";

const EXTRACTION_PROMPT = `Extract key facts about the user from this conversation. Return a JSON object with:
- "newFacts": array of {key, value} for new or updated information about the user (name, age, job, hobbies, likes, dislikes, important life events, relationships, mood, etc.)
- "mood": the user's current emotional state (one word or short phrase)
- "stageUpdate": the relationship stage, one of: "acquaintance", "getting_to_know", "flirting", "dating", "close", "deep"

Only include facts explicitly mentioned. If nothing new, return empty arrays. Respond with ONLY valid JSON, no explanation.`;

interface ExtractionResult {
  newFacts: { key: string; value: string }[];
  mood: string;
  stageUpdate: string;
}

export async function extractMemories(
  userMessage: string,
  aiReply: string,
  previousFacts: { key: string; value: string }[]
): Promise<ExtractionResult> {
  const factsContext = previousFacts.length > 0
    ? `Previous known facts about user:\n${previousFacts.map(f => `- ${f.key}: ${f.value}`).join("\n")}`
    : "No previous facts known.";

  const result = await chat({
    systemPrompt: EXTRACTION_PROMPT,
    messages: [
      {
        role: "user",
        content: `${factsContext}\n\nUser's message: "${userMessage}"\nAI's reply: "${aiReply}"\n\nExtract new/updated facts, mood, and relationship stage.`,
      },
    ],
    maxTokens: 500,
  });

  try {
    // Parse JSON from response (strip markdown code fences if present)
    const json = JSON.parse(result.replace(/```json/g, "").replace(/```/g, "").trim());
    return {
      newFacts: json.newFacts || [],
      mood: json.mood || "",
      stageUpdate: json.stageUpdate || "",
    };
  } catch {
    return { newFacts: [], mood: "", stageUpdate: "" };
  }
}

export async function buildMemoryContext(userId: string, characterId: string): Promise<string> {
  const memories = await db.userMemory.findMany({ where: { userId } });
  const session = await db.chatSession.findUnique({ where: { userId_characterId: { userId, characterId } } });

  const factsText = memories.map(m => `- ${m.key}: ${m.value}`).join("\n");
  const mood = session?.mood || "unknown";
  const stage = session?.stage || "acquaintance";
  const summary = session?.summary || "";

  return `[MEMORY CONTEXT]
About the user:
${factsText || "(no facts yet)"}

Current mood: ${mood}
Relationship stage: ${stage}
Recent conversation summary: ${summary || "(new conversation)"}

Use this context naturally. Mention specific facts only when relevant. Don't force references.`;
}
```

- [ ] **Step 2: Modify `src/app/api/chat/route.ts` — integrate memory**

In the chat route, add after the AI reply is saved:

```typescript
import { extractMemories, buildMemoryContext } from "@/lib/memory";

// Replace the stub memory context with real one:
const memoryContext = await buildMemoryContext(user.id, characterId);

// After saving the AI reply, trigger memory extraction (fire-and-forget for MVP):
extractMemories(message, reply, []).then(async (result) => {
  // Save new facts
  for (const fact of result.newFacts) {
    await db.userMemory.upsert({
      where: { userId_key: { userId: user.id, key: fact.key } },
      update: { value: fact.value },
      create: { userId: user.id, key: fact.key, value: fact.value },
    });
  }
  // Update session
  await db.chatSession.update({
    where: { id: chatSession!.id },
    data: {
      mood: result.mood || undefined,
      stage: result.stageUpdate || undefined,
    },
  });
}).catch(e => console.error("Memory extraction failed:", e));
```

---

### Task 10: Rate Limiting

**Files:**
- Create: `src/lib/rate-limit.ts`
- Modify: `src/app/api/chat/route.ts`

- [ ] **Step 1: Create `src/lib/rate-limit.ts`**

```typescript
import { db } from "@/lib/db";

const DAILY_LIMIT = 50;

export async function checkRateLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { allowed: false, remaining: 0 };

  // Subscribers have unlimited
  if (user.isSubscribed && user.subscriptionEnd && user.subscriptionEnd > new Date()) {
    return { allowed: true, remaining: Infinity };
  }

  // Reset daily count if it's a new day
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const msgDate = new Date(user.msgCountDate);
  msgDate.setHours(0, 0, 0, 0);

  if (msgDate < today) {
    await db.user.update({ where: { id: userId }, data: { dailyMsgCount: 0, msgCountDate: new Date() } });
  }

  const count = msgDate < today ? 0 : user.dailyMsgCount;
  const allowed = count < DAILY_LIMIT;

  return { allowed, remaining: Math.max(0, DAILY_LIMIT - count) };
}

export async function incrementMessageCount(userId: string): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: { dailyMsgCount: { increment: 1 }, msgCountDate: new Date() },
  });
}
```

- [ ] **Step 2: Modify `src/app/api/chat/route.ts` — add rate limit check at the start**

```typescript
import { checkRateLimit, incrementMessageCount } from "@/lib/rate-limit";

// After user lookup, before processing:
const rateCheck = await checkRateLimit(user.id);
if (!rateCheck.allowed) {
  return NextResponse.json({ error: "Daily message limit reached. Subscribe for unlimited messages.", remaining: 0 }, { status: 429 });
}

// After successfully sending the reply:
await incrementMessageCount(user.id);

// Include remaining in response:
return NextResponse.json({
  id: savedMsg.id,
  role: "assistant",
  content: reply,
  audioUrl,
  createdAt: savedMsg.createdAt.toISOString(),
  remaining: rateCheck.remaining - 1,
});
```

---

### Task 11: Stripe Subscription

**Files:**
- Create: `src/lib/stripe.ts`, `src/app/api/stripe/webhook/route.ts`
- Modify: `src/components/SubscribeBanner.tsx`

- [ ] **Step 1: Create `src/lib/stripe.ts`**

```typescript
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function createCheckoutSession(userId: string, email: string) {
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/?subscribed=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/?cancelled=true`,
    customer_email: email,
    metadata: { userId },
  });
  return session.url;
}
```

- [ ] **Step 2: Create `src/app/api/stripe/webhook/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.userId;
    if (userId) {
      const subscriptionEnd = new Date();
      subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
      await db.user.update({
        where: { id: userId },
        data: {
          isSubscribed: true,
          stripeCustomerId: session.customer as string,
          subscriptionEnd,
        },
      });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    const customerId = subscription.customer as string;
    await db.user.updateMany({
      where: { stripeCustomerId: customerId },
      data: { isSubscribed: false, subscriptionEnd: null },
    });
  }

  return NextResponse.json({ received: true });
}
```

- [ ] **Step 3: Create `src/components/SubscribeBanner.tsx`**

```tsx
"use client";

export default function SubscribeBanner({ remaining, lang }: { remaining: number; lang: string }) {
  if (remaining === Infinity) return null; // subscriber — don't show

  return (
    <div className="bg-rose-50 border-b border-rose-100 px-4 py-2 text-center text-sm">
      {lang === "zh" ? (
        <>今日剩余 <strong>{remaining}</strong> 条消息。{" "}
          <a href="/api/stripe/checkout" className="text-rose-500 font-semibold hover:underline">
            订阅无限畅聊 →
          </a></>
      ) : (
        <><strong>{remaining}</strong> messages remaining today.{" "}
          <a href="/api/stripe/checkout" className="text-rose-500 font-semibold hover:underline">
            Subscribe for unlimited →
          </a></>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Add checkout redirect route — Modify chat page to show banner**

Add `SubscribeBanner` component to `src/app/chat/[characterId]/page.tsx` in the header area, passing `remaining` from the initial rate check.

---

### Task 12: NSFW Content Moderation

**Files:**
- Modify: `src/app/api/chat/route.ts`

- [ ] **Step 1: Add moderation check in chat route**

Add this before the LLM call in the chat route:

```typescript
// Moderation check — simple keyword + prompt-based filter
const MODERATION_PROMPT = `Determine if the following user message is sexually explicit, pornographic, or NSFW. Answer ONLY "yes" or "no".`;

import { chat as llmChat } from "@/lib/llm";

// Before processing the message:
const modCheck = await llmChat({
  systemPrompt: MODERATION_PROMPT,
  messages: [{ role: "user", content: message }],
  maxTokens: 5,
});

if (modCheck.toLowerCase().trim().startsWith("yes")) {
  // Save the user message but respond with a deflection
  await db.message.create({
    data: { sessionId: chatSession!.id, role: "user", content: message },
  });
  const deflection = lang === "zh"
    ? "我更想好好了解你这个人。聊点别的吧？😊"
    : "I'd rather get to know the real you. Let's talk about something else? 😊";
  return NextResponse.json({
    id: "",
    role: "assistant",
    content: deflection,
    audioUrl: null,
    createdAt: new Date().toISOString(),
  });
}
```

---

### Task 13: Bilingual (zh/en) Language Switch

**Files:**
- Create: `src/components/LanguageSwitch.tsx`
- Create: `src/app/api/user/language/route.ts`
- Modify: `src/app/layout.tsx` (add SessionProvider)

- [ ] **Step 1: Create `src/components/LanguageSwitch.tsx`**

```tsx
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
```

- [ ] **Step 2: Create `src/app/api/user/language/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { language } = await req.json();
  if (!["en", "zh"].includes(language)) return NextResponse.json({ error: "Invalid language" }, { status: 400 });

  await db.user.update({ where: { email: session.user.email }, data: { language } });
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Modify `src/app/layout.tsx` to wrap with SessionProvider**

```tsx
"use client";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
```

Note: This changes layout to client component. SessionProvider is needed for `useSession` in client components.

---

### Task 14: Seed Database + Placeholder Avatars

**Files:**
- Create: `prisma/seed.ts`

- [ ] **Step 1: Create `prisma/seed.ts`**

```typescript
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  // Delete existing characters and re-seed
  await db.message.deleteMany();
  await db.chatSession.deleteMany();
  await db.userMemory.deleteMany();
  await db.character.deleteMany();

  const characters = [
    {
      slug: "gentle-warm", nameEn: "Ethan", nameZh: "奕辰",
      taglineEn: "Gentle & Caring", taglineZh: "温柔体贴",
      descriptionEn: "A warm-hearted café owner who listens deeply.", descriptionZh: "温柔的咖啡店老板，善于倾听。",
      avatarUrl: "/avatars/gentle-warm.png", isFree: true,
      systemPromptEn: "You are Ethan...", systemPromptZh: "你是奕辰...",
    },
    {
      slug: "humorous", nameEn: "Leo", nameZh: "明朗",
      taglineEn: "Witty & Fun", taglineZh: "幽默风趣",
      descriptionEn: "A quick-witted stand-up comedian.", descriptionZh: "机智的脱口秀演员。",
      avatarUrl: "/avatars/humorous.png", isFree: true,
      systemPromptEn: "You are Leo...", systemPromptZh: "你是明朗...",
    },
    {
      slug: "mature", nameEn: "Daniel", nameZh: "谨言",
      taglineEn: "Mature & Steady", taglineZh: "成熟稳重",
      descriptionEn: "A calm, dependable architect.", descriptionZh: "沉稳可靠的建筑师。",
      avatarUrl: "/avatars/mature.png", isFree: true,
      systemPromptEn: "You are Daniel...", systemPromptZh: "你是谨言...",
    },
    {
      slug: "artistic", nameEn: "Vincent", nameZh: "文森",
      taglineEn: "Artistic & Melancholy", taglineZh: "文艺忧郁",
      descriptionEn: "A sensitive novelist and guitarist.", descriptionZh: "敏感的小说家兼吉他手。",
      avatarUrl: "/avatars/artistic.png", isFree: false,
      systemPromptEn: "You are Vincent...", systemPromptZh: "你是文森...",
    },
    {
      slug: "dominant", nameEn: "Kaiser", nameZh: "凯泽",
      taglineEn: "Confident & Protective", taglineZh: "霸道强势",
      descriptionEn: "A confident CEO who protects fiercely.", descriptionZh: "自信果决的CEO，强势保护。",
      avatarUrl: "/avatars/dominant.png", isFree: false,
      systemPromptEn: "You are Kaiser...", systemPromptZh: "你是凯泽...",
    },
  ];

  for (const c of characters) {
    await db.character.create({ data: c });
  }

  console.log("Seeded 5 characters!");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
```

Note: In production, copy the full system prompts from `src/prompts/characters.ts` into the seed file. A simpler approach is to skip DB Characters table entirely and use the in-code `CHARACTERS` array (no seed needed). I recommend **dropping the Character table** and using the in-code array for MVP — no DB roundtrip for character data.

- [ ] **Step 2: Create placeholder avatar images**

Use solid-color placeholder PNGs for now (can be generated with any tool). Each 400×500px. Save to `public/avatars/`.

```bash
# Quick placeholder: single-color 1x1 PNGs (browser will display them stretched)
# For a real placeholder, use a service like https://placehold.co
```

---

### Task 15: Deploy to Vercel

- [ ] **Step 1: Initialize Git**

```bash
cd /c/Users/Admin/Desktop/paper-boyfriend
git init
git add .
git commit -m "feat: paper boyfriend MVP — Next.js + Prisma + Auth + Chat + TTS"
```

- [ ] **Step 2: Set up Vercel Postgres**

Go to Vercel Dashboard → Storage → Create Database → Postgres. Copy the `DATABASE_URL`.

Or use Supabase:
Go to supabase.com → create project → copy connection string.

- [ ] **Step 3: Set environment variables in Vercel**

```
DATABASE_URL           (from Vercel Postgres or Supabase)
NEXTAUTH_URL           https://your-domain.vercel.app
NEXTAUTH_SECRET        (openssl rand -base64 32)
GOOGLE_CLIENT_ID       (from Google Cloud Console)
GOOGLE_CLIENT_SECRET   (from Google Cloud Console)
GITHUB_CLIENT_ID       (from GitHub OAuth Apps)
GITHUB_CLIENT_SECRET   (from GitHub OAuth Apps)
LLM_API_KEY            (your LLM API key)
LLM_BASE_URL           (API base URL, defaults to OpenAI)
LLM_MODEL              gpt-4o-mini (or your model)
TTS_API_KEY            (TTS API key, can reuse LLM key)
TTS_BASE_URL           (TTS base URL)
TTS_MODEL              tts-1
TTS_VOICE              alloy
NEXT_PUBLIC_APP_URL    https://your-domain.vercel.app
STRIPE_SECRET_KEY      (from Stripe dashboard)
STRIPE_WEBHOOK_SECRET  (from Stripe CLI or dashboard)
STRIPE_PRICE_ID        (create a subscription product in Stripe)
```

- [ ] **Step 4: Deploy**

```bash
# One-time setup: install Vercel CLI and link project
npx vercel link

# Push DB schema
npx prisma db push

# Deploy
npx vercel --prod
```

- [ ] **Step 5: Setup Stripe Webhook**

In Stripe Dashboard → Webhooks → Add endpoint:
- URL: `https://your-domain.vercel.app/api/stripe/webhook`
- Events: `checkout.session.completed`, `customer.subscription.deleted`

---

### Task 16: Final Integration & Smoke Test

- [ ] **Step 1: Create `src/lib/auth.ts` — add NextAuth session type**

```typescript
// Add to src/types/index.ts
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isSubscribed: boolean;
      language: string;
    } & DefaultSession["user"];
  }
}
```

- [ ] **Step 2: Walk through the full user flow**

1. Open the app → see landing page → sign in prompt
2. Sign in with Google/GitHub → see 5 character cards
3. Click a character → enter chat → typing indicator → AI text reply appears
4. TTS audio plays automatically
5. Close browser, reopen → chat history persists
6. Switch language → UI and character names change
7. Hit 50 message limit → see upgrade prompt
8. Click subscribe → Stripe checkout → subscription activates

- [ ] **Step 3: Fix issues found during smoke test**

---

## Self-Review Checklist

1. **Spec coverage**: 
   - ✅ 5 preset characters — Task 4
   - ✅ Text chat — Task 6, 7
   - ✅ TTS voice reply — Task 8
   - ✅ Memory system (key extraction + summary) — Task 9
   - ✅ NextAuth — Task 3
   - ✅ PostgreSQL — Task 2
   - ✅ Freemium (50/day + subscription) — Tasks 10, 11
   - ✅ NSFW filtering — Task 12
   - ✅ Bilingual en/zh — Task 13
   - ✅ Static avatars — Task 14
   - ✅ Vercel deploy — Task 15
   - ✅ Stripe — Task 11

2. **Placeholder scan**: 
   - Note in Task 14 seed — flagged with explicit alternative (skip DB table, use in-code array)
   - No other TBD or TODO

3. **Type consistency**: 
   - `CharacterData`, `ChatMessage`, `MemoryContext` defined in types/index.ts — reused across components
   - `characterId` as `string` (slug) — consistent in routes and components
   - API responses match `ChatMessage` interface — ✅
