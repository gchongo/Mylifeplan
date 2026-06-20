import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api-response";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { requireSession } from "@/lib/auth/get-session";
import { handleProtectedRouteError } from "@/lib/api/route-auth";
import { prisma } from "@/lib/db";
import { createStandaloneMemo } from "@/lib/services/memo";
import { z } from "zod";

const createMemoSchema = z.object({
  title: z.string().min(1, "内容不能为空").max(200),
  description: z.string().max(5000).optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession(request);
    const memos = await prisma.memo.findMany({
      where: { userId: session.userId },
      orderBy: { updatedAt: "desc" },
      include: {
        linkedPlan: true,
      },
    });

    return jsonOk({
      memos: memos.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        linkedPlanId: m.linkedPlanId,
        sourceType: m.linkedPlanId ? "plan" : "standalone",
        updatedAt: m.updatedAt,
      })),
    });
  } catch (error) {
    return handleProtectedRouteError(error, "api/memos GET");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession(request);
    const body = await request.json();
    const parsed = createMemoSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "参数错误", 400);
    }

    const memo = await createStandaloneMemo(session.userId, parsed.data);
    return jsonOk(
      {
        memo: {
          id: memo.id,
          title: memo.title,
          description: memo.description,
          sourceType: "standalone" as const,
          updatedAt: memo.updatedAt,
        },
      },
      201,
    );
  } catch (e) {
    if (e instanceof Error) {
      return jsonError(e.message, 400);
    }
    return jsonError("创建失败", 500);
  }
}
