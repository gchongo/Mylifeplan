import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api-response";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { requireAdmin } from "@/lib/auth/get-session";
import { listAdminUsers } from "@/lib/services/admin";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const users = await listAdminUsers();
    return jsonOk({ users });
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
