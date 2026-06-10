import { db } from "@/lib/db";

const DAILY_LIMIT = 50;

/**
 * Atomically check rate limit AND increment count in one operation.
 * Prevents race condition where two concurrent requests both pass the check.
 */
export async function checkAndIncrementRateLimit(
  userId: string,
): Promise<{ allowed: boolean; remaining: number }> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { allowed: false, remaining: 0 };

  // Subscribers have unlimited
  if (user.isSubscribed && user.subscriptionEnd && user.subscriptionEnd > new Date()) {
    return { allowed: true, remaining: Infinity };
  }

  // Check if daily reset is needed
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const msgDate = new Date(user.msgCountDate);
  msgDate.setHours(0, 0, 0, 0);

  if (msgDate < today) {
    await db.user.update({
      where: { id: userId },
      data: { dailyMsgCount: 1, msgCountDate: new Date() },
    });
    return { allowed: true, remaining: DAILY_LIMIT - 1 };
  }

  // Atomic check-and-increment: only updates if under limit
  // PostgreSQL row-level locking ensures only one concurrent request succeeds
  const result = await db.user.updateMany({
    where: { id: userId, dailyMsgCount: { lt: DAILY_LIMIT } },
    data: { dailyMsgCount: { increment: 1 }, msgCountDate: new Date() },
  });

  if (result.count === 0) {
    return { allowed: false, remaining: 0 };
  }

  const updated = await db.user.findUnique({
    where: { id: userId },
    select: { dailyMsgCount: true },
  });
  return { allowed: true, remaining: Math.max(0, DAILY_LIMIT - (updated?.dailyMsgCount || 0)) };
}
