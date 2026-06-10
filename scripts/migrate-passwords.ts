// One-time script: migrate existing User.password → Account table
// Run: npx ts-node scripts/migrate-passwords.ts

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("Finding users with passwords...");
  const users = await db.user.findMany({
    where: { password: { not: null } },
    include: { accounts: true },
  });

  console.log(`Found ${users.length} users with passwords.`);

  let migrated = 0;
  let skipped = 0;

  for (const user of users) {
    // Skip if already has a credential account
    const hasCredential = user.accounts.some(a => a.providerId === "credential");
    if (hasCredential) {
      skipped++;
      console.log(`  SKIP ${user.email}: already has credential account`);
      continue;
    }

    await db.account.create({
      data: {
        providerId: "credential",
        accountId: user.email,
        password: user.password!,
        userId: user.id,
      },
    });
    migrated++;
    console.log(`  OK ${user.email}`);
  }

  console.log(`\nDone: ${migrated} migrated, ${skipped} skipped.`);
  await db.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
