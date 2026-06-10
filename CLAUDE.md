# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Swaylove** — AI companion chat app for overseas markets. Women 18-25 choose from 5 preset characters, chat via text + TTS voice replies. Freemium: 50 msgs/day free, $4.99-6.99/month via Stripe. "Let your heart sway."

## 技术栈

Next.js 14 App Router, TypeScript, Prisma + PostgreSQL (Supabase), **BetterAuth v1.6.14** (从 NextAuth v4 迁移), Tailwind CSS, `@supabase/supabase-js` (Storage), `node-edge-tts` (微软 Edge TTS), OpenAI-compatible LLM adapter. 当前 LLM 用 DeepSeek。

## 命令

```bash
npm run dev          # Dev server (localhost:3000)
npm run build        # 生产构建 (+ 类型检查)
npx prisma db push   # 同步 schema 到 PostgreSQL
npx prisma generate  # 重新生成 Prisma client
npm run db:seed      # 导入 5 个人设角色
npx tsc --noEmit     # 仅类型检查
```

`npm install` 后 `prisma generate` 通过 postinstall 自动运行。

**重要**: 安装新包需 `npm install <pkg> --legacy-peer-deps`，因为 `better-auth` 依赖 zod v4，而 `openai` 依赖 zod v3，二者 peer dependency 冲突。

缺少 `.env.local` 时从 `.env.local.example` 复制。

## Architecture

### Chat Pipeline

`POST /api/chat` — every user message flows through:

```
Auth → Validate (max 2000 chars) → Rate limit (atomic) → Memory context → NSFW check → LLM chat (30s timeout) → Save reply → TTS (sync) → Save audioUrl → (async) Memory extraction → Response
```

Key behaviors:
- **Rate limit 原子化 (2026-06-10)** — `checkAndIncrementRateLimit` 将检查+递增合并为一次原子操作 (`updateMany` + `WHERE dailyMsgCount < 50`)，消除并发竞态。免费: 50 条/天，订阅: 无限。
- **NSFW moderation** uses a cheap LLM call (maxTokens:5). Exact "yes" match only (non-alpha chars stripped first to avoid false positives on "yesterday" etc.)
- **LLM 超时 (2026-06-10)** — OpenAI client 设 `timeout: 30000` (30s) + `maxRetries: 1`，防止 DeepSeek 挂死时请求永久挂起。
- **TTS is synchronous** — `node-edge-tts` (~1s) generates audio before response. Failure caught silently (chat works without audio). **2026-06-10**: 加空 buffer 检测，Edge TTS 网络异常产空文件时抛异常不传播。
- **Memory extraction** is fire-and-forget, **batched** — only triggered every 10 messages or after 5 minutes of idle (2026-06-08). **2026-06-10**: 提取前先更新 `lastMemoryExtractionAt` 锁窗口，防止并发重复提取。
- **消息长度限制 (2026-06-10)** — 超过 2000 字符返回 400。
- **ChatWindow 错误回滚 (2026-06-10)** — API 返回错误时从 UI 移除乐观插入的消息，显示内联错误提示而非 `alert()`。

### Environment Variables

两个 env 文件: `.env` 和 `.env.local`。**`.env.local` 优先。**

关键变量：
```
DATABASE_URL              # Supabase PostgreSQL (port 5432 session pooler)
BETTER_AUTH_SECRET        # BetterAuth 加密密钥
BETTER_AUTH_URL           # http://localhost:3000 (生产需改)
GOOGLE_CLIENT_ID          # Google OAuth Web Client ID
GOOGLE_CLIENT_SECRET      # Google OAuth Client Secret
LLM_API_KEY               # DeepSeek API key
LLM_BASE_URL              # https://api.deepseek.com/v1
LLM_MODEL                 # deepseek-chat
HTTPS_PROXY               # http://127.0.0.1:7890 (国内 Google OAuth 必需)
HTTP_PROXY                # http://127.0.0.1:7890
SUPABASE_URL              # https://qzxrpwowgrchfghyzebn.supabase.co (Storage)
SUPABASE_SERVICE_ROLE_KEY # Supabase Dashboard → Settings → API → service_role
NEXT_PUBLIC_APP_URL       # http://localhost:3000
STRIPE_SECRET_KEY         # (未配置)
STRIPE_WEBHOOK_SECRET     # (未配置)
STRIPE_PRICE_ID           # (未配置)
```

**注意**: `.env.local` 中有 `TTS_API_KEY` / `TTS_BASE_URL` / `TTS_MODEL` / `TTS_VOICE` 是历史遗留，实际 TTS 使用 `node-edge-tts`（微软 Edge TTS），不依赖这些变量。

