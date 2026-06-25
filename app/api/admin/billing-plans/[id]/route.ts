import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api-response";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { requireAdmin } from "@/lib/auth/get-session";
import { updateBillingPlan } from "@/lib/services/billing";
import { logAdminAction } from "@/lib/services/admin-audit";
import { billingPlanPatchSchema } from "@/lib/validations/admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await context.params;
    const body = await request.json();
    const parsed = billingPlanPatchSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "参数错误", 400);
    }

    const plan = await updateBillingPlan(id, parsed.data);
    await logAdminAction({
      adminUserId: admin.userId,
      action: "billing_plan.update",
      targetType: "billing_plan",
      targetId: id,
      detail: parsed.data as Record<string, unknown>,
    });
    return jsonOk({ plan });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return jsonError("套餐不存在", 404);
    }
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("未登录", 401);
    }
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return jsonError("无权限", 403);
    }
    return jsonError("保存失败", 500);
  }
}
