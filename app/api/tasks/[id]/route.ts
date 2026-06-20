import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api-response";
import { requireSession } from "@/lib/auth/get-session";
import { prisma } from "@/lib/db";
import { deleteTask, serializeTask, updateTask } from "@/lib/services/task";
import { updateTaskSchema } from "@/lib/validations/task";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const task = await prisma.task.findFirst({
      where: { id, userId: session.userId },
    });
    if (!task) return jsonError("任务不存在", 404);
    return jsonOk({ task: serializeTask(task) });
  } catch {
    return jsonError("未登录", 401);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const body = await request.json();
    const parsed = updateTaskSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "参数错误", 400);
    }

    const input = {
      ...parsed.data,
      ...(parsed.data.startDate !== undefined && {
        startDate: parsed.data.startDate || null,
      }),
      ...(parsed.data.dueDate !== undefined && {
        dueDate: parsed.data.dueDate || null,
      }),
    };

    const task = await updateTask(session.userId, id, input);
    return jsonOk({ task: serializeTask(task) });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return jsonError("任务不存在", 404);
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
    await deleteTask(session.userId, id);
    return jsonOk({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return jsonError("任务不存在", 404);
    }
    return jsonError("未登录", 401);
  }
}
