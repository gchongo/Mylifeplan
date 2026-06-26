import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api-response";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { requireSession } from "@/lib/auth/get-session";
import { handleProtectedRouteError } from "@/lib/api/route-auth";
import { prisma } from "@/lib/db";
import { formatPlanDateTime } from "@/lib/dates";
import { collectPlanAncestors } from "@/lib/plan-relationship";
import { deletePlan, serializePlan, updatePlan } from "@/lib/services/plan";
import { revalidatePlanAppViews } from "@/lib/revalidate-app-views";
import { updatePlanSchema } from "@/lib/validations/plan";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession(request);
    const { id } = await params;
    const plan = await prisma.plan.findFirst({
      where: { id, userId: session.userId },
      include: {
        subPlans: { where: { status: { not: "archived" } }, orderBy: { createdAt: "asc" } },
        parentPlan: {
          include: {
            parentPlan: true,
          },
        },
      },
    });
    if (!plan) return jsonError("计划不存在", 404);
    return jsonOk({
      plan: {
        ...serializePlan(plan),
        subPlans: plan.subPlans.map(serializePlan),
        ancestors: collectPlanAncestors(plan, (p) => ({
          startDate: formatPlanDateTime(p.startDate ?? null),
          endDate: formatPlanDateTime(p.endDate ?? null),
        })),
      },
    });
  } catch (error) {
    return handleProtectedRouteError(error, "api/plans/[id] GET");
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession(request);
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
      ...(parsed.data.actualStartDate !== undefined && {
        actualStartDate: parsed.data.actualStartDate || null,
      }),
      ...(parsed.data.actualEndDate !== undefined && {
        actualEndDate: parsed.data.actualEndDate || null,
      }),
    };

    const plan = await updatePlan(session.userId, id, input);
    revalidatePlanAppViews();
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

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession(request);
    const { id } = await params;
    await deletePlan(session.userId, id);
    revalidatePlanAppViews();
    return jsonOk({ ok: true });
  } catch (error) {
    return handleProtectedRouteError(error, "api/plans/[id] DELETE");
  }
}
