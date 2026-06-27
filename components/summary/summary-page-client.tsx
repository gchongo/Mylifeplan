"use client";

import { FullPanelPage } from "@/components/home/full-panel-page";
import { useI18n } from "@/components/i18n/i18n-provider";
import { SummaryDashboard } from "@/components/summary/summary-dashboard";

export function SummaryPageClient() {
  const { t } = useI18n();

  return (
    <FullPanelPage title={t("summary.title")} scrollable>
      <SummaryDashboard />
    </FullPanelPage>
  );
}
