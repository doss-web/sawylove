import { db } from "@/lib/db";

const DAILY_LIMIT = 50;

export async function checkRateLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { allowed: false, remaining: 0 };

  // Subscribers have unlimited
  if (user.isSubscribed && user.subscriptionEnd && user.subscriptionEnd > new Date()) {
    return { allowed: true, remaining: Infinity };
  }

  // Reset daily count if it's a new day
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const msgDate = new Date(user.msgCountDate);
  msgDate.setHours(0, 0, 0, 0);

  if (msgDate < today) {
    await db.user.update({ where: { id: userId }, data: { dailyMsgCount: 0, msgCountDate: new Date() } });
  }

  const count = msgDate < today ? 0 : user.dailyMsgCount;
  const allowed = count < DAILY_LIMIT;

  return { allowed, remaining: Math.max(0, DAILY_LIMIT - count) };
}

export async function incrementMessageCount(userId: string): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: { dailyMsgCount: { increment: 1 }, msgCountDate: new Date() },
  });
}
