import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api-response";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { requireSession } from "@/lib/auth/get-session";
import { handleProtectedRouteError } from "@/lib/api/route-auth";
import { prisma } from "@/lib/db";

function serializeProfile(user: { email: string; name: string | null; avatar: string | null }) {
  return {
    email: user.email,
    name: user.name,
    avatar: user.avatar,
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession(request);
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { email: true, name: true, avatar: true },
    });
    if (!user) return jsonError("用户不存在", 404);
    return jsonOk({ profile: serializeProfile(user) });
  } catch (error) {
    return handleProtectedRouteError(error, "api/me/profile GET");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireSession(request);
    const body = await request.json();
    const data: { name?: string | null; avatar?: string | null } = {};

    if (body.name !== undefined) {
      if (body.name === null || body.name === "") {
        data.name = null;
      } else if (typeof body.name === "string") {
        const trimmed = body.name.trim();
        if (trimmed.length > 40) {
          return jsonError("昵称不能超过 40 个字符", 400);
        }
        data.name = trimmed || null;
      } else {
        return jsonError("昵称格式无效", 400);
      }
    }

    if (body.avatar !== undefined) {
      if (body.avatar === null || body.avatar === "") {
        data.avatar = null;
      } else if (typeof body.avatar === "string") {
        const prefix = `/uploads/avatars/${session.userId}/`;
        if (!body.avatar.startsWith(prefix)) {
          return jsonError("头像地址无效", 400);
        }
        data.avatar = body.avatar;
      } else {
        return jsonError("头像格式无效", 400);
      }
    }

    if (Object.keys(data).length === 0) {
      return jsonError("没有可更新的字段", 400);
    }

    const user = await prisma.user.update({
      where: { id: session.userId },
      data,
      select: { email: true, name: true, avatar: true },
    });

    return jsonOk({ profile: serializeProfile(user) });
  } catch (error) {
    return handleProtectedRouteError(error, "api/me/profile PATCH");
  }
}
