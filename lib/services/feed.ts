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

/** Supports legacy `task` feed rows migrated to plans. */
export function feedTypeLabel(itemType: FeedItemType | "task"): string {
  switch (itemType) {
    case "memo":
      return "便签";
    case "contribution":
      return "贡献";
    case "plan":
    case "task":
      return "计划";
    default:
      return "条目";
  }
}

export function formatFeedSummary(
  itemType: FeedItemType,
  actionType: FeedActionType,
  content?: string | null,
): string {
  const prefix = `${ACTION_LABELS[actionType]}${feedTypeLabel(itemType)}`;
  return content ? `${prefix}：${content}` : prefix;
}
