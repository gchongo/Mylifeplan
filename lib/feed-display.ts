import type { FeedActionType, FeedItemType } from "@prisma/client";

const WEEKDAY_LABELS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

export function formatFeedCardDate(iso: string): string {
  const d = new Date(iso);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekday = WEEKDAY_LABELS[d.getDay()] ?? "";
  return `${month}月${day}日 ${weekday}`;
}

export function feedItemHref(itemType: FeedItemType | "task", itemId: string): string | null {
  if (itemType === "plan" || itemType === "task") return `/plans/${itemId}`;
  if (itemType === "memo") return "/memos";
  if (itemType === "contribution") return null;
  return null;
}

export function feedItemMeta(
  itemType: FeedItemType,
  actionType: FeedActionType,
): { label: string; completed: boolean; archived: boolean } {
  const archived = actionType === "archive";
  const completed = actionType === "complete";

  if (itemType === "memo") {
    return { label: "备忘", completed, archived };
  }
  if (itemType === "contribution") {
    return { label: "贡献", completed, archived };
  }
  return { label: "计划", completed, archived };
}

const URL_PATTERN = /https?:\/\/[^\s<>"']+/g;

export function splitTextWithLinks(text: string): Array<{ type: "text" | "link"; value: string }> {
  const parts: Array<{ type: "text" | "link"; value: string }> = [];
  let lastIndex = 0;
  for (const match of text.matchAll(URL_PATTERN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, index) });
    }
    parts.push({ type: "link", value: match[0] });
    lastIndex = index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) });
  }
  return parts.length > 0 ? parts : [{ type: "text", value: text }];
}

export function feedDisplayText(
  itemType: FeedItemType,
  actionType: FeedActionType,
  content: string | null,
): string {
  if (content?.trim()) return content.trim();

  const action =
    actionType === "create"
      ? "新建"
      : actionType === "update"
        ? "更新"
        : actionType === "complete"
          ? "完成"
          : "归档";
  const type =
    itemType === "memo"
      ? "备忘"
      : itemType === "contribution"
        ? "贡献"
        : "计划";
  return `${action}了${type}`;
}
