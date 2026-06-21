import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-response";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { requireSession } from "@/lib/auth/get-session";
import { handleProtectedRouteError } from "@/lib/api/route-auth";
import { createMemoComment, deleteMemoComment } from "@/lib/services/memo";

type Params = { params: Promise<{ id: string }> };

const createSchema = z.object({
  body: z.string().min(1, "评论不能为空").max(2000),
});

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession(request);
    const { id } = await params;
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "参数错误", 400);
    }
    const comment = await createMemoComment(session.userId, id, parsed.data.body);
    return jsonOk(
      {
        comment: {
          id: comment.id,
          body: comment.body,
          createdAt: comment.createdAt.toISOString(),
        },
      },
      201,
    );
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return jsonError("备忘录不存在", 404);
    }
    if (e instanceof Error) return jsonError(e.message, 400);
    return jsonError("评论失败", 500);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession(request);
    const { id: memoId } = await params;
    const commentId = request.nextUrl.searchParams.get("commentId");
    if (!commentId) return jsonError("缺少 commentId", 400);
    await deleteMemoComment(session.userId, commentId);
    return jsonOk({ ok: true, memoId });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return jsonError("评论不存在", 404);
    }
    return handleProtectedRouteError(e, "api/memos/[id]/comments DELETE");
  }
}
