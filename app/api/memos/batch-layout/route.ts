import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-response";
import { requireSession } from "@/lib/auth/get-session";
import { handleProtectedRouteError } from "@/lib/api/route-auth";
import { batchUpdateMemoLayout } from "@/lib/services/memo";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const batchLayoutSchema = z.object({
  updates: z
    .array(
      z.object({
        id: z.string().min(1),
        posX: z.number().optional().nullable(),
        posY: z.number().optional().nullable(),
        zIndex: z.number().int().min(1).max(9999).optional(),
        quadrant: z.string().max(40).optional().nullable(),
        width: z.number().min(120).max(560).optional().nullable(),
        height: z.number().min(100).max(480).optional().nullable(),
      }),
    )
    .min(1)
    .max(200),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireSession(request);
    const body = await request.json();
    const parsed = batchLayoutSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "参数错误", 400);
    }

    const memos = await batchUpdateMemoLayout(session.userId, parsed.data.updates);
    return jsonOk({ memos });
  } catch (error) {
    return handleProtectedRouteError(error, "api/memos/batch-layout PATCH");
  }
}
