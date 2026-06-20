import { jsonError, jsonOk } from "@/lib/api-response";
import { requireSession } from "@/lib/auth/get-session";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await requireSession();
    const memos = await prisma.memo.findMany({
      where: { userId: session.userId },
      orderBy: { updatedAt: "desc" },
      include: {
        linkedTask: true,
        linkedPlan: true,
      },
    });

    return jsonOk({
      memos: memos.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        linkedTaskId: m.linkedTaskId,
        linkedPlanId: m.linkedPlanId,
        sourceType: m.linkedTaskId ? "task" : "plan",
        updatedAt: m.updatedAt,
      })),
    });
  } catch {
    return jsonError("未登录", 401);
  }
}
