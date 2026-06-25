import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function logAdminAction(input: {
  adminUserId: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  detail?: Record<string, unknown> | null;
}) {
  await prisma.adminAuditLog.create({
    data: {
      adminUserId: input.adminUserId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      detail: (input.detail ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function listAdminAuditLogs(limit = 100) {
  const rows = await prisma.adminAuditLog.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { admin: { select: { email: true } } },
  });
  return rows.map((row) => ({
    id: row.id,
    adminEmail: row.admin.email,
    action: row.action,
    targetType: row.targetType,
    targetId: row.targetId,
    detail: row.detail,
    createdAt: row.createdAt.toISOString(),
  }));
}
