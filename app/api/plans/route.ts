import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api-response";
import { requireSession } from "@/lib/auth/get-session";
import { prisma } from "@/lib/db";
import { createPlan, serializePlan } from "@/lib/services/plan";
import { createPlanSchema } from "@/lib/validations/plan";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = request.nextUrl;
    const type = searchParams.get("type");
    const parentPlanId = searchParams.get("parentPlanId");

    const plans = await prisma.plan.findMany({
      where: {
        userId: session.userId,
        status: { not: "archived" },
        ...(type && { type: type as "goal" | "phase" | "weekly" | "daily" }),
        ...(parentPlanId && { parentPlanId }),
      },
      orderBy: [{ type: "asc" }, { updatedAt: "desc" }],
      include: { parentPlan: { select: { title: true } } },
    });

    return jsonOk({
      plans: plans.map((p) => ({
        ...serializePlan(p),
        parentTitle: p.parentPlan?.title ?? null,
      })),
    });
  } catch {
    return jsonError("未登录", 401);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const parsed = createPlanSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "参数错误", 400);
    }

    const input = {
      ...parsed.data,
      startDate: parsed.data.startDate || null,
      endDate: parsed.data.endDate || null,
    };

    const plan = await createPlan(session.userId, input);
    return jsonOk({ plan: serializePlan(plan) }, 201);
  } catch (e) {
    if (e instanceof Error) {
      return jsonError(e.message, 400);
    }
    return jsonError("创建失败", 500);
  }
}
