import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api-response";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { requireAdmin } from "@/lib/auth/get-session";
import { getAdminUser } from "@/lib/services/admin";
import { logAdminAction } from "@/lib/services/admin-audit";
import {
  serializeEntitlementOverride,
  upsertUserEntitlementOverride,
} from "@/lib/services/entitlement-override";
import { entitlementOverridePatchSchema } from "@/lib/validations/admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await context.params;
    const body = await request.json();
    const parsed = entitlementOverridePatchSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "参数错误", 400);
    }

    const row = await upsertUserEntitlementOverride(id, admin.userId, parsed.data);
    await logAdminAction({
      adminUserId: admin.userId,
      action: row ? "entitlement_override.update" : "entitlement_override.clear",
      targetType: "user",
      targetId: id,
      detail: parsed.data as Record<string, unknown>,
    });

    const user = await getAdminUser(id);
    return jsonOk({
      user,
      entitlementOverride: row ? serializeEntitlementOverride(row) : null,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return jsonError("用户不存在", 404);
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

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await context.params;
    await upsertUserEntitlementOverride(id, admin.userId, {
      maxPlans: null,
      maxStorageBytes: null,
      maxFileBytes: null,
      reason: null,
      expiresAt: null,
    });
    await logAdminAction({
      adminUserId: admin.userId,
      action: "entitlement_override.clear",
      targetType: "user",
      targetId: id,
    });
    const user = await getAdminUser(id);
    return jsonOk({ user, entitlementOverride: null });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return jsonError("用户不存在", 404);
    }
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("未登录", 401);
    }
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return jsonError("无权限", 403);
    }
    return jsonError("清除失败", 500);
  }
}
