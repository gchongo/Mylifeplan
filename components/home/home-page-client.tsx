"use client";

import { Suspense } from "react";
import { HomeDashboard } from "@/components/home/home-dashboard";
import { Loading } from "@/components/ui/feedback";
import { useI18n } from "@/components/i18n/i18n-provider";

function HomeLoading() {
  const { t } = useI18n();
  return <Loading label={t("common.loadingHome")} />;
}

export function HomePageClient() {
  return (
    <Suspense fallback={<HomeLoading />}>
      <HomeDashboard />
    </Suspense>
  );
}
