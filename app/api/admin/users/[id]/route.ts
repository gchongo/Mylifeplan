import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/get-session";
import { getAdminUser, setUserActive } from "@/lib/services/admin";
import { adminUserPatchSchema } from "@/lib/validations/admin";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const user = await getAdminUser(id);
    if (!user) return jsonError("用户不存在", 404);
    return jsonOk({ user });
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

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const parsed = adminUserPatchSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "参数错误", 400);
    }

    const user = await setUserActive(session.userId, id, parsed.data.isActive);
    return jsonOk({ user });
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
    if (e instanceof Error) {
      return jsonError(e.message, 400);
    }
    return jsonError("更新失败", 500);
  }
}
