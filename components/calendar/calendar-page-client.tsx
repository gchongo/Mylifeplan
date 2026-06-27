"use client";

import { CalendarPanelLive } from "@/components/home/calendar-panel-live";
import { useI18n } from "@/components/i18n/i18n-provider";
import { useMobileShell } from "@/hooks/use-mobile-shell";
import { FullPanelPage } from "@/components/home/full-panel-page";

export function CalendarPageClient() {
  const { t } = useI18n();
  const isMobileShell = useMobileShell();

  if (isMobileShell) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-white dark:bg-gray-950">
        <CalendarPanelLive fullPage showMobileTitle className="h-full min-h-0 flex-1" />
      </div>
    );
  }

  return (
    <FullPanelPage title={t("calendar.homeTitle")}>
      <CalendarPanelLive fullPage className="min-h-0 flex-1" />
    </FullPanelPage>
  );
}
