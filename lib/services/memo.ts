import { splitMemoContent } from "@/lib/memo-content";
import {
  isBlankStickyMemo,
  isMemoQuadrantId,
  detectMemoQuadrant,
  defaultPositionForQuadrant,
  DEFAULT_STICKY_WIDTH,
  DEFAULT_STICKY_HEIGHT,
  MEMO_QUADRANT_BOARD_WIDTH,
  MEMO_QUADRANT_BOARD_HEIGHT,
} from "@/lib/memo-quadrant";
import { nextStickyColor, defaultStickyPosition } from "@/lib/memo-sticky";
import { parseDateOnly } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { syncMemoForPlan } from "@/lib/services/memo-sync";
import { createPlan, updatePlan } from "@/lib/services/plan";
import { writeFeed } from "@/lib/services/feed";

export async function createStandaloneMemo(
  userId: string,
  data: {
    content?: string;
    imageUrls?: string[];
    color?: string;
    posX?: number;
    posY?: number;
    quadrant?: string | null;
    width?: number;
    height?: number;
    /** 空便签：无内容时创建占位，不写信息流 */
    empty?: boolean;
  },
  noteIndex = 0,
) {
  const content = data.content?.trim() ?? "";
  const { title, body } = content ? splitMemoContent(content) : { title: "", body: "" };
  if (!data.empty && !content && !data.imageUrls?.length) {
    throw new Error("内容不能为空");
  }

  const pos =
    data.posX != null && data.posY != null
      ? { x: data.posX, y: data.posY }
      : data.quadrant && isMemoQuadrantId(data.quadrant)
        ? defaultPositionForQuadrant(
            data.quadrant,
            MEMO_QUADRANT_BOARD_WIDTH,
            MEMO_QUADRANT_BOARD_HEIGHT,
            noteIndex,
          )
        : defaultStickyPosition(noteIndex);

  const quadrant =
    data.quadrant && isMemoQuadrantId(data.quadrant)
      ? data.quadrant
      : detectMemoQuadrant(
          pos.x,
          pos.y,
          data.width ?? DEFAULT_STICKY_WIDTH,
          data.height ?? DEFAULT_STICKY_HEIGHT,
          MEMO_QUADRANT_BOARD_WIDTH,
          MEMO_QUADRANT_BOARD_HEIGHT,
        );

  return prisma.$transaction(async (tx) => {
    const memo = await tx.memo.create({
      data: {
        userId,
        title: data.empty ? "" : title || "新便签",
        description: body || null,
        body: body || null,
        color: data.color ?? nextStickyColor(noteIndex),
        posX: pos.x,
        posY: pos.y,
        zIndex: noteIndex + 1,
        quadrant,
        width: data.width ?? null,
        height: data.height ?? null,
      },
    });

    if (data.imageUrls?.length) {
      await tx.memoImage.createMany({
        data: data.imageUrls.map((url) => ({ memoId: memo.id, url })),
      });
    }

    if (!data.empty) {
      await writeFeed({
        userId,
        itemType: "memo",
        itemId: memo.id,
        actionType: "create",
        content: memo.title.trim() || body?.slice(0, 80) || "便签",
      });
    }

    return memo;
  });
}

function memoUpdateWritesFeed(data: {
  title?: string;
  description?: string | null;
  body?: string | null;
  content?: string;
  startDate?: string | null;
  endDate?: string | null;
}): boolean {
  return (
    data.title !== undefined ||
    data.description !== undefined ||
    data.body !== undefined ||
    data.content !== undefined ||
    data.startDate !== undefined ||
    data.endDate !== undefined
  );
}

