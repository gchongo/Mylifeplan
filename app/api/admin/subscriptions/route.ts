import { jsonError, jsonOk } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/get-session";
import { listAdminSubscriptions } from "@/lib/services/admin";

export async function GET() {
  try {
    await requireAdmin();
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
