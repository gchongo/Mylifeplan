import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-response";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { requireSession } from "@/lib/auth/get-session";
import { handleProtectedRouteError } from "@/lib/api/route-auth";
import { validateDateFields } from "@/lib/content-router";
import { assignMemoToPlan } from "@/lib/services/memo";
import { serializePlan } from "@/lib/services/plan";

type Params = { params: Promise<{ id: string }> };

const assignPlanSchema = z
  .object({
    parentPlanId: z.string().optional().nullable(),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const start = data.startDate?.trim() || null;
    const end = data.endDate?.trim() || null;
    if (!start && !end) return;
    const error = validateDateFields({
      startDate: start || undefined,
      dueDate: end || undefined,
    });
    if (error) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: error });
    }
  });

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession(request);
    const { id } = await params;
    const body = await request.json();
    const parsed = assignPlanSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "参数错误", 400);
    }

    const plan = await assignMemoToPlan(session.userId, id, parsed.data);
    return jsonOk({ plan: serializePlan(plan) });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return jsonError("便签不存在或已关联计划", 404);
    }
    if (e instanceof Error) {
      return jsonError(e.message, 400);
    }
    return handleProtectedRouteError(e, "api/memos/[id]/assign-plan POST");
  }
}
