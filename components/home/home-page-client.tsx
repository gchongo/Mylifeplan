"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HomeDashboard } from "@/components/home/home-dashboard";
import { Loading } from "@/components/ui/feedback";
import { useI18n } from "@/components/i18n/i18n-provider";
import { useMobileShell } from "@/hooks/use-mobile-shell";

function HomeLoading() {
  const { t } = useI18n();
  return <Loading label={t("common.loadingHome")} />;
}

function HomePageContent() {
  const router = useRouter();
  const isMobileShell = useMobileShell();

  useEffect(() => {
    if (isMobileShell) router.replace("/feed");
  }, [isMobileShell, router]);

  if (isMobileShell) {
    return <Loading label="…" />;
  }

  return <HomeDashboard />;
}

export function HomePageClient() {
  return (
    <Suspense fallback={<HomeLoading />}>
      <HomePageContent />
    </Suspense>
  );
}
