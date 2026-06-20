"use client";

import Link from "next/link";
import type { FeedActionType, FeedItemType } from "@prisma/client";
import {
  feedDisplayText,
  feedItemHref,
  feedItemMeta,
  formatFeedCardDate,
  splitTextWithLinks,
} from "@/lib/feed-display";
import { cn } from "@/lib/utils";

export interface FeedItemCardData {
  id: string;
  itemType: FeedItemType;
  itemId: string;
  actionType: FeedActionType;
  content: string | null;
  createdAt: string;
}

export function FeedItemCard({
  item,
  onPlanClick,
}: {
  item: FeedItemCardData;
  onPlanClick?: (planId: string) => void;
}) {
  const href = feedItemHref(item.itemType, item.itemId);
  const isPlan = item.itemType === "plan";
  const meta = feedItemMeta(item.itemType, item.actionType);
  const text = feedDisplayText(item.itemType, item.actionType, item.content);
  const parts = splitTextWithLinks(text);
  const dateLabel = formatFeedCardDate(item.createdAt);

  const body = (
    <div
      className={cn(
        "text-sm leading-relaxed text-gray-800",
        meta.completed && "text-gray-500 line-through",
        meta.archived && "text-gray-400",
      )}
    >
      {meta.completed && (
        <span className="mr-1.5 inline-flex h-4 w-4 items-center justify-center rounded border border-gray-300 bg-gray-100 text-[10px] text-gray-600">
          ✓
        </span>
      )}
      {parts.map((part, i) =>
        part.type === "link" ? (
          <a
            key={i}
            href={part.value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-600 underline decoration-brand-200 underline-offset-2 hover:text-brand-700"
            onClick={(e) => e.stopPropagation()}
          >
            {part.value}
          </a>
        ) : (
          <span key={i}>{part.value}</span>
        ),
      )}
    </div>
  );

  return (
    <article className="feed-item-card rounded-xl border border-gray-200 bg-white shadow-sm">
      <header className="flex items-center justify-between gap-2 border-b border-gray-100 px-3 py-2">
        <time className="text-xs text-gray-500" dateTime={item.createdAt}>
          {dateLabel}
        </time>
        <div className="flex items-center gap-1">
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
            {meta.label}
          </span>
        </div>
      </header>
      <div className="px-3 py-2.5">
        {isPlan && onPlanClick ? (
          <button
            type="button"
            className="block w-full text-left hover:opacity-90"
            onClick={() => onPlanClick(item.itemId)}
          >
            {body}
          </button>
        ) : href ? (
          <Link href={href} className="block hover:opacity-90">
            {body}
          </Link>
        ) : (
          body
        )}
      </div>
    </article>
  );
}
