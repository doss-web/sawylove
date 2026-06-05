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
