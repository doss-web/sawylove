import { auth } from "@/lib/auth";
import { headers, cookies } from "next/headers";
import PageHeader from "@/components/PageHeader";
import HomeAuthenticated from "@/components/HomeAuthenticated";
import HomeUnauthenticated from "@/components/HomeUnauthenticated";

async function getCharacters() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/characters`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.characters;
}

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const characters = session ? await getCharacters() : [];

  // Authenticated: read from user record. Unauthenticated: read from cookie.
  const cookieStore = await cookies();
  const lang = (session?.user as any)?.language === "zh" ? "zh"
    : cookieStore.get("NEXT_LOCALE")?.value === "zh" ? "zh"
    : "en";

  return (
    <div className="min-h-screen">
      <PageHeader lang={lang} loggedIn={!!session} userName={session?.user?.name} />
      {session ? (
        <HomeAuthenticated characters={characters} lang={lang} />
      ) : (
        <HomeUnauthenticated lang={lang} />
      )}
    </div>
  );
}
