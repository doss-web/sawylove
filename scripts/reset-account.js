// Delete old dev-login account so you can re-register
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function main() {
  const email = "1402301442@qq.com";
  const u = await db.user.findUnique({ where: { email } });
  if (!u) {
    console.log("Account not found — nothing to delete.");
    await db.$disconnect();
    return;
  }
  await db.message.deleteMany({ where: { session: { userId: u.id } } });
  await db.chatSession.deleteMany({ where: { userId: u.id } });
  await db.userMemory.deleteMany({ where: { userId: u.id } });
  await db.user.delete({ where: { id: u.id } });
  console.log("✅ Old account deleted. You can now re-register at /login");
  await db.$disconnect();
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
