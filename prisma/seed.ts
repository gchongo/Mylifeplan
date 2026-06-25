import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/auth/password";
import { seedBillingPlans } from "../lib/services/billing";

const prisma = new PrismaClient();

async function main() {
  await seedBillingPlans();
  const freePlan = await prisma.billingPlan.findUnique({ where: { slug: "free" } });
  if (!freePlan) throw new Error("Failed to seed free billing plan");

  const adminEmail = "admin@meridian.local";
  const demoEmail = "demo@meridian.local";
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

  const endAt = new Date();
  endAt.setFullYear(endAt.getFullYear() + 1);

  await prisma.subscription.upsert({
    where: { id: "seed-demo-sub" },
    update: {
      billingPlanId: freePlan.id,
      planName: freePlan.nameZh,
    },
    create: {
      id: "seed-demo-sub",
      userId: demo.id,
      billingPlanId: freePlan.id,
      planName: freePlan.nameZh,
      status: "active",
      startAt: new Date(),
      endAt,
      paymentStatus: "paid",
    },
  });

  await prisma.userStorage.upsert({
    where: { userId: demo.id },
    create: { userId: demo.id, usedBytes: 0 },
    update: {},
  });

  await prisma.userStorage.upsert({
    where: { userId: admin.id },
    create: { userId: admin.id, usedBytes: 0 },
    update: {},
  });

  console.log("Seed complete:");
  console.log(`  Admin: ${adminEmail} / ${password}`);
  console.log(`  Demo:  ${demoEmail} / ${password}`);
  console.log(`  Billing plans: free (10 plans, 15MB), pro`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
