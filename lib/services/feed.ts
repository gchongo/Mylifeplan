import type { FeedActionType, FeedItemType } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function writeFeed(params: {
  userId: string;
  itemType: FeedItemType;
  itemId: string;
  actionType: FeedActionType;
  content?: string | null;
}) {
  await prisma.feed.create({
    data: {
      userId: params.userId,
      itemType: params.itemType,
      itemId: params.itemId,
      actionType: params.actionType,
      content: params.content ?? null,
    },
  });
}

const ACTION_LABELS: Record<FeedActionType, string> = {
  create: "新增",
  update: "编辑",
  complete: "完成",
  archive: "归档",
};

const TYPE_LABELS: Record<FeedItemType, string> = {
  plan: "计划",
  memo: "备忘录",
  contribution: "贡献",
};

export function formatFeedSummary(
  itemType: FeedItemType,
  actionType: FeedActionType,
  content?: string | null,
): string {
  const prefix = `${ACTION_LABELS[actionType]}${TYPE_LABELS[itemType]}`;
  return content ? `${prefix}：${content}` : prefix;
}
