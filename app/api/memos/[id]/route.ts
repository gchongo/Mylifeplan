import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-response";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { requireSession } from "@/lib/auth/get-session";
import { handleProtectedRouteError } from "@/lib/api/route-auth";
import { deleteMemoById, updateMemoById, archiveMemoById, addMemoImages } from "@/lib/services/memo";
import { validateDateFields } from "@/lib/content-router";

type Params = { params: Promise<{ id: string }> };

const updateMemoSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(20000).optional().nullable(),
    body: z.string().max(20000).optional().nullable(),
    content: z.string().max(20000).optional(),
    imageUrls: z.array(z.string()).optional(),
    startDate: z.string().optional().nullable(),
    dueDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    posX: z.number().optional().nullable(),
    posY: z.number().optional().nullable(),
    zIndex: z.number().int().min(1).max(9999).optional(),
    color: z.string().max(20).optional(),
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
    const session = await requireSession(request);
    const { id } = await params;
    const body = await request.json();

    if (body?.archive === true) {
      await archiveMemoById(session.userId, id);
      return jsonOk({ ok: true });
    }

    const parsed = updateMemoSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "参数错误", 400);
    }

    const result = await updateMemoById(session.userId, id, parsed.data);
    if (parsed.data.imageUrls?.length) {
      await addMemoImages(session.userId, id, parsed.data.imageUrls);
    }
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

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession(request);
    const { id } = await params;
    await deleteMemoById(session.userId, id);
    return jsonOk({ ok: true });
  } catch (error) {
    return handleProtectedRouteError(error, "api/memos/[id] DELETE");
  }
}
