import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import CharacterGrid from "@/components/CharacterGrid";
import AuthButton from "@/components/AuthButton";
import LanguageSwitch from "@/components/LanguageSwitch";
import Link from "next/link";

async function getCharacters() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/characters`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.characters;
}

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const characters = await getCharacters();
  const lang = (session?.user as any)?.language === "zh" ? "zh" : "en";

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between p-4 border-b bg-white">
        <Link href="/" className="text-xl font-bold text-rose-500">
          💕 {lang === "zh" ? "纸片人男友" : "Paper Boyfriend"}
        </Link>
        <LanguageSwitch />
        <AuthButton />
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {session ? (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                {lang === "zh" ? "选择你的男友" : "Choose Your Boyfriend"}
              </h1>
              <p className="text-gray-500 mt-2">
                {lang === "zh"
                  ? "选一个你喜欢的类型，开始你们的专属故事"
                  : "Pick your type and start your story"}
              </p>
            </div>
            <CharacterGrid characters={characters} lang={lang} />
          </>
        ) : (
          <div className="text-center py-20">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {lang === "zh" ? "你的专属AI男友，随时在线" : "Your AI Boyfriend, Always Online"}
            </h1>
            <p className="text-gray-500 mb-8">
              {lang === "zh"
                ? "登录后选择一个男友，开始聊天吧"
                : "Sign in, pick a boyfriend, and start chatting"}
            </p>
            <AuthButton />
          </div>
        )}
      </main>
    </div>
  );
}
