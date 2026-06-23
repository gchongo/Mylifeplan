"use client";

import { CalendarPanelLive } from "@/components/home/calendar-panel-live";
import { FeedPanelLive } from "@/components/home/feed-panel-live";
import { SummaryPanelLive } from "@/components/home/summary-panel-live";
import { ResizableHomeLayout } from "@/components/home/resizable-home-layout";
import { MobileHomeTabs } from "@/components/layout/mobile-tab-bar";
import type { HomeTab } from "@/types";
import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

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

      {/* 桌面：可拖拽调整宽/高 */}
      <div className="hidden min-h-0 min-w-0 w-full max-w-full flex-1 overflow-hidden lg:flex">
        <ResizableHomeLayout />
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
