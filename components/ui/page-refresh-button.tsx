"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { cn } from "@/lib/utils";

export function PageRefreshButton({
  onRefresh,
  className,
}: {
  onRefresh: () => void | Promise<void>;
  className?: string;
}) {
  const { t } = useI18n();
  const [refreshing, setRefreshing] = useState(false);

  async function handleClick() {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={refreshing}
      aria-label={t("layout.refreshPage")}
      title={t("layout.refreshPage")}
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100",
        className,
      )}
    >
      <svg
        className={cn("h-[18px] w-[18px]", refreshing && "animate-spin")}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 4v5h5M20 20v-5h-5M20 4A8 8 0 004 12M4 20a8 8 0 0016-8"
        />
      </svg>
    </button>
  );
}
