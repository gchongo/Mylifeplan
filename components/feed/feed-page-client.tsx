"use client";

import { FullPanelPage } from "@/components/home/full-panel-page";
import { FeedPanelLive } from "@/components/home/feed-panel-live";
import { useI18n } from "@/components/i18n/i18n-provider";

export function FeedPageClient() {
  const { t } = useI18n();

  return (
    <FullPanelPage title={t("feed.homeTitle")} centered scrollable>
      <FeedPanelLive fullPage />
    </FullPanelPage>
  );
}
