"use client";

import type { HomeTab } from "@/types";
import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { FixedHomeLayout } from "@/components/home/fixed-home-layout";
import { MobileHomeTabs } from "@/components/layout/mobile-tab-bar";
import { PanelSkeleton } from "@/components/ui/panel-skeleton";

const FeedPanelLive = dynamic(
  () => import("@/components/home/feed-panel-live").then((m) => m.FeedPanelLive),
  { loading: () => <PanelSkeleton className="h-full min-h-[320px]" />, ssr: false },
);

const SummaryPanelLive = dynamic(
  () => import("@/components/home/summary-panel-live").then((m) => m.SummaryPanelLive),
  { loading: () => <PanelSkeleton className="h-full min-h-[240px]" />, ssr: false },
);

const CalendarPanelLive = dynamic(
  () => import("@/components/home/calendar-panel-live").then((m) => m.CalendarPanelLive),
  { loading: () => <PanelSkeleton className="h-full min-h-[280px]" />, ssr: false },
);

function resolveMobileTab(tabParam: string | null): HomeTab {
  if (tabParam === "calendar") return "calendar";
  if (tabParam === "summary" || tabParam === "gantt") return "summary";
  return "feed";
}

export function HomeDashboard() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [mobileTab, setMobileTab] = useState<HomeTab>(() => resolveMobileTab(tabParam));

  const handleTabChange = useCallback((tab: HomeTab) => {
    setMobileTab(tab);
    const url = tab === "feed" ? "/" : `/?tab=${tab}`;
    window.history.replaceState(null, "", url);
  }, []);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="mb-4 shrink-0 px-4 pt-4 lg:hidden">
        <MobileHomeTabs active={mobileTab} onChange={handleTabChange} />
      </div>

      {/* 桌面：左侧信息流可调宽；右侧总结/日历固定高度比 */}
      <div className="hidden min-h-0 min-w-0 w-full max-w-full flex-1 overflow-hidden lg:flex">
        <FixedHomeLayout />
      </div>

      {/* 移动：单 Tab */}
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden lg:hidden">
        {mobileTab === "feed" && <FeedPanelLive />}
        {mobileTab === "summary" && <SummaryPanelLive />}
        {mobileTab === "calendar" && <CalendarPanelLive />}
      </div>
    </div>
  );
}
