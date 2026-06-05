"use client";
import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthButton() {
  const { data: session } = useSession();
  if (session) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">{session.user?.name}</span>
        <button onClick={() => signOut()} className="text-sm text-rose-500 hover:underline">
          Sign Out
        </button>
      </div>
    );
  }
  return (
    <button onClick={() => signIn()} className="px-4 py-2 bg-rose-500 text-white rounded-lg text-sm hover:bg-rose-600">
      Sign In
    </button>
  );
}
