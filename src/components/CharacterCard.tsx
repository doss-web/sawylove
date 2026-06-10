"use client";
import { CharacterData } from "@/types";
import Link from "next/link";

export default function CharacterCard({
  character,
  lang,
}: {
  character: CharacterData;
  lang: string;
}) {
  const name = lang === "zh" ? character.nameZh : character.nameEn;
  const tagline = lang === "zh" ? character.taglineZh : character.taglineEn;

  return (
    <Link href={`/chat/${character.slug}`} className="block group">
      <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-[var(--bg-primary)] border border-[var(--border-subtle)] hover:border-[var(--accent-rose)]/30 transition-all duration-500 hover:-translate-y-1">
        {/* Character image */}
        <img
          src={character.avatarUrl}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

        {/* Premium badge */}
        {!character.isFree && (
          <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-[var(--accent-gold)]/20 backdrop-blur-sm text-[var(--accent-gold)] text-xs font-semibold border border-[var(--accent-gold)]/20">
            &#x2726; Premium
          </span>
        )}

        {/* Name & tagline overlay */}
        <div className="absolute inset-x-0 bottom-0 p-5">
          <h3 className="text-white font-display text-xl font-semibold drop-shadow-lg">
            {name}
          </h3>
          <p className="text-white/70 text-sm mt-0.5 drop-shadow-md">{tagline}</p>
        </div>
      </div>
    </Link>
  );
}