export async function updateMemoById(
  userId: string,
  memoId: string,
  data: {
    title?: string;
    description?: string | null;
    body?: string | null;
    content?: string;
    startDate?: string | null;
    endDate?: string | null;
    posX?: number | null;
    posY?: number | null;
    zIndex?: number;
    color?: string;
    quadrant?: string | null;
    width?: number | null;
    height?: number | null;
  },
) {
  const memo = await prisma.memo.findFirst({ where: { id: memoId, userId } });
  if (!memo) throw new Error("NOT_FOUND");
  const wasBlank = isBlankStickyMemo(memo);

  function feedTitle(updated: { title: string; body: string | null }) {
    const fromTitle = updated.title.trim();
    if (fromTitle && fromTitle !== "新便签") return fromTitle;
    const fromBody = updated.body?.trim();
    if (fromBody) return fromBody.split(/\n/)[0]!.slice(0, 80);
    return "便签";
  }

  let title = data.title;
  let description = data.description;
  let body = data.body;

  if (data.content !== undefined) {
    const split = splitMemoContent(data.content);
    title = split.title || "无标题";
    body = split.body || data.content.trim();
    description = body;
  }

  if (memo.linkedPlanId) {
    const plan = await prisma.plan.findFirst({ where: { id: memo.linkedPlanId, userId } });
    if (!plan) throw new Error("NOT_FOUND");

    return prisma.$transaction(async (tx) => {
      const updated = await tx.plan.update({
        where: { id: plan.id },
        data: {
          ...(title !== undefined && { title: title.trim() }),
          ...(description !== undefined && {
            description: description?.trim() || null,
          }),
          ...(data.startDate !== undefined && { startDate: parseDateOnly(data.startDate || null) }),
          ...(data.endDate !== undefined && { endDate: parseDateOnly(data.endDate || null) }),
        },
      });

      await syncMemoForPlan(updated, tx);
      if (body !== undefined) {
        await tx.memo.update({
          where: { id: memoId },
          data: { body: body?.trim() || null },
        });
      }

      if (memoUpdateWritesFeed(data)) {
        await writeFeed({
          userId,
          itemType: "plan",
          itemId: updated.id,
          actionType: "update",
          content: updated.title,
        });
      }

      return { type: "plan" as const, item: updated };
    });
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.memo.update({
      where: { id: memo.id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && {
          description: description?.trim() || null,
        }),
        ...(body !== undefined && { body: body?.trim() || null }),
        ...(data.posX !== undefined && { posX: data.posX }),
        ...(data.posY !== undefined && { posY: data.posY }),
        ...(data.zIndex !== undefined && { zIndex: data.zIndex }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.quadrant !== undefined && {
          quadrant: data.quadrant && isMemoQuadrantId(data.quadrant) ? data.quadrant : null,
        }),
        ...(data.width !== undefined && { width: data.width }),
        ...(data.height !== undefined && { height: data.height }),
      },
    });

    const nextQuadrant =
      data.quadrant !== undefined
        ? data.quadrant && isMemoQuadrantId(data.quadrant)
          ? data.quadrant
          : null
        : undefined;
    const quadrantChanged =
      nextQuadrant !== undefined && nextQuadrant !== memo.quadrant;

    if (memoUpdateWritesFeed(data) || quadrantChanged) {
      await writeFeed({
        userId,
        itemType: "memo",
        itemId: updated.id,
        actionType: wasBlank ? "create" : "update",
        content: feedTitle(updated),
      });
    }

    return { type: "memo" as const, item: updated };
  });
}

export async function addMemoImages(userId: string, memoId: string, urls: string[]) {
  const memo = await prisma.memo.findFirst({ where: { id: memoId, userId } });
  if (!memo) throw new Error("NOT_FOUND");
  if (urls.length === 0) return [];
  await prisma.memoImage.createMany({
    data: urls.map((url) => ({ memoId, url })),
  });
  return prisma.memoImage.findMany({ where: { memoId }, orderBy: { createdAt: "asc" } });
}

export async function createMemoComment(userId: string, memoId: string, body: string) {
  const text = body.trim();
  if (!text) throw new Error("评论不能为空");
  const memo = await prisma.memo.findFirst({ where: { id: memoId, userId } });
  if (!memo) throw new Error("NOT_FOUND");
  return prisma.memoComment.create({
    data: { memoId, userId, body: text },
  });
}

