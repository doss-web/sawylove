import { cookies } from "next/headers";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const lang = cookieStore.get("NEXT_LOCALE")?.value === "zh" ? "zh" : "en";

  return <LoginForm lang={lang} />;
}
