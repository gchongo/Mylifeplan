import type { Task } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { validateDateFields } from "@/lib/content-router";
import { parseDateOnly } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { writeFeed } from "@/lib/services/feed";
import { deleteMemoForTask, syncMemoForTask } from "@/lib/services/memo-sync";
import { deriveStatusFromDirectChildren, validateManualStatusChange } from "@/lib/services/task-rollup";
import type { createTaskSchema } from "@/lib/validations/task";
import type { z } from "zod";

type Tx = Prisma.TransactionClient;

type CreateTaskInput = z.infer<typeof createTaskSchema>;
type UpdateTaskInput = Partial<CreateTaskInput>;

async function getTaskDepth(taskId: string, userId: string): Promise<number> {
  let depth = 1;
  let current: Task | null = await prisma.task.findFirst({ where: { id: taskId, userId } });
  while (current?.parentTaskId) {
    depth++;
    current = await prisma.task.findFirst({
      where: { id: current.parentTaskId, userId },
    });
  }
  return depth;
}

function feedActionForTask(
  prev: Task["status"],
  next: Task["status"],
): "archive" | "complete" | "update" {
  if (next === "archived" && prev !== "archived") return "archive";
  if (next === "done" && prev !== "done") return "complete";
  return "update";
}

async function validateParentTask(
  userId: string,
  parentTaskId: string | null | undefined,
  taskId?: string,
): Promise<string | null> {
  if (!parentTaskId) return null;
  if (taskId && parentTaskId === taskId) return "不能将任务设为自己的父任务";

  const parent = await prisma.task.findFirst({ where: { id: parentTaskId, userId } });
  if (!parent) return "父任务不存在";

  const parentDepth = await getTaskDepth(parentTaskId, userId);
  if (parentDepth >= 3) return "任务层级最多 3 层";

  if (taskId) {
    let cursor: string | null = parentTaskId;
    while (cursor) {
      if (cursor === taskId) return "不能将子任务设为父任务";
      const node: Task | null = await prisma.task.findFirst({
        where: { id: cursor, userId },
      });
      cursor = node?.parentTaskId ?? null;
    }
  }

  return null;
}

async function validatePlanRef(userId: string, planId: string | null | undefined) {
  if (!planId) return null;
  const plan = await prisma.plan.findFirst({ where: { id: planId, userId } });
  if (!plan) return "所属计划不存在";
  return null;
}

function validateDates(startDate: string | null | undefined, dueDate: string | null | undefined) {
  return validateDateFields({
    startDate: startDate ?? undefined,
    dueDate: dueDate ?? undefined,
  });
}

async function applyTaskStatusIfChanged(
  userId: string,
  taskId: string,
  prevStatus: Task["status"],
  nextStatus: Task["status"],
  tx: Tx,
): Promise<void> {
  if (nextStatus === prevStatus) return;

  const updated = await tx.task.update({
    where: { id: taskId },
    data: { status: nextStatus },
  });
  await syncMemoForTask(updated, tx);
  await writeFeed({
    userId,
    itemType: "task",
    itemId: updated.id,
    actionType: feedActionForTask(prevStatus, nextStatus),
    content: updated.title,
  });
}

/** 有子任务时，将自身状态与直接子任务汇总对齐 */
async function reconcileTaskWithChildren(userId: string, taskId: string, tx: Tx): Promise<void> {
  const task = await tx.task.findFirst({ where: { id: taskId, userId } });
  if (!task) return;

  const children = await tx.task.findMany({
    where: { parentTaskId: taskId, userId },
    select: { status: true },
  });
  if (children.length === 0) return;

  const nextStatus = deriveStatusFromDirectChildren(children.map((c) => c.status));
  if (!nextStatus) return;

  await applyTaskStatusIfChanged(userId, taskId, task.status, nextStatus, tx);
}

/** 自底向上：每层只看直接子任务，全部完成则父任务自动完成 */
async function syncParentStatusesUpward(
  userId: string,
  startParentId: string | null | undefined,
  tx: Tx,
): Promise<void> {
  let parentId = startParentId ?? null;

  while (parentId) {
    const parent = await tx.task.findFirst({ where: { id: parentId, userId } });
    if (!parent) break;

    const children = await tx.task.findMany({
      where: { parentTaskId: parent.id, userId },
      select: { status: true },
    });
    if (children.length === 0) break;

    const nextStatus = deriveStatusFromDirectChildren(children.map((c) => c.status));
    if (nextStatus) {
      await applyTaskStatusIfChanged(userId, parent.id, parent.status, nextStatus, tx);
    }

    parentId = parent.parentTaskId;
  }
}