export async function deleteMemoComment(userId: string, commentId: string) {
  const comment = await prisma.memoComment.findFirst({
    where: { id: commentId, userId },
  });
  if (!comment) throw new Error("NOT_FOUND");
  await prisma.memoComment.delete({ where: { id: commentId } });
}

export async function archiveMemoById(userId: string, memoId: string) {
  const memo = await prisma.memo.findFirst({ where: { id: memoId, userId } });
  if (!memo) throw new Error("NOT_FOUND");

  if (memo.linkedPlanId) {
    return updatePlan(userId, memo.linkedPlanId, { status: "archived" });
  }

  return prisma.$transaction(async (tx) => {
    await tx.memo.delete({ where: { id: memoId } });
    await writeFeed({
      userId,
      itemType: "memo",
      itemId: memoId,
      actionType: "archive",
      content: memo.title,
    });
  });
}

export async function assignMemoToPlan(
  userId: string,
  memoId: string,
  input: {
    parentPlanId?: string | null;
    startDate: string;
    endDate?: string | null;
  },
) {
  const memo = await prisma.memo.findFirst({
    where: { id: memoId, userId, linkedPlanId: null },
    include: { images: { orderBy: { createdAt: "asc" } } },
  });
  if (!memo) throw new Error("NOT_FOUND");

  const startDate = input.startDate.trim();
  if (!startDate) throw new Error("请设置开始时间");

  let description = memo.body?.trim() || memo.description?.trim() || null;
  if (memo.images.length > 0) {
    const imageMd = memo.images.map((img) => `![](${img.url})`).join("\n\n");
    description = description ? `${description}\n\n${imageMd}` : imageMd;
  }

  const plan = await createPlan(userId, {
    title: memo.title.trim() || "新计划",
    description,
    type: "goal",
    parentPlanId: input.parentPlanId || null,
    startDate,
    endDate: input.endDate?.trim() || null,
  });

  await prisma.memo.delete({ where: { id: memoId } });

  return plan;
}

export async function deleteMemoById(userId: string, memoId: string) {
  const memo = await prisma.memo.findFirst({ where: { id: memoId, userId } });
  if (!memo) throw new Error("NOT_FOUND");

  await prisma.$transaction(async (tx) => {
    if (memo.linkedPlanId) {
      await tx.plan.delete({ where: { id: memo.linkedPlanId } });
    }
    await tx.memo.delete({ where: { id: memoId } });
  });
}

export function serializeMemo(
  m: {
    id: string;
    title: string;
    description: string | null;
    body: string | null;
    linkedPlanId: string | null;
    posX?: number | null;
    posY?: number | null;
    zIndex?: number;
    color?: string;
    quadrant?: string | null;
    width?: number | null;
    height?: number | null;
    createdAt: Date;
    updatedAt: Date;
    images?: { id: string; url: string; createdAt: Date }[];
    comments?: { id: string; body: string; createdAt: Date }[];
  },
) {
  return {
    id: m.id,
    title: m.title,
    description: m.description,
    body: m.body,
    linkedPlanId: m.linkedPlanId,
    posX: m.posX,
    posY: m.posY,
    zIndex: m.zIndex ?? 1,
    color: m.color ?? "yellow",
    quadrant: m.quadrant ?? null,
    width: m.width ?? null,
    height: m.height ?? null,
    sourceType: m.linkedPlanId ? ("plan" as const) : ("standalone" as const),
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
    images: (m.images ?? []).map((img) => ({
      id: img.id,
      url: img.url,
      createdAt: img.createdAt.toISOString(),
    })),
    comments: (m.comments ?? []).map((c) => ({
      id: c.id,
      body: c.body,
      createdAt: c.createdAt.toISOString(),
    })),
  };
}
