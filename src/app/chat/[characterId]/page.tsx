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
