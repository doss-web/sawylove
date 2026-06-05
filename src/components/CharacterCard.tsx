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