export async function createTask(userId: string, input: CreateTaskInput): Promise<Task> {
  const dateError = validateDates(input.startDate, input.dueDate);
  if (dateError) throw new Error(dateError);

  const parentError = await validateParentTask(userId, input.parentTaskId);
  if (parentError) throw new Error(parentError);

  const planError = await validatePlanRef(userId, input.planId);
  if (planError) throw new Error(planError);

  return prisma.$transaction(async (tx) => {
    const task = await tx.task.create({
      data: {
        userId,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        status: input.status ?? "todo",
        priority: input.priority ?? null,
        startDate: parseDateOnly(input.startDate),
        dueDate: parseDateOnly(input.dueDate),
        parentTaskId: input.parentTaskId || null,
        planId: input.planId || null,
      },
    });

    await syncMemoForTask(task, tx);
    await writeFeed({
      userId,
      itemType: "task",
      itemId: task.id,
      actionType: "create",
      content: task.title,
    });

    await syncParentStatusesUpward(userId, task.parentTaskId, tx);

    return task;
  });
}

export async function updateTask(
  userId: string,
  taskId: string,
  input: UpdateTaskInput,
): Promise<Task> {
  const existing = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!existing) throw new Error("NOT_FOUND");

  const startStr =
    input.startDate !== undefined
      ? input.startDate
      : existing.startDate?.toISOString().slice(0, 10);
  const dueStr =
    input.dueDate !== undefined ? input.dueDate : existing.dueDate?.toISOString().slice(0, 10);

  const dateError = validateDates(startStr, dueStr);
  if (dateError) throw new Error(dateError);

  const parentId =
    input.parentTaskId !== undefined ? input.parentTaskId : existing.parentTaskId;
  const parentError = await validateParentTask(userId, parentId, taskId);
  if (parentError) throw new Error(parentError);

  const planId = input.planId !== undefined ? input.planId : existing.planId;
  const planError = await validatePlanRef(userId, planId);
  if (planError) throw new Error(planError);

  if (input.status !== undefined) {
    const children = await prisma.task.findMany({
      where: { parentTaskId: taskId, userId },
      select: { status: true },
    });
    const statusError = validateManualStatusChange(
      input.status,
      children.map((c) => c.status),
    );
    if (statusError) throw new Error(statusError);
  }

  const newStatus = input.status ?? existing.status;
  const actionType = feedActionForTask(existing.status, newStatus);

  return prisma.$transaction(async (tx) => {
    const task = await tx.task.update({
      where: { id: taskId },
      data: {
        ...(input.title !== undefined && { title: input.title.trim() }),
        ...(input.description !== undefined && {
          description: input.description?.trim() || null,
        }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.priority !== undefined && { priority: input.priority }),
        ...(input.startDate !== undefined && { startDate: parseDateOnly(input.startDate) }),
        ...(input.dueDate !== undefined && { dueDate: parseDateOnly(input.dueDate) }),
        ...(input.parentTaskId !== undefined && { parentTaskId: input.parentTaskId || null }),
        ...(input.planId !== undefined && { planId: input.planId || null }),
      },
    });

    await syncMemoForTask(task, tx);
    await writeFeed({
      userId,
      itemType: "task",
      itemId: task.id,
      actionType,
      content: task.title,
    });

    await reconcileTaskWithChildren(userId, taskId, tx);
    await syncParentStatusesUpward(userId, task.parentTaskId, tx);
    if (
      input.parentTaskId !== undefined &&
      input.parentTaskId !== existing.parentTaskId &&
      existing.parentTaskId
    ) {
      await syncParentStatusesUpward(userId, existing.parentTaskId, tx);
    }

    return task;
  });
}

export async function deleteTask(userId: string, taskId: string) {
  const existing = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!existing) throw new Error("NOT_FOUND");

  await prisma.$transaction(async (tx) => {
    const parentTaskId = existing.parentTaskId;
    await deleteMemoForTask(taskId, tx);
    await tx.task.delete({ where: { id: taskId } });
    await syncParentStatusesUpward(userId, parentTaskId, tx);
  });
}

export function serializeTask(task: Task) {
  return {
    ...task,
    startDate: task.startDate?.toISOString().slice(0, 10) ?? null,
    dueDate: task.dueDate?.toISOString().slice(0, 10) ?? null,
  };
}
