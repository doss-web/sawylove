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
