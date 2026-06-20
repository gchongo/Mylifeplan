import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api-response";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { requireAdmin } from "@/lib/auth/get-session";
import { listAdminSubscriptions } from "@/lib/services/admin";

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
