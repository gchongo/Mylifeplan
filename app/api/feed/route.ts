import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api-response";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { requireSession } from "@/lib/auth/get-session";
import { handleProtectedRouteError } from "@/lib/api/route-auth";
import { parseFeedItemTypeFilter } from "@/lib/feed-filters";
import { enrichFeedItems } from "@/lib/feed-enrich";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession(request);
    const { searchParams } = request.nextUrl;
    const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);
    const cursor = searchParams.get("cursor");
    const itemType = parseFeedItemTypeFilter(searchParams.get("itemType"));

    const items = await prisma.feed.findMany({
      where: {
        userId: session.userId,
        ...(itemType ? { itemType } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    let nextCursor: string | null = null;
    if (items.length > limit) {
      const extra = items.pop();
      nextCursor = extra?.id ?? null;
    }

    return jsonOk({
      items: (await enrichFeedItems(session.userId, items)).map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
      })),
      nextCursor,
    });
  } catch (error) {
    return handleProtectedRouteError(error, "api/feed GET");
  }
}
