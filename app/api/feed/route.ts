import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api-response";
import { requireSession } from "@/lib/auth/get-session";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") ?? 30), 100);

    const items = await prisma.feed.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return jsonOk({ items });
  } catch {
    return jsonError("未登录", 401);
  }
}
