"use client";

import Link from "next/link";
import { FeedPanelLive } from "@/components/home/feed-panel-live";
import { FullPanelPage } from "@/components/home/full-panel-page";
import { useI18n } from "@/components/i18n/i18n-provider";
import { panelSectionTitleClass } from "@/lib/panel-title";
import { useMobileShell } from "@/hooks/use-mobile-shell";

export function FeedPageClient() {
  const { t } = useI18n();
  const isMobileShell = useMobileShell();

  if (!isMobileShell) {
    return (
      <FullPanelPage title={t("feed.homeTitle")} centered scrollable>
        <FeedPanelLive fullPage scrollable />
      </FullPanelPage>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-white dark:bg-gray-950">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-100 px-3 py-2.5 dark:border-gray-800">
        <h1 className={panelSectionTitleClass}>
          {t("feed.homeTitle")}
        </h1>
        <Link
          href="/summary"
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-900"
        >
          <span aria-hidden>◫</span>
          {t("mobile.summary")}
        </Link>
      </header>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-2 pt-2">
        <FeedPanelLive fullPage scrollable />
      </div>
    </div>
  );
}
