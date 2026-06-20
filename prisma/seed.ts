import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/auth/password";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@mylifeplan.local";
  const demoEmail = "demo@mylifeplan.local";
  const password = "password123";

  const passwordHash = await hashPassword(password);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      name: "管理员",
      role: "admin",
    },
  });

  const demo = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      email: demoEmail,
      passwordHash,
      name: "演示用户",
      role: "user",
    },
  });

  await prisma.subscription.upsert({
    where: { id: "seed-demo-sub" },
    update: {},
    create: {
      id: "seed-demo-sub",
      userId: demo.id,
      planName: "免费版",
      status: "active",
      startAt: new Date(),
      endAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      paymentStatus: "paid",
    },
  });

  console.log("Seed complete:");
  console.log(`  Admin: ${adminEmail} / ${password}`);
  console.log(`  Demo:  ${demoEmail} / ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
