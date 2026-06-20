import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api-response";
import { requireSession } from "@/lib/auth/get-session";
import { prisma } from "@/lib/db";
import {
  deleteContribution,
  serializeContribution,
  updateContribution,
} from "@/lib/services/contribution";
import { updateContributionSchema } from "@/lib/validations/contribution";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const contribution = await prisma.planContribution.findFirst({
      where: { id, userId: session.userId },
      include: { plan: { select: { id: true, title: true, type: true } } },
    });
    if (!contribution) return jsonError("记录不存在", 404);
    return jsonOk({
      contribution: {
        ...serializeContribution(contribution),
        plan: contribution.plan,
      },
    });
  } catch {
    return jsonError("未登录", 401);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const body = await request.json();
    const parsed = updateContributionSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "参数错误", 400);
    }

    const contribution = await updateContribution(session.userId, id, parsed.data);
    return jsonOk({ contribution: serializeContribution(contribution) });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return jsonError("记录不存在", 404);
    }
    if (e instanceof Error) return jsonError(e.message, 400);
    return jsonError("更新失败", 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    await deleteContribution(session.userId, id);
    return jsonOk({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return jsonError("记录不存在", 404);
    }
    return jsonError("删除失败", 500);
  }
}
