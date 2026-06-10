"use client";
import { useState, FormEvent } from "react";
import { signIn } from "@/lib/auth-client";
import { Heart } from "lucide-react";

type Tab = "login" | "register";
type Status = "idle" | "loading" | "error" | "success";

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  const reset = () => {
    setStatus("idle");
    setError("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setAgreed(false);
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    reset();
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setStatus("loading");
    setError("");

    const result = await signIn.email({
      email: email.trim(),
      password,
    });

    if (result?.error) {
      setStatus("error");
      setError("Incorrect email or password");
    } else {
      window.location.href = "/";
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    if (!agreed) {
      setError("You must confirm you are 18 or older");
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setError(data.error || "Registration failed");
        return;
      }

      // Auto-login after successful registration
      const result = await signIn.email({
        email: email.trim(),
        password,
      });
      if (result?.error) {
        setStatus("error");
        setError("Account created but login failed. Please try signing in.");
      } else {
        window.location.href = "/";
      }
    } catch {
      setStatus("error");
      setError("Something went wrong. Please try again.");
    }
  };

  const handleGoogleLogin = async () => {
    setStatus("loading");
    await signIn.social({
      provider: "google",
      callbackURL: "/",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Atmosphere */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="particle w-3 h-3 bg-[var(--accent-rose)] top-[20%] left-[15%]" />
        <div className="particle w-2 h-2 bg-[var(--accent-gold)] top-[30%] right-[20%]" />
        <div className="particle w-2.5 h-2.5 bg-[var(--accent-warm)] bottom-[30%] left-[25%]" />
        <div className="particle w-1.5 h-1.5 bg-[var(--accent-rose)] bottom-[20%] right-[15%]" />
      </div>
      <div className="absolute top-1/3 left-1/3 w-80 h-80 rounded-full bg-[var(--accent-rose)]/5 blur-[120px]" />
      <div className="absolute bottom-1/3 right-1/3 w-80 h-80 rounded-full bg-[var(--accent-gold)]/5 blur-[120px]" />

      <div className="relative glass p-8 rounded-3xl max-w-sm w-full mx-4 shadow-[var(--glow-rose)]">
        {/* Logo */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--accent-rose)] to-[var(--accent-warm)] flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[var(--accent-rose)]/20">
          <Heart className="w-8 h-8 text-white fill-white" />
        </div>

        {/* Tabs */}
        <div className="flex mb-6 bg-white/5 rounded-xl p-1">
          <button
            onClick={() => switchTab("login")}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
              tab === "login"
                ? "bg-gradient-to-r from-[var(--accent-rose)] to-[var(--accent-warm)] text-white"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => switchTab("register")}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
              tab === "register"
                ? "bg-gradient-to-r from-[var(--accent-rose)] to-[var(--accent-warm)] text-white"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={tab === "login" ? handleLogin : handleRegister} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5 ml-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3.5 rounded-2xl bg-white/5 border border-[var(--border-subtle)] focus:outline-none focus:border-[var(--accent-rose)] focus:ring-2 focus:ring-[var(--accent-rose)]/20 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm transition-colors duration-200"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5 ml-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="&#x2022; &#x2022; &#x2022; &#x2022; &#x2022; &#x2022; &#x2022; &#x2022;"
              required
              className="w-full px-4 py-3.5 rounded-2xl bg-white/5 border border-[var(--border-subtle)] focus:outline-none focus:border-[var(--accent-rose)] focus:ring-2 focus:ring-[var(--accent-rose)]/20 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm transition-colors duration-200"
            />
          </div>

          {tab === "register" && (
            <>
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5 ml-1">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="&#x2022; &#x2022; &#x2022; &#x2022; &#x2022; &#x2022; &#x2022; &#x2022;"
                  required
                  className="w-full px-4 py-3.5 rounded-2xl bg-white/5 border border-[var(--border-subtle)] focus:outline-none focus:border-[var(--accent-rose)] focus:ring-2 focus:ring-[var(--accent-rose)]/20 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm transition-colors duration-200"
                />
              </div>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 accent-[var(--accent-rose)]"
                />
                <span className="text-xs text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors leading-relaxed">
                  I confirm that I am 18 years or older and agree to the Terms of Service and Privacy Policy.
                </span>
              </label>
            </>
          )}

          {/* Error message */}
          {error && (
            <div className="px-4 py-3 rounded-xl bg-[var(--accent-rose)]/10 border border-[var(--accent-rose)]/20 text-[var(--accent-rose)] text-xs text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full px-5 py-3.5 rounded-2xl bg-gradient-to-r from-[var(--accent-rose)] to-[var(--accent-warm)] text-white font-medium disabled:opacity-30 hover:shadow-[var(--glow-rose)] transition-shadow transition-opacity duration-200 text-sm active:scale-[0.98]"
          >
            {status === "loading" ? (
              <span className="flex items-center justify-center gap-2">
                <span className="typing-dot w-1.5 h-1.5 bg-white rounded-full" />
                <span className="typing-dot w-1.5 h-1.5 bg-white rounded-full" />
                <span className="typing-dot w-1.5 h-1.5 bg-white rounded-full" />
              </span>
            ) : tab === "login" ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--border-subtle)]" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-[var(--bg-deep)] text-[var(--text-muted)]">or continue with</span>
          </div>
        </div>

        {/* Google Login */}
        <button
          onClick={handleGoogleLogin}
          disabled={status === "loading"}
          className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-2xl bg-white/5 border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm font-medium hover:bg-white/10 transition-colors duration-200 disabled:opacity-30"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  );
}
