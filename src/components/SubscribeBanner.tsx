"use client";

export default function SubscribeBanner({ remaining, lang }: { remaining: number; lang: string }) {
  if (remaining === Infinity) return null; // subscriber — don't show

  const handleSubscribe = async () => {
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
  };

  return (
    <div className="bg-[var(--accent-rose)]/10 border-b border-[var(--accent-rose)]/20 px-4 py-2.5 text-center text-sm">
      {lang === "zh" ? (
        <>今日剩余 <strong>{remaining}</strong> 条消息。{" "}
          <button onClick={handleSubscribe} className="text-[var(--accent-rose)] font-semibold hover:text-[var(--accent-warm)] transition-colors min-h-[44px]">
            订阅无限畅聊 →
          </button></>
      ) : (
        <><strong>{remaining}</strong> messages remaining today.{" "}
          <button onClick={handleSubscribe} className="text-[var(--accent-rose)] font-semibold hover:text-[var(--accent-warm)] transition-colors min-h-[44px]">
            Subscribe for unlimited →
          </button></>
      )}
    </div>
  );
}
