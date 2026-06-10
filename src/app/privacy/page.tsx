import { auth } from "@/lib/auth";
import { headers, cookies } from "next/headers";
import PageHeader from "@/components/PageHeader";
import Link from "next/link";

export default async function PrivacyPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const cookieStore = await cookies();
  const lang = (session?.user as any)?.language === "zh" ? "zh"
    : cookieStore.get("NEXT_LOCALE")?.value === "zh" ? "zh"
    : "en";

  const t = {
    title: lang === "zh" ? "隐私政策" : "Privacy Policy",
    lastUpdated: lang === "zh" ? "最后更新：2026年6月9日" : "Last updated: June 9, 2026",
    intro: lang === "zh"
      ? "Swaylove（以下简称「我们」或「本服务」）重视您的隐私。本隐私政策说明我们如何收集、使用和保护您的个人信息。使用本服务即表示您同意本政策。"
      : "Swaylove (\"we,\" \"us,\" or \"the Service\") values your privacy. This Privacy Policy explains how we collect, use, and protect your personal information. By using the Service, you agree to this policy.",

    sections: [
      {
        title: lang === "zh" ? "1. 我们收集的信息" : "1. Information We Collect",
        content: lang === "zh"
          ? [
              "账户信息：注册时提供邮箱地址。如使用 Google 登录，我们会收到您的 Google 显示名称和邮箱。",
              "聊天数据：您与 AI 角色的对话内容会储存在我们的服务器上，用于提供对话服务、记忆功能及改进 AI 回复质量。",
              "使用数据：我们会记录每日消息数量以实现免费额度限制功能。",
              "支付信息：订阅付款通过 Stripe 处理，我们不会储存您的完整信用卡信息。",
              "语言偏好：您选择的界面语言偏好会储存在您的账户或浏览器 Cookie 中。",
            ]
          : [
              "Account Information: Your email address provided during registration. If you sign in with Google, we receive your Google display name and email.",
              "Chat Data: Your conversations with AI characters are stored on our servers to provide the chat service, memory features, and improve AI response quality.",
              "Usage Data: We track daily message counts to enforce the free tier limit.",
              "Payment Information: Subscription payments are processed by Stripe. We do not store your full credit card details.",
              "Language Preference: Your chosen interface language is saved in your account or browser cookie.",
            ],
      },
      {
        title: lang === "zh" ? "2. 信息如何使用" : "2. How We Use Information",
        content: lang === "zh"
          ? [
              "提供和维护 AI 聊天服务，包括语音生成。",
              "实现角色记忆功能，让 AI 记住您的偏好和对话历史。",
              "执行每日消息限制和订阅权限检查。",
              "改进和优化 AI 模型回复质量。",
              "发送与服务相关的重要通知（如政策变更）。",
            ]
          : [
              "To provide and maintain the AI chat service, including voice generation.",
              "To enable character memory features so AI remembers your preferences and conversation history.",
              "To enforce daily message limits and subscription entitlements.",
              "To improve and optimize AI model response quality.",
              "To send important service-related notifications (such as policy changes).",
            ],
      },
      {
        title: lang === "zh" ? "3. 数据存储与安全" : "3. Data Storage & Security",
        content: lang === "zh"
          ? [
              "所有数据储存在 Supabase（日本东京区域）的 PostgreSQL 数据库中。",
              "语音文件储存在 Supabase Storage 中。",
              "数据传输使用 HTTPS 加密。",
              "我们采取合理的技术措施保护您的数据，但无法保证 100% 安全。",
            ]
          : [
              "All data is stored in Supabase (Tokyo, Japan region) PostgreSQL databases.",
              "Audio files are stored in Supabase Storage.",
              "Data transmission is encrypted via HTTPS.",
              "We take reasonable technical measures to protect your data, but cannot guarantee 100% security.",
            ],
      },
      {
        title: lang === "zh" ? "4. 第三方服务" : "4. Third-Party Services",
        content: lang === "zh"
          ? [
              "DeepSeek（中国）：处理您的聊天消息以生成 AI 回复。DeepSeek 的隐私政策适用于发送至其 API 的数据。",
              "Supabase（美国/日本）：提供数据库和文件存储服务。",
              "Google：提供 OAuth 登录服务。Google 的隐私政策适用于其收集的数据。",
              "Stripe（美国）：处理订阅付款。Stripe 的隐私政策适用于支付相关数据。",
              "微软 Edge TTS：生成语音回复音频。",
            ]
          : [
              "DeepSeek (China): Processes your chat messages to generate AI replies. DeepSeek's privacy policy applies to data sent to its API.",
              "Supabase (US/Japan): Provides database and file storage services.",
              "Google: Provides OAuth sign-in services. Google's privacy policy applies to data it collects.",
              "Stripe (US): Processes subscription payments. Stripe's privacy policy applies to payment data.",
              "Microsoft Edge TTS: Generates voice reply audio.",
            ],
      },
      {
        title: lang === "zh" ? "5. 用户权利" : "5. Your Rights",
        content: lang === "zh"
          ? [
              "访问权：您有权要求查看我们储存的您的个人数据。",
              "删除权：您可以随时删除账户及相关聊天数据。",
              "数据导出：您可以要求导出您的聊天记录。",
              "撤回同意：您可以随时停止使用服务并删除账户。",
              "如需行使上述权利，请通过下方联系方式联系我们。",
            ]
          : [
              "Right of Access: You can request to see what personal data we store about you.",
              "Right of Deletion: You can delete your account and associated chat data at any time.",
              "Data Export: You can request an export of your chat history.",
              "Withdraw Consent: You can stop using the Service and delete your account at any time.",
              "To exercise these rights, contact us using the information below.",
            ],
      },
      {
        title: lang === "zh" ? "6. 儿童隐私" : "6. Children's Privacy",
        content: lang === "zh"
          ? [
              "本服务不面向 13 岁以下儿童。我们不会故意收集 13 岁以下儿童的个人信息。如发现误收集，我们将立即删除。",
            ]
          : [
              "The Service is not intended for children under 13. We do not knowingly collect personal information from children under 13. If we discover such data, we will delete it immediately.",
            ],
      },
      {
        title: lang === "zh" ? "7. Cookie" : "7. Cookies",
        content: lang === "zh"
          ? [
              "我们使用必要的 Cookie 来维持登录会话和记住您的语言偏好。这些 Cookie 不用于追踪或广告目的。",
              "未登录用户的语言偏好会以 `NEXT_LOCALE` Cookie 保存。",
            ]
          : [
              "We use essential cookies to maintain your login session and remember your language preference. These cookies are not used for tracking or advertising purposes.",
              "Unauthenticated user language preference is stored in a `NEXT_LOCALE` cookie.",
            ],
      },
      {
        title: lang === "zh" ? "8. 政策变更" : "8. Policy Changes",
        content: lang === "zh"
          ? [
              "我们可能会更新本隐私政策。重大变更会通过电子邮件或在服务中显著位置通知。继续使用服务即表示接受更新后的政策。",
            ]
          : [
              "We may update this Privacy Policy. Significant changes will be notified via email or prominent notice within the Service. Continued use constitutes acceptance of the updated policy.",
            ],
      },
      {
        title: lang === "zh" ? "9. 联系我们" : "9. Contact Us",
        content: lang === "zh"
          ? [
              "如果您对本隐私政策有任何疑问，请发送邮件至：support@swaylove.com",
            ]
          : [
              "If you have any questions about this Privacy Policy, please email: support@swaylove.com",
            ],
      },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PageHeader lang={lang} loggedIn={!!session} userName={session?.user?.name} />

      <main className="flex-1 max-w-2xl mx-auto px-4 py-16 w-full">
        <h1 className="font-display font-bold text-[var(--text-primary)] mb-2" style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}>
          {t.title}
        </h1>
        <p className="text-[var(--text-muted)] text-sm mb-10">{t.lastUpdated}</p>

        <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-10">{t.intro}</p>

        <div className="space-y-10">
          {t.sections.map((section, i) => (
            <section key={i}>
              <h2 className="font-display font-semibold text-[var(--text-primary)] text-base mb-3">
                {section.title}
              </h2>
              <ul className="list-disc list-inside space-y-2">
                {section.content.map((item, j) => (
                  <li key={j} className="text-[var(--text-secondary)] text-sm leading-relaxed">{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-[var(--border-subtle)]">
          <Link
            href="/"
            className="text-sm text-[var(--accent-rose)] hover:text-[var(--accent-warm)] transition-colors"
          >
            {lang === "zh" ? "← 返回首页" : "← Back to Home"}
          </Link>
        </div>
      </main>
    </div>
  );
}
