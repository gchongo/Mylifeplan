import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api-response";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { requireAdmin } from "@/lib/auth/get-session";
import {
  createAdminSubscription,
  listAdminSubscriptions,
} from "@/lib/services/admin";
import { logAdminAction } from "@/lib/services/admin-audit";
import { adminSubscriptionCreateSchema } from "@/lib/validations/admin";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const subscriptions = await listAdminSubscriptions();
    return jsonOk({ subscriptions });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("未登录", 401);
    }
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return jsonError("无权限", 403);
    }
    return jsonError("获取失败", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    const body = await request.json();
    const parsed = adminSubscriptionCreateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "参数错误", 400);
    }

    const subscription = await createAdminSubscription(parsed.data);
    await logAdminAction({
      adminUserId: admin.userId,
      action: "subscription.create",
      targetType: "subscription",
      targetId: subscription.id,
      detail: { userId: parsed.data.userId, billingPlanId: parsed.data.billingPlanId },
    });
    return jsonOk({ subscription }, 201);
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return jsonError("用户不存在", 404);
    }
    if (e instanceof Error && e.message === "PLAN_NOT_FOUND") {
      return jsonError("套餐不存在", 404);
    }
    if (e instanceof Error && e.message === "套餐已停用") {
      return jsonError(e.message, 400);
    }
    if (e instanceof Error && e.message === "结束时间不能早于开始时间") {
      return jsonError(e.message, 400);
    }
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("未登录", 401);
    }
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return jsonError("无权限", 403);
    }
    return jsonError("创建失败", 500);
  }
}
