"use client";
import AuthButton from "./AuthButton";
import { Heart, Mic, Brain } from "lucide-react";

interface HomeUnauthenticatedProps {
  lang: "en" | "zh";
}

// Character images for hero carousel — per-image position to show faces
const HERO_IMAGES = [
  { src: "/avatars/gentle-warm.png", pos: "50% 15%" },
  { src: "/avatars/humorous.png",   pos: "50% 0%" },
  { src: "/avatars/mature.png",     pos: "50% 0%" },
  { src: "/avatars/artistic.png",   pos: "50% 15%" },
  { src: "/avatars/dominant.png",   pos: "50% 15%" },
];

export default function HomeUnauthenticated({ lang }: HomeUnauthenticatedProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* ======== Hero with background carousel ======== */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ backgroundColor: "#0f0f0f" }}>
        {/* Background image carousel */}
        <div aria-hidden="true" className="absolute inset-0">
          {HERO_IMAGES.map(({ src, pos }, i) => (
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

        {/* Side gradient masks */}
        <div aria-hidden="true" className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#0f0f0f]/90 to-transparent z-[1]" />
        <div aria-hidden="true" className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#0f0f0f]/90 to-transparent z-[1]" />

        {/* Bottom gradient mask */}
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[250px] bg-gradient-to-t from-[#0f0f0f] to-transparent z-[1]" />

        {/* Dark overlay for text readability */}
        <div aria-hidden="true" className="absolute inset-0 bg-black/40 z-[1]" />

        {/* Content */}
        <div className="relative z-10 text-center max-w-2xl mx-auto px-4 py-20">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--accent-rose)] to-[var(--accent-warm)] flex items-center justify-center mx-auto mb-8 shadow-[var(--glow-rose)]">
            <Heart className="w-10 h-10 text-white fill-white" />
          </div>

          <h1
            className="font-display font-bold mb-4 tracking-tight text-white leading-tight drop-shadow-lg"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            {lang === "zh" ? "你的专属AI伴侣" : "Your AI Companion"}
          </h1>

          <p
            className="text-white/70 mb-8 leading-relaxed max-w-md mx-auto drop-shadow"
            style={{ fontSize: "clamp(0.875rem, 2vw, 1.125rem)" }}
          >
            {lang === "zh"
              ? "深夜里，总有一个人等你。选择一个懂你的他，让心随之而动"
              : "Late at night, someone is always waiting for you. Choose your type, let your heart sway"}
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {[
              { icon: Heart, zh: "5 位角色可选", en: "5 unique characters" },
              { icon: Mic, zh: "语音回复", en: "Voice replies" },
              { icon: Brain, zh: "记得你的点滴", en: "He remembers you" },
            ].map(({ icon: Icon, zh, en }, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white/80 text-sm"
              >
                <Icon className="w-4 h-4 text-[var(--accent-rose)]" />
                {lang === "zh" ? zh : en}
              </span>
            ))}
          </div>

          <AuthButton loggedIn={false} />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border-subtle)] py-8 px-4 bg-[var(--bg-deep)]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-[var(--accent-rose)]" />
            <span className="text-[var(--text-secondary)] text-sm font-display font-semibold">
              Swaylove
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a href="/privacy" className="text-[var(--text-muted)] text-xs hover:text-[var(--text-secondary)] transition-colors">
              {lang === "zh" ? "隐私政策" : "Privacy Policy"}
            </a>
            <a href="/terms" className="text-[var(--text-muted)] text-xs hover:text-[var(--text-secondary)] transition-colors">
              {lang === "zh" ? "服务条款" : "Terms of Service"}
            </a>
          </div>
          <p className="text-[var(--text-muted)] text-xs">
            "Swaylove · All Rights Reserved"
          </p>
        </div>
      </footer>

    </div>
  );
}
