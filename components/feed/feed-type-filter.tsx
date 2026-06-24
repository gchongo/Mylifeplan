"use client";

import { useI18n } from "@/components/i18n/i18n-provider";
import { FEED_TYPE_FILTERS, type FeedTypeFilter } from "@/lib/feed-filters";
import { localizeFeedTypeFilterLabel } from "@/lib/i18n/feed-helpers";
import { cn } from "@/lib/utils";

export function FeedTypeFilter({
  value,
  onChange,
  className,
}: {
  value: FeedTypeFilter;
  onChange: (next: FeedTypeFilter) => void;
  className?: string;
}) {
  const { t } = useI18n();

  return (
    <div
      className={cn(
        "shrink-0 border-y border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900",
        className,
      )}
      role="tablist"
      aria-label={t("feed.filterAria")}
    >
      <div className="flex items-stretch justify-center gap-6 sm:gap-10">
        {FEED_TYPE_FILTERS.map((filter) => {
          const active = value === filter.id;
          return (
            <button
              key={filter.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(filter.id)}
              className={cn(
                "relative px-1 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "text-gray-900 dark:text-gray-100"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
              )}
            >
              {localizeFeedTypeFilterLabel(t, filter.id)}
              {active && (
                <span
                  className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brand-600 dark:bg-brand-500"
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