### Auth System (BetterAuth v1.6)

**2026-06-06 从 NextAuth v4 迁移到 BetterAuth**。BetterAuth 是 Auth.js 官方继任者（Auth.js 维护者 2025/09 加入 BetterAuth）。

**Email + Password**: `src/lib/auth.ts` — BetterAuth `emailAndPassword` 插件。密码以 bcryptjs (12 salt rounds) 存储在 `Account` 表 (`providerId: "credential"`)，而非 `User.password`。自定义注册路由 `/api/auth/register` 创建 User + Account 记录，含 IP 内存限流（15 分钟 5 次）。

**Google OAuth**: ✅ 已配置并可用。`socialProviders.google`，回调 URL: `http://localhost:3000/api/auth/callback/google`。**国内用户需要代理**（见下文 Proxy 章节）。

**Session**: BetterAuth 使用有状态数据库会话（`Session` 表），非 JWT。`User` 表上的自定义字段（`language`, `isSubscribed` 等）自动出现在 `session.user` 上。

关键文件：
| 文件 | 用途 |
|------|------|
| `src/lib/auth.ts` | 服务端 BetterAuth 实例 (prismaAdapter + emailAndPassword + Google + nextCookies)，**顶部 import "./proxy" 必须在最前** |
| `src/lib/auth-client.ts` | 客户端 `createAuthClient()` → 导出 `signIn`, `signOut`, `useSession` |
| `src/lib/proxy.ts` | undici 全局代理（国内 Google OAuth 必需） |
| `src/lib/kysely-stub.js` | webpack alias stub，解决 kysely 适配器编译错误 |
| `src/app/api/auth/[...all]/route.ts` | BetterAuth catch-all 路由 (`toNextJsHandler`) |
| `src/app/api/auth/register/route.ts` | 自定义注册路由（含 rate limit） |
| `scripts/migrate-passwords.ts` | 一次性密码迁移脚本（已执行） |

服务端获取会话: `auth.api.getSession({ headers: await headers() })`
客户端: `useSession()` from `@/lib/auth-client`
无需 SessionProvider — BetterAuth 客户端不需要包装器。

**已删除**: NextAuth v4, `SessionProvider`, `providers.tsx`, GitHub provider, `[...nextauth]` 路由。

### Proxy（国内 Google OAuth 必需）

Node.js 18+ 内置 fetch (undici) 不读取 `HTTP_PROXY` 环境变量。`src/lib/proxy.ts` 使用 `undici` 的 `setGlobalDispatcher` + `ProxyAgent` 强制所有 fetch 走代理：

```typescript
import { ProxyAgent, setGlobalDispatcher } from "undici";
const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
if (proxyUrl) { setGlobalDispatcher(new ProxyAgent({ uri: proxyUrl })); }
```

此文件在 `src/lib/auth.ts` 第一行 import（必须在 BetterAuth 之前，确保 Google OAuth HTTP 请求走代理）。Clash 代理端口 7890。

### Login / Register

登录页 (`/login`) 使用服务端组件 + 客户端表单分离模式。`src/app/login/page.tsx` 读取 cookie → 传 `lang` prop 给 `src/components/LoginForm.tsx`。

**LoginForm (2026-06-10)**：完整中英双语、注册有名字字段（选填，最大 50 字符）、条款/隐私超链接可点击。

`POST /api/auth/register` — 自定义注册路由：
- 输入验证: email 格式、password ≥6 字符、name ≤50 字符
- bcryptjs 12 rounds 哈希
- IP 内存限流（15 分钟 5 次）
- name 字段经 trim + 截断处理后存储

语言切换流程（**2026-06-08 支持未登录用户**）：

**已登录**：
```
LanguageSwitch click → PUT /api/user/language → DB updated → window.location.reload() → 服务端读取新 language → 全页重渲染
```

**未登录**：
```
LanguageSwitch click → 写 cookie (NEXT_LOCALE=zh/en) → window.location.reload() → 服务端读 cookie → 渲染对应语言页面
```

`LanguageSwitch` 通过 `loggedIn` prop 决定走哪条路径。

**重要架构变更 (2026-06-08)**: 发现 `better-auth` 的 `createAuthClient()` 在 Next.js dev SSR 中调用会导致 500 错误（"Element type is invalid... got: undefined"）。`useSession()` hook 在服务端渲染时不可用。

