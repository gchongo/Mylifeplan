import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api-response";
import { requireSession } from "@/lib/auth/get-session";
import { prisma } from "@/lib/db";
import { deletePlan, serializePlan, updatePlan } from "@/lib/services/plan";
import { updatePlanSchema } from "@/lib/validations/plan";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const plan = await prisma.plan.findFirst({
      where: { id, userId: session.userId },
      include: {
        subPlans: { where: { status: { not: "archived" } }, orderBy: { createdAt: "asc" } },
      },
    });
    if (!plan) return jsonError("计划不存在", 404);
    return jsonOk({
      plan: {
        ...serializePlan(plan),
        subPlans: plan.subPlans.map(serializePlan),
      },
    });
  } catch {
    return jsonError("未登录", 401);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const body = await request.json();
    const parsed = updatePlanSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "参数错误", 400);
    }

    const input = {
      ...parsed.data,
      ...(parsed.data.startDate !== undefined && {
        startDate: parsed.data.startDate || null,
      }),
      ...(parsed.data.endDate !== undefined && {
        endDate: parsed.data.endDate || null,
      }),
    };

    const plan = await updatePlan(session.userId, id, input);
    return jsonOk({ plan: serializePlan(plan) });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return jsonError("计划不存在", 404);
    }
    if (e instanceof Error) {
      return jsonError(e.message, 400);
    }
    return jsonError("更新失败", 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    await deletePlan(session.userId, id);
    return jsonOk({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return jsonError("计划不存在", 404);
    }
    return jsonError("未登录", 401);
  }
}
