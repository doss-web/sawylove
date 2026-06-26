"use client";
import { CharacterData } from "@/types";
import CharacterCard from "@/components/CharacterCard";
import { Heart, Mic, Brain } from "lucide-react";

interface HomeAuthenticatedProps {
  characters: CharacterData[];
  lang: "en" | "zh";
}

const HERO_AVATARS = [
  { src: "/avatars/gentle-warm.png", pos: "50% 15%" },
  { src: "/avatars/humorous.png",   pos: "50% 0%" },
  { src: "/avatars/mature.png",     pos: "50% 0%" },
  { src: "/avatars/artistic.png",   pos: "50% 15%" },
  { src: "/avatars/dominant.png",   pos: "50% 15%" },
];

export default function HomeAuthenticated({ characters, lang }: HomeAuthenticatedProps) {
  const t = {
    heroTitle: lang === "zh" ? "今夜，谁是你的心动" : "Who Will You Choose Tonight",
    heroSub:
      lang === "zh"
        ? "每个他都有独一无二的灵魂。选择一个，开始只属于你们的对话"
        : "Each one has a unique soul. Choose and begin a conversation meant only for two",
    featuresTitle:
      lang === "zh" ? "不只是聊天" : "More Than Just Chat",
    feature1Title:
      lang === "zh" ? "选择你的他" : "Pick Your Companion",
    feature1Desc:
      lang === "zh"
        ? "5 位性格迥异的角色，温柔、幽默、成熟、文艺、霸道 — 总有一个适合你"
        : "5 unique personalities — gentle, witty, mature, artistic, dominant. Find your match",
    feature2Title:
      lang === "zh" ? "他的声音" : "Hear His Voice",
    feature2Desc:
      lang === "zh"
        ? "每条回复都配有语音，他用温暖的声音对你说每一句话"
        : "Every reply comes with his voice. He speaks to you with warmth and charm",
    feature3Title:
      lang === "zh" ? "他记得你" : "He Remembers You",
    feature3Desc:
      lang === "zh"
        ? "你告诉他的事，他都记得。越聊越懂你，关系逐渐升温"
        : "He remembers what you tell him. The more you talk, the better he knows you",
    faqTitle: "FAQ",
    faq1Q: lang === "zh" ? "他是真人吗？" : "Is he a real person?",
    faq1A:
      lang === "zh"
        ? "他是 AI 驱动的虚拟伴侣。虽然不是真人，但他会记住你、关心你、用语音回复你。"
        : "He is an AI-powered companion. While not a real person, he remembers you, cares about you, and speaks to you with voice.",
    faq2Q: lang === "zh" ? "免费吗？" : "Is it free?",
    faq2A:
      lang === "zh"
        ? "每天 50 条消息免费。订阅后可无限聊天，解锁全部角色。"
        : "50 messages per day are free. Subscribe for unlimited chat and unlock all characters.",
    faq3Q: lang === "zh" ? "语音是什么语言？" : "What language is the voice?",
    faq3A:
      lang === "zh"
        ? "支持英文和中文。根据你选择的界面语言自动匹配语音。"
        : "Both English and Chinese. The voice matches your selected interface language.",
    faq4Q: lang === "zh" ? "我的隐私安全吗？" : "Is my privacy safe?",
    faq4A:
      lang === "zh"
        ? "你的对话是加密的，我们不会将你的聊天内容用于任何其他用途。"
        : "Your conversations are encrypted. We never use your chat content for any other purpose.",
    footerRights:
      "Swoonly · All Rights Reserved",
    footerPrivacy: lang === "zh" ? "隐私政策" : "Privacy Policy",
    footerTerms: lang === "zh" ? "服务条款" : "Terms of Service",
  };


  return (
    <div className="min-h-screen">
      {/* Hero with background carousel */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden" style={{ backgroundColor: "#0f0f0f" }}>
        {/* Background carousel */}
        <div aria-hidden="true" className="absolute inset-0">
          {HERO_AVATARS.map(({ src, pos }, i) => (
            <div
              key={src}
              className="absolute inset-0 bg-no-repeat"
              style={{
                backgroundImage: `url(${src})`,
                backgroundPosition: pos,
                backgroundSize: "cover",
                opacity: 0,
                animation: `heroFade 25s infinite`,
                animationDelay: `${i * 5}s`,
              }}
            />
          ))}
        </div>
        <div aria-hidden="true" className="absolute inset-y-0 left-0 w-12 sm:w-24 bg-gradient-to-r from-[#0f0f0f]/90 to-transparent z-[1]" />
        <div aria-hidden="true" className="absolute inset-y-0 right-0 w-12 sm:w-24 bg-gradient-to-l from-[#0f0f0f]/90 to-transparent z-[1]" />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[250px] bg-gradient-to-t from-[#0f0f0f] to-transparent z-[1]" />
        <div aria-hidden="true" className="absolute inset-0 bg-black/45 z-[1]" />

        <div className="relative z-10 text-center max-w-3xl mx-auto px-4 py-12 sm:py-20">
          <h1 className="font-display font-bold text-white mb-6 tracking-tight leading-tight drop-shadow-lg" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
            {t.heroTitle}
          </h1>
          <p className="text-white/70 max-w-xl mx-auto mb-10 leading-relaxed drop-shadow" style={{ fontSize: "clamp(0.875rem, 2vw, 1.125rem)" }}>
            {t.heroSub}
          </p>
          <div className="flex items-center justify-center gap-3 md:gap-4 mb-10 overflow-x-auto pb-2 -mx-4 px-4">
            {characters.map((c) => (
              <div key={c.slug} className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden border-2 border-white/20 hover:border-[var(--accent-rose)]/50 transition-colors duration-300">
                <img src={c.avatarUrl} alt={c.nameEn} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Character Grid */}
      <section className="max-w-6xl mx-auto px-4 pb-12 sm:pb-20">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
          {characters.map((c) => (
            <CharacterCard key={c.slug} character={c} lang={lang} />
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-4 pb-12 sm:pb-24">
        <h2 className="font-display font-bold text-[var(--text-primary)] text-center mb-8 sm:mb-14" style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}>
          {t.featuresTitle}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-[var(--accent-rose)]/10 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-6 h-6 text-[var(--accent-rose)]" />
            </div>
            <h3 className="font-display font-semibold text-[var(--text-primary)] text-lg mb-2">{t.feature1Title}</h3>
            <p className="text-[var(--text-muted)] text-sm leading-relaxed">{t.feature1Desc}</p>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-[var(--accent-gold)]/10 flex items-center justify-center mx-auto mb-4">
              <Mic className="w-6 h-6 text-[var(--accent-gold)]" />
            </div>
            <h3 className="font-display font-semibold text-[var(--text-primary)] text-lg mb-2">{t.feature2Title}</h3>
            <p className="text-[var(--text-muted)] text-sm leading-relaxed">{t.feature2Desc}</p>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-[var(--accent-warm)]/10 flex items-center justify-center mx-auto mb-4">
              <Brain className="w-6 h-6 text-[var(--accent-warm)]" />
            </div>
            <h3 className="font-display font-semibold text-[var(--text-primary)] text-lg mb-2">{t.feature3Title}</h3>
            <p className="text-[var(--text-muted)] text-sm leading-relaxed">{t.feature3Desc}</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto px-4 pb-12 sm:pb-24">
        <h2 className="font-display font-bold text-[var(--text-primary)] text-center mb-10" style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}>{t.faqTitle}</h2>
        <div className="divide-y divide-[var(--border-subtle)]">
          {[[t.faq1Q, t.faq1A], [t.faq2Q, t.faq2A], [t.faq3Q, t.faq3A], [t.faq4Q, t.faq4A]].map(([q, a], i) => (
            <details key={i} className="group py-5 cursor-pointer">
              <summary className="font-medium text-[var(--text-primary)] text-sm list-none flex justify-between items-center">
                {q}
                <svg className="w-4 h-4 text-[var(--text-muted)] group-open:rotate-180 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-3 text-[var(--text-muted)] text-sm leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border-subtle)] py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-[var(--accent-rose)]" />
            <span className="text-[var(--text-secondary)] text-sm font-display font-semibold">Swoonly</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="/privacy" className="text-[var(--text-muted)] text-xs hover:text-[var(--text-secondary)] transition-colors">{t.footerPrivacy}</a>
            <a href="/terms" className="text-[var(--text-muted)] text-xs hover:text-[var(--text-secondary)] transition-colors">{t.footerTerms}</a>
          </div>
          <p className="text-[var(--text-muted)] text-xs">{t.footerRights}</p>
        </div>
      </footer>
    </div>
  );
}