**解决方案**: 共享组件（`PageHeader`, `AuthButton`, `LanguageSwitch`, `ChatHeader`）改为 **server props 驱动**：
- 服务端组件 (`page.tsx`, `chat/page.tsx`) 用 `auth.api.getSession()` 获取 session → 提取 `lang` → 作为 prop 传递
- 客户端组件接收 `lang` prop，不 import `useSession`
- `AuthButton` 的 `signOut` 用动态 import (`await import("@/lib/auth-client")`) 延迟加载

`src/hooks/useLanguage.ts` 仍存在但主要用于非关键路径。`src/lib/auth-client.ts` 的 `signIn` 仍在 login page 直接使用（login page 是独立客户端组件，不受影响）。

### TTS + Audio Storage

`src/lib/tts.ts` — 使用 `node-edge-tts` 包（免费，无需 API key）：
- 英文男声: `en-US-GuyNeural`
- 中文男声: `zh-CN-YunyangNeural`（云扬）
- 文本截断 300 字符以内
- 生成 MP3 (24kHz/96kbps)，临时文件保存在 `.tmp/` 目录
- **2026-06-08**: 音频不再以 base64 data URL 存数据库，改为上传到 **Supabase Storage**（bucket: `audio`，公开）
- 返回 Storage 公开 URL（如 `https://xxx.supabase.co/storage/v1/object/public/audio/tts-xxx.mp3`）

`src/lib/storage.ts` — Supabase Storage 客户端（`@supabase/supabase-js`）：
- `uploadAudio(buffer, fileName)` → 上传到 `audio` bucket，返回公开 URL
- `deleteAudio(url)` → 从 URL 解析路径删除（备用）

`src/components/AudioPlayButton.tsx` — 播放按钮，44x44px 圆形，播放/暂停切换。支持任意 URL（https/base64）。

### LLM Adapter

`src/lib/llm.ts` — OpenAI SDK，`baseURL` 可配置，兼容任何 OpenAI 格式 API。当前用 DeepSeek (`deepseek-chat`)。默认 temperature 0.9，可通过 `chat({ temperature })` 覆盖。

### Memory System

`src/lib/memory.ts` — 两个函数：

1. **`buildMemoryContext(userId, characterId)`** — 读取该用户×角色的记忆 → 构建 `[MEMORY CONTEXT]` 注入 system prompt
   - `UserMemory` 查询加 `characterId` 过滤（**2026-06-08 修复跨角色泄露**）
   - 最多取最近更新的 30 条事实（防 token 膨胀）
   - 包含 `mood`、`stage`、`summary`（摘要 2026-06-08 修复，之前从未写入）

2. **`extractMemories(message, reply, existingFacts)`** — 调用 LLM（temperature 0.3，**2026-06-08 从 0.9 降低**）提取：
   - `newFacts` → 按 `(userId, characterId, key)` upsert 到 `UserMemory`
   - `mood` → 更新 `ChatSession.mood`
   - `stageUpdate` → 更新 `ChatSession.stage`
   - `summary` → 更新 `ChatSession.summary`（**2026-06-08 新增**）

**记忆隔离**: 每条事实绑定 `characterId`，角色间记忆完全独立（用户跟 Ethan 说的秘密 Daniel 看不到）。

**记忆提取触发机制 (2026-06-08)**：不是每条消息都提取。每条消息后检查：
- 攒了 ≥ 10 条未处理消息 → 触发提取
- 不够 10 条但最早那条超过 5 分钟 → 兜底触发
- 都不满足 → 跳过，等下次
- 追踪靠 `ChatSession.lastMemoryExtractionAt` 字段

关系阶段: `acquaintance` → `getting_to_know` → `flirting` → `dating` → `close` → `deep`

### Database

Prisma + PostgreSQL (Supabase free tier, Tokyo region)。**8 个模型**：

| 模型 | 用途 |
|------|------|
| `User` | 用户（language, isSubscribed, dailyMsgCount 等） |
| `Account` | BetterAuth 账号（OAuth + 邮箱密码） |
| `Session` | BetterAuth 数据库会话 |
| `Verification` | 邮箱验证 |
| `Character` | 角色定义（DB 冗余，API 实际用 in-code 数组） |
| `UserMemory` | 用户×角色记忆事实，`@@unique([userId, characterId, key])`，2026-06-08 加 characterId |
| `ChatSession` | 聊天会话，`@@unique([userId, characterId])`，含 mood/stage/summary/lastMemoryExtractionAt |
| `Message` | 聊天消息（audioUrl 存 Supabase Storage 公开 URL，非 base64） |

连接用 session pooler port 5432（非 transaction pooler 6543）。

角色定义在 `src/prompts/characters.ts`（in-code），DB `Character` 表为辅助。

### Rate Limiting

