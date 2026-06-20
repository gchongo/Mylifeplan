import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api-response";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { requireSession } from "@/lib/auth/get-session";
import { handleProtectedRouteError } from "@/lib/api/route-auth";
import { prisma } from "@/lib/db";
import { createPlan, serializePlan } from "@/lib/services/plan";
import { createPlanSchema } from "@/lib/validations/plan";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession(request);
    const { searchParams } = request.nextUrl;
    const parentPlanId = searchParams.get("parentPlanId");

    const plans = await prisma.plan.findMany({
      where: {
        userId: session.userId,
        status: { not: "archived" },
        ...(parentPlanId && { parentPlanId }),
      },
      orderBy: [{ updatedAt: "desc" }],
      include: {
        parentPlan: { select: { title: true } },
        subPlans: {
          where: { status: { not: "archived" } },
          select: { status: true },
        },
      },
    });

    return jsonOk({
      plans: plans.map((p) => ({
        ...serializePlan(p),
        parentTitle: p.parentPlan?.title ?? null,
        childStatuses: p.subPlans.map((c) => c.status),
      })),
    });
  } catch (error) {
    return handleProtectedRouteError(error, "api/plans GET");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession(request);
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
  } catch (error) {
    if (error instanceof Error && error.message !== "UNAUTHORIZED" && error.message !== "FORBIDDEN") {
      return jsonError(error.message, 400);
    }
    return handleProtectedRouteError(error, "api/plans POST");
  }
}
