import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api-response";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { requireSession } from "@/lib/auth/get-session";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession(request);
    const { searchParams } = request.nextUrl;
    const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);
    const cursor = searchParams.get("cursor");

    const items = await prisma.feed.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    let nextCursor: string | null = null;
    if (items.length > limit) {
      const extra = items.pop();
      nextCursor = extra?.id ?? null;
    }

    return jsonOk({ items, nextCursor });
  } catch {
    return jsonError("未登录", 401);
  }
}
