import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api-response";
import { requireSession } from "@/lib/auth/get-session";
import { prisma } from "@/lib/db";
import { createTask, serializeTask } from "@/lib/services/task";
import { createTaskSchema } from "@/lib/validations/task";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = request.nextUrl;
    const planId = searchParams.get("planId");
    const parentTaskId = searchParams.get("parentTaskId");

    const tasks = await prisma.task.findMany({
      where: {
        userId: session.userId,
        ...(planId && { planId }),
        ...(parentTaskId && { parentTaskId }),
      },
      orderBy: { updatedAt: "desc" },
    });

    return jsonOk({ tasks: tasks.map(serializeTask) });
  } catch {
    return jsonError("未登录", 401);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "参数错误", 400);
    }

    const input = {
      ...parsed.data,
      startDate: parsed.data.startDate || null,
      dueDate: parsed.data.dueDate || null,
    };

    const task = await createTask(session.userId, input);
    return jsonOk({ task: serializeTask(task) }, 201);
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("未登录", 401);
    }
    if (e instanceof Error) {
      return jsonError(e.message, 400);
    }
    return jsonError("创建失败", 500);
  }
}
