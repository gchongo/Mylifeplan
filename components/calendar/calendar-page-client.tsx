"use client";

import { FullPanelPage } from "@/components/home/full-panel-page";
import { CalendarPanelLive } from "@/components/home/calendar-panel-live";
import { useI18n } from "@/components/i18n/i18n-provider";
import { useMobileShell } from "@/hooks/use-mobile-shell";

export function CalendarPageClient() {
  const { t } = useI18n();
  const isMobileShell = useMobileShell();

  if (isMobileShell) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-white dark:bg-gray-950">
        <header className="flex shrink-0 items-center border-b border-gray-100 px-3 py-2.5 dark:border-gray-800">
          <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {t("calendar.homeTitle")}
          </h1>
        </header>
        <CalendarPanelLive fullPage className="min-h-0 flex-1" />
      </div>
    );
  }

  return (
    <FullPanelPage title={t("calendar.homeTitle")}>
      <CalendarPanelLive fullPage className="min-h-0 flex-1" />
    </FullPanelPage>
  );
}
