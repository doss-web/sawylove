import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { CHARACTERS } from "@/prompts/characters";
import { notFound, redirect } from "next/navigation";
import ChatWindow from "@/components/ChatWindow";
import ChatHeader from "@/components/ChatHeader";

export default async function ChatPage({ params }: { params: { characterId: string } }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) redirect("/login");

  const character = CHARACTERS.find(c => c.slug === params.characterId);
  if (!character) notFound();

  const lang = (session?.user as any)?.language === "zh" ? "zh" : "en";

  return (
    <div className="h-dvh flex flex-col">
      <ChatHeader
        slug={character.slug}
        nameEn={character.nameEn}
        nameZh={character.nameZh}
        lang={lang}
      />
      <ChatWindow characterId={params.characterId} characterName={character.nameEn} lang={lang} />
    </div>
  );
}
