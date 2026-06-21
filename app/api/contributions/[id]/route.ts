import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api-response";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { requireSession } from "@/lib/auth/get-session";
import { handleProtectedRouteError } from "@/lib/api/route-auth";
import {
  deleteContribution,
  getContributionById,
  serializeContribution,
  updateContribution,
} from "@/lib/services/contribution";

import { updateContributionSchema } from "@/lib/validations/contribution";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession(request);
    const { id } = await params;
    const contribution = await getContributionById(session.userId, id);
    if (!contribution) return jsonError("记录不存在", 404);
    return jsonOk({
      contribution: {
        ...serializeContribution(contribution),
        plan: contribution.plan,
      },
    });
  } catch (error) {
    return handleProtectedRouteError(error, "api/contributions/[id] GET");
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession(request);
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

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession(request);
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
