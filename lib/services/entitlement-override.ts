import { prisma } from "@/lib/db";

export interface EntitlementOverrideInput {
  maxPlans?: number | null;
  maxStorageBytes?: number | null;
  maxFileBytes?: number | null;
  reason?: string | null;
  expiresAt?: string | null;
}

export async function getUserEntitlementOverride(userId: string) {
  const row = await prisma.userEntitlementOverride.findUnique({ where: { userId } });
  if (!row) return null;
  if (row.expiresAt && row.expiresAt < new Date()) return null;
  return row;
}

export async function upsertUserEntitlementOverride(
  userId: string,
  adminUserId: string,
  input: EntitlementOverrideInput,
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("NOT_FOUND");

  const allEmpty =
    input.maxPlans == null &&
    input.maxStorageBytes == null &&
    input.maxFileBytes == null &&
    !input.reason?.trim();

  if (allEmpty) {
    await prisma.userEntitlementOverride.deleteMany({ where: { userId } });
    return null;
  }

  return prisma.userEntitlementOverride.upsert({
    where: { userId },
    create: {
      userId,
      maxPlans: input.maxPlans ?? null,
      maxStorageBytes: input.maxStorageBytes ?? null,
      maxFileBytes: input.maxFileBytes ?? null,
      reason: input.reason?.trim() || null,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      updatedBy: adminUserId,
    },
    update: {
      maxPlans: input.maxPlans ?? null,
      maxStorageBytes: input.maxStorageBytes ?? null,
      maxFileBytes: input.maxFileBytes ?? null,
      reason: input.reason?.trim() || null,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      updatedBy: adminUserId,
    },
  });
}

export function serializeEntitlementOverride(
  row: NonNullable<Awaited<ReturnType<typeof getUserEntitlementOverride>>>,
) {
  return {
    maxPlans: row.maxPlans,
    maxStorageBytes: row.maxStorageBytes,
    maxFileBytes: row.maxFileBytes,
    reason: row.reason,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
  };
}
