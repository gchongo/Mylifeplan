import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api-response";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { requireAdmin } from "@/lib/auth/get-session";
import { updateAdminSubscription } from "@/lib/services/admin";
import { logAdminAction } from "@/lib/services/admin-audit";
import { adminSubscriptionPatchSchema } from "@/lib/validations/admin";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;
    const body = await request.json();
    const parsed = adminSubscriptionPatchSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "参数错误", 400);
    }

    const subscription = await updateAdminSubscription(id, parsed.data);
    await logAdminAction({
      adminUserId: admin.userId,
      action: "subscription.update",
      targetType: "subscription",
      targetId: id,
      detail: parsed.data as Record<string, unknown>,
    });
    return jsonOk({ subscription });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return jsonError("订阅不存在", 404);
    }
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("未登录", 401);
    }
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return jsonError("无权限", 403);
    }
    if (e instanceof Error) {
      return jsonError(e.message, 400);
    }
    return jsonError("更新失败", 500);
  }
}
