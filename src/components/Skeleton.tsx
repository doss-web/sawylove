export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-2xl bg-white/5 ${className || ""}`} />
  );
}

export function SkeletonMessage({ isUser }: { isUser?: boolean }) {
  return (
    <div className={`mb-4 flex ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && <div className="w-8 h-8 rounded-full bg-[var(--accent-rose)]/20 flex-shrink-0 mr-2 self-end" />}
      <div className={`rounded-2xl ${isUser ? "rounded-br-sm" : "rounded-bl-sm"} bg-white/5 border border-[var(--border-subtle)]`}>
        <div className="flex flex-col gap-2 p-4" style={{ width: isUser ? "140px" : "200px" }}>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
          {!isUser && <Skeleton className="h-3 w-1/2" />}
        </div>
      </div>
    </div>
  );
}
