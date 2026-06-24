"use client";

import type { FeedActionType, FeedItemType } from "@prisma/client";
import {
  feedItemMeta,
  formatFeedCardDate,
  splitTextWithLinks,
} from "@/lib/feed-display";
import type { PlanFeedChangeItem } from "@/lib/plan-feed-change";
import { PlanFeedChangeLines } from "@/components/feed/plan-feed-change-lines";
import { cn } from "@/lib/utils";

export interface FeedItemCardData {
  id: string;
  itemType: FeedItemType;
  itemId: string;
  actionType: FeedActionType;
  content: string | null;
  createdAt: string;
  headline: string;
  excerpt: string | null;
  contextLabel: string | null;
  actionPhrase: string;
  planUpdateChanges?: PlanFeedChangeItem[] | null;
  planUpdateSummary?: string | null;
}

function ExcerptText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const parts = splitTextWithLinks(text);
  return (
    <p className={cn("text-sm leading-relaxed text-gray-600 dark:text-gray-400", className)}>
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
    </p>
  );
}

export function FeedItemCard({
  item,
  onContributionClick,
  logStyle = false,
}: {
  item: FeedItemCardData;
  onContributionClick?: (contributionId: string) => void;
  logStyle?: boolean;
}) {
  const isPlan = item.itemType === "plan";
  const isContribution = item.itemType === "contribution";
  const meta = feedItemMeta(item.itemType, item.actionType);
  const dateLabel = formatFeedCardDate(item.createdAt);
  const hasPlanUpdateDetail =
    isPlan &&
    ((item.planUpdateChanges?.length ?? 0) > 0 || Boolean(item.planUpdateSummary));
  const showActionPhrase = !hasPlanUpdateDetail;

  const body = (
    <div className="space-y-1">
      {isContribution ? (
        <>
          {onContributionClick ? (
            <button
              type="button"
              className={cn(
                "text-left text-base font-bold leading-snug text-brand-700 underline decoration-brand-200 underline-offset-2 hover:text-brand-800 dark:text-brand-400",
                meta.archived && "text-gray-400 no-underline",
              )}
              onClick={() => onContributionClick(item.itemId)}
            >
              {item.headline}
            </button>
          ) : (
            <h3
              className={cn(
                "text-base font-bold leading-snug text-gray-900 dark:text-gray-100",
                meta.archived && "text-gray-400",
              )}
            >
              {item.headline}
            </h3>
          )}
          {item.contextLabel && (
            <p className="text-xs text-gray-400 dark:text-gray-500">{item.contextLabel}</p>
          )}
          {item.excerpt && <ExcerptText text={item.excerpt} className="mt-2 line-clamp-4" />}
        </>
      ) : (
        <>
          {showActionPhrase && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {meta.completed && (
                <span className="mr-1.5 inline-flex h-4 w-4 items-center justify-center rounded border border-gray-300 bg-gray-100 text-[10px] text-gray-600">
                  ✓
                </span>
              )}
              {item.actionPhrase}
            </p>
          )}
          <h3
            className={cn(
              "text-base font-semibold leading-snug text-gray-900 dark:text-gray-100",
              meta.completed && "text-gray-500 line-through",
              meta.archived && "text-gray-400",
            )}
          >
            {item.headline}
          </h3>
          {hasPlanUpdateDetail && item.planUpdateChanges && item.planUpdateChanges.length > 0 && (
            <PlanFeedChangeLines changes={item.planUpdateChanges} />
          )}
          {hasPlanUpdateDetail && item.planUpdateSummary && (
            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              {item.planUpdateSummary}
            </p>
          )}
          {item.excerpt && !isPlan && (
            <ExcerptText text={item.excerpt} className="line-clamp-2" />
          )}
        </>
      )}
    </div>
  );

  if (isContribution || logStyle) {
    return (
      <article className="feed-item-log border-b border-gray-200 py-4 last:border-b-0 dark:border-gray-800">
        <header className="mb-2 flex items-center justify-between gap-2">
          <time className="text-xs text-gray-500" dateTime={item.createdAt}>
            {dateLabel}
          </time>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500 dark:bg-gray-800">
            {meta.label}
          </span>
        </header>
        {body}
      </article>
    );
  }

  return (
    <article className="feed-item-card rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <header className="flex items-center justify-between gap-2 border-b border-gray-100 px-3 py-2 dark:border-gray-800">
        <time className="text-xs text-gray-500" dateTime={item.createdAt}>
          {dateLabel}
        </time>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500 dark:bg-gray-800">
          {meta.label}
        </span>
      </header>
      <div className="px-3 py-2.5">{body}</div>
    </article>
  );
}
