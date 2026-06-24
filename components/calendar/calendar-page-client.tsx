"use client";

import { FullPanelPage } from "@/components/home/full-panel-page";
import { CalendarPanelLive } from "@/components/home/calendar-panel-live";
import { useI18n } from "@/components/i18n/i18n-provider";

export function CalendarPageClient() {
  const { t } = useI18n();

  return (
    <FullPanelPage title={t("calendar.homeTitle")} centered>
      <CalendarPanelLive fullPage />
    </FullPanelPage>
  );
}
