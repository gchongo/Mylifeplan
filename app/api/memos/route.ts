import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-response";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { requireSession } from "@/lib/auth/get-session";
import { handleProtectedRouteError } from "@/lib/api/route-auth";
import { prisma } from "@/lib/db";
import { createPlan, serializePlan } from "@/lib/services/plan";
import {
  addMemoImages,
  createStandaloneMemo,
  serializeMemo,
} from "@/lib/services/memo";

const createMemoSchema = z.object({
  content: z.string().min(1, "内容不能为空").max(20000),
  imageUrls: z.array(z.string().min(1)).optional(),
  /** @deprecated 兼容旧客户端 */
  title: z.string().min(1).max(200).optional(),
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
        images: { orderBy: { createdAt: "asc" } },
        comments: { orderBy: { createdAt: "asc" } },
      },
    });

    return jsonOk({
      memos: memos.map(serializeMemo),
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

    if (parsed.data.content) {
      const memo = await createStandaloneMemo(session.userId, {
        content: parsed.data.content,
        imageUrls: parsed.data.imageUrls,
      });
      const full = await prisma.memo.findUniqueOrThrow({
        where: { id: memo.id },
        include: {
          images: { orderBy: { createdAt: "asc" } },
          comments: { orderBy: { createdAt: "asc" } },
        },
      });
      return jsonOk({ memo: serializeMemo(full) }, 201);
    }

    const plan = await createPlan(session.userId, {
      title: parsed.data.title!,
      description: parsed.data.description,
      type: "goal",
    });
    const memo = await prisma.memo.findUnique({
      where: { linkedPlanId: plan.id },
      include: {
        images: true,
        comments: true,
      },
    });
    return jsonOk(
      {
        memo: memo
          ? serializeMemo(memo)
          : {
              id: plan.id,
              title: plan.title,
              description: plan.description,
              body: plan.description,
              linkedPlanId: plan.id,
              sourceType: "plan" as const,
              createdAt: plan.createdAt.toISOString(),
              updatedAt: plan.updatedAt.toISOString(),
              images: [],
              comments: [],
              plan: serializePlan(plan),
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
