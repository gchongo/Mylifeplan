"use client";

import type { PlanFeedChangeItem } from "@/lib/plan-feed-change";
import { useI18n } from "@/components/i18n/i18n-provider";
import { localizePlanChangeLabel } from "@/lib/i18n/feed-helpers";
import { cn } from "@/lib/utils";

function PlanFeedChangeLine({ change }: { change: PlanFeedChangeItem }) {
  const { t } = useI18n();
  const label = localizePlanChangeLabel(t, change.label);
  const { before, after } = change;
  const hasBefore = before != null && before !== "";
  const hasAfter = after != null && after !== "";

  if (hasBefore && hasAfter) {
    return (
      <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
        {t("feed.planChange.updated", { label })}
        <span
          className={cn(
            "text-gray-400 line-through decoration-gray-300 dark:text-gray-500 dark:decoration-gray-600",
          )}
        >
          {before}
        </span>
        <span className="mx-1 text-gray-300 dark:text-gray-600">→</span>
        <span className="text-gray-700 dark:text-gray-300">{after}</span>
      </p>
    );
  }

  if (hasBefore && !hasAfter) {
    return (
      <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
        {t("feed.planChange.cleared", { label })}
        <span
          className={cn(
            "text-gray-400 line-through decoration-gray-300 dark:text-gray-500 dark:decoration-gray-600",
          )}
        >
          {before}
        </span>
      </p>
    );
  }

  if (!hasBefore && hasAfter) {
    return (
      <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
        {t("feed.planChange.updated", { label })}
        <span className="text-gray-700 dark:text-gray-300">{after}</span>
      </p>
    );
  }

  return null;
}

export function PlanFeedChangeLines({ changes }: { changes: PlanFeedChangeItem[] }) {
  return (
    <div className="space-y-0.5">
      {changes.map((change, i) => (
        <PlanFeedChangeLine key={`${change.label}-${i}`} change={change} />
      ))}
    </div>
  );
}
