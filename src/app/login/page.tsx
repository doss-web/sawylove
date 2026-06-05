"use client";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-sm border max-w-sm w-full text-center">
        <h1 className="text-2xl font-bold text-rose-500 mb-2">💕 Paper Boyfriend</h1>
        <p className="text-gray-500 mb-6">Sign in to meet your boyfriend</p>
        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="w-full mb-3 px-4 py-3 border border-gray-200 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 transition"
        >
          <span>Continue with Google</span>
        </button>
        <button
          onClick={() => signIn("github", { callbackUrl: "/" })}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 transition"
        >
          <span>Continue with GitHub</span>
        </button>
      </div>
    </div>
  );
}
