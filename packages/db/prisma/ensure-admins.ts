/**
 * Ensure that Thomas and Jules have isAdmin = true.
 *
 * Run with:
 *   pnpm tsx prisma/ensure-admins.ts
 * (from packages/db)
 */
import { prisma } from "../src";

const ADMIN_EMAILS = [
  "thomas.jean28@outlook.fr",
  "jules.lamothe@kretzclub.com",
];

async function main() {
  for (const email of ADMIN_EMAILS) {
    const member = await prisma.member.findFirst({ where: { email } });
    if (!member) {
      console.warn(`⚠️  Member not found: ${email}`);
      continue;
    }
    if (member.isAdmin) {
      console.log(`✅ Already admin: ${email}`);
      continue;
    }
    await prisma.member.update({
      where: { id: member.id },
      data: { isAdmin: true },
    });
    console.log(`✨ Promoted to admin: ${email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
