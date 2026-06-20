import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-response";
import { requireSession } from "@/lib/auth/get-session";
import { deleteMemoById, updateMemoById } from "@/lib/services/memo";
import { validateDateFields } from "@/lib/content-router";

type Params = { params: Promise<{ id: string }> };

const updateMemoSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).optional().nullable(),
    startDate: z.string().optional().nullable(),
    dueDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const error = validateDateFields({
      startDate: data.startDate || undefined,
      dueDate: (data.dueDate ?? data.endDate) || undefined,
    });
    if (error) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: error });
    }
  });

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const body = await request.json();
    const parsed = updateMemoSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "参数错误", 400);
    }

    const result = await updateMemoById(session.userId, id, parsed.data);
    return jsonOk({ result });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return jsonError("备忘录不存在", 404);
    }
    if (e instanceof Error) {
      return jsonError(e.message, 400);
    }
    return jsonError("更新失败", 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    await deleteMemoById(session.userId, id);
    return jsonOk({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return jsonError("备忘录不存在", 404);
    }
    return jsonError("未登录", 401);
  }
}