`src/lib/rate-limit.ts` — 两层限制：
1. **每日消息**: 免费 50 条/天，订阅用户无限制（`isSubscribed` + `subscriptionEnd` 检查）
2. **注册**: `/api/auth/register` IP 内存限流，15 分钟 5 次

### UI Design System

**2026-06-08 视觉重做**，参考 dotdotdot.chat。暗色简洁风格，真实角色写真。

**Theme**: 暗色纯黑背景 (`#0f0f0f`)，面向年轻女性。

- **Fonts**: Montserrat (display/headings) + Inter (body) — 现代无衬线
- **Colors**: CSS 自定义属性在 `globals.css`
  - `--bg-deep` (#0f0f0f), `--bg-primary` (#1a1a1a)
  - `--accent-rose` (#ff6b81), `--accent-gold` (#f0c27a), `--accent-warm` (#ff9a9e)
  - `--text-primary` (#fff), `--text-secondary` (rgba 0.7), `--text-muted` (rgba 0.45)
  - `--border-subtle` (rgba 0.08), `--glow-rose`, `--glow-gold`
- **Effects**: Glass morphism, 渐变文字, glow shadows, `heroFade` 关键帧动画（背景轮播）
- **Icons**: Lucide React (SVG)，严禁 emoji 作为图标
- **Logo**: `public/img/logo.svg` (文字 logo), `public/img/favicon.svg`

**Hero 区**: 全屏背景轮播 — 5 张角色照片 `cover` 填满，CSS `heroFade` 动画 25s 循环（每张 5s 渐变切换）。两侧 + 底部渐变遮罩 + 半透明暗色叠加保证文字可读。每张图独立 `background-position`：
- Ethan/Vincent/Kaiser: `50% 15%` (默认)
- Leo/Daniel: `50% 0%` (顶部对齐，最大化露脸)

CSS 变量速查: `--bg-deep`, `--bg-primary`, `--bg-card`, `--accent-rose`, `--accent-gold`, `--accent-warm`, `--text-primary`, `--text-secondary`, `--text-muted`, `--border-subtle`, `--glow-rose`, `--glow-gold`

Utility classes: `glass`, `glow-rose`, `text-gradient-rose`, `.particle`, `.typing-dot`, `.msg-in`

### Build 注意事项

- `next.config.js` 中 `serverComponentsExternalPackages` 包含 `node-edge-tts`, `better-auth` 等
- webpack alias 将 `@better-auth/kysely-adapter` 指向 `src/lib/kysely-stub.js`（我们只用 Prisma，不需要真实 kysely 适配器）

## Deploy

**Vercel**: `https://sawylove.vercel.app`（2026-06-10 上线）
- 环境变量配在 Vercel Dashboard → Settings → Environment Variables
- `.npmrc` (`legacy-peer-deps=true`) 解决 Vercel 构建时 zod v3/v4 冲突
- GitHub push → Vercel 自动部署

## Known Issues

1. **角色立绘需横版场景图** — 当前 5 张是竖版肖像（4:5），Hero 轮播用 `cover` 裁切。理想情况每人增补一张横版场景图 (1920×1080) 用于 Hero。
2. **移动端未优化** — 目标用户用手机，但响应式设计未完成。
3. **Stripe 未配置** — 代码已就绪，但 `STRIPE_SECRET_KEY` 为空，`new Stripe("")` 会在调用时崩溃。**用完 Stripe 再修，目前不影响。**
4. **Google OAuth 测试模式** — 当前在 Google Cloud Console 为 Testing 模式，上线前需 PUBLISH APP 切换到 Production。
5. **better-auth SSR 限制** — `useSession()` / `signOut` 等从 `@/lib/auth-client` 静态 import 在 Next.js dev SSR 中会触发 500。共享组件需用 props 驱动或动态 import。见 "Bilingual" 章节。
6. **Supabase Storage bucket 需手动创建** — 首次部署或新环境需在 Supabase Dashboard 创建名为 `audio` 的公开 bucket。
7. **存量 base64 audioUrl** — 数据库中旧消息的 audioUrl 仍为 base64 data URL 格式，新消息使用 Storage URL。旧消息仍可播放。
8. **旧 `UserMemory` 数据无 characterId** — 2026-06-08 之前的数据 `characterId = NULL`。新记忆正常写入角色隔离。随新记忆增多自然覆盖。
9. **自定义域名** — `.vercel.app` 域名国内被墙，需买域名绑定才能让国内用户不翻墙访问。
10. **Vercel 需代理访问** — 国内 `curl` 访问 Vercel 会超时，`git push` 到 GitHub 也需代理。本地 `.git/config` 已配 `http.proxy=http://127.0.0.1:7890`。
