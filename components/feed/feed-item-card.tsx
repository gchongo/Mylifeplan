"use client";

import Link from "next/link";
import type { FeedActionType, FeedItemType } from "@prisma/client";
import {
  feedItemHref,
  feedItemMeta,
  formatFeedCardDate,
  splitTextWithLinks,
} from "@/lib/feed-display";
import { formatPlanDateTimeDisplay } from "@/lib/dates";
import type { FeedPlanDetail } from "@/lib/feed-enrich";
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
  planDetail?: FeedPlanDetail;
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

const PLAN_STATUS_LABELS: Record<string, string> = {
  not_started: "未开始",
  in_progress: "进行中",
  done: "已完成",
  archived: "已归档",
};

function FeedPlanInlineBody({ detail, planId }: { detail: FeedPlanDetail; planId: string }) {
  const schedule = [formatPlanDateTimeDisplay(detail.startDate), formatPlanDateTimeDisplay(detail.endDate)]
    .filter((v) => v !== "—")
    .join(" — ");

  return (
    <div className="mt-2 space-y-2 rounded-lg border border-gray-100 bg-gray-50/80 p-2.5 dark:border-gray-800 dark:bg-gray-900/40">
      {detail.description?.trim() && <ExcerptText text={detail.description.trim()} />}
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
        <dt className="text-gray-400">状态</dt>
        <dd>{PLAN_STATUS_LABELS[detail.status] ?? detail.status}</dd>
        {schedule && (
          <>
            <dt className="text-gray-400">计划</dt>
            <dd className="tabular-nums">{schedule}</dd>
          </>
        )}
        {detail.actualStartDate && (
          <>
            <dt className="text-gray-400">实开</dt>
            <dd className="tabular-nums">{formatPlanDateTimeDisplay(detail.actualStartDate)}</dd>
          </>
        )}
        {detail.actualEndDate && (
          <>
            <dt className="text-gray-400">实止</dt>
            <dd className="tabular-nums">{formatPlanDateTimeDisplay(detail.actualEndDate)}</dd>
          </>
        )}
      </dl>
      <Link
        href={`/plans/${planId}`}
        className="inline-block text-xs text-brand-600 hover:underline dark:text-brand-400"
      >
        打开计划详情页 →
      </Link>
    </div>
  );
}

export function FeedItemCard({
  item,
  onPlanClick,
  onContributionClick,
  logStyle = false,
  inlinePlan = false,
}: {
  item: FeedItemCardData;
  onPlanClick?: (planId: string) => void;
  onContributionClick?: (contributionId: string) => void;
  logStyle?: boolean;
  /** 计划分类：内联展示计划详情，不弹窗 */
  inlinePlan?: boolean;
}) {
  const href = feedItemHref(item.itemType, item.itemId);
  const isPlan = item.itemType === "plan";
  const isContribution = item.itemType === "contribution";
  const showInlinePlan = inlinePlan && isPlan && item.planDetail;
  const meta = feedItemMeta(item.itemType, item.actionType);
  const dateLabel = formatFeedCardDate(item.createdAt);

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
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {meta.completed && (
              <span className="mr-1.5 inline-flex h-4 w-4 items-center justify-center rounded border border-gray-300 bg-gray-100 text-[10px] text-gray-600">
                ✓
              </span>
            )}
            {item.actionPhrase}
          </p>
          <h3
            className={cn(
              "text-base font-semibold leading-snug text-gray-900 dark:text-gray-100",
              meta.completed && "text-gray-500 line-through",
              meta.archived && "text-gray-400",
            )}
          >
            {showInlinePlan ? (
              <Link href={`/plans/${item.itemId}`} className="hover:text-brand-700 dark:hover:text-brand-300">
                {item.headline}
              </Link>
            ) : (
              item.headline
            )}
          </h3>
          {item.excerpt && !isPlan && (
            <ExcerptText text={item.excerpt} className="line-clamp-2" />
          )}
          {showInlinePlan && item.planDetail && (
            <FeedPlanInlineBody detail={item.planDetail} planId={item.itemId} />
          )}
        </>
      )}
    </div>
  );

  const interactiveBody =
    isPlan && onPlanClick && !showInlinePlan ? (
      <button
        type="button"
        className="block w-full text-left hover:opacity-90"
        onClick={() => onPlanClick(item.itemId)}
      >
        {body}
      </button>
    ) : showInlinePlan ? (
      body
    ) : href ? (
      <Link href={href} className="block hover:opacity-90">
        {body}
      </Link>
    ) : (
      body
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
        {interactiveBody}
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
      <div className="px-3 py-2.5">{interactiveBody}</div>
    </article>
  );
}
