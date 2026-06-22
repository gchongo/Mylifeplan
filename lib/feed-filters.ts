import type { FeedItemType } from "@prisma/client";

export type FeedTypeFilter = "all" | FeedItemType;

export const FEED_TYPE_FILTERS: { id: FeedTypeFilter; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "plan", label: "计划" },
  { id: "memo", label: "备忘" },
  { id: "contribution", label: "贡献" },
];

const ITEM_TYPES = new Set<FeedItemType>(["plan", "memo", "contribution"]);

export function parseFeedItemTypeFilter(value: string | null): FeedItemType | null {
  if (!value || value === "all") return null;
  return ITEM_TYPES.has(value as FeedItemType) ? (value as FeedItemType) : null;
}
