import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api-response";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { requireAdmin } from "@/lib/auth/get-session";
import { listAdminAuditLogs } from "@/lib/services/admin-audit";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const limitRaw = request.nextUrl.searchParams.get("limit");
    const limit = limitRaw ? Math.min(200, Math.max(1, Number.parseInt(limitRaw, 10))) : 100;
    const logs = await listAdminAuditLogs(Number.isFinite(limit) ? limit : 100);
    return jsonOk({ logs });
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
