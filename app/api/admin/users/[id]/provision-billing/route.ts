import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api-response";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { requireAdmin } from "@/lib/auth/get-session";
import { provisionNewUserBilling } from "@/lib/services/billing";
import { getAdminUser } from "@/lib/services/admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const user = await getAdminUser(id);
    if (!user) return jsonError("用户不存在", 404);

    await provisionNewUserBilling(id);
    const updated = await getAdminUser(id);
    return jsonOk({ user: updated });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("未登录", 401);
    }
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return jsonError("无权限", 403);
    }
    return jsonError("开通失败", 500);
  }
}
