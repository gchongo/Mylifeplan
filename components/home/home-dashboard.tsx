"use client";

import { CalendarPanelLive } from "@/components/home/calendar-panel-live";
import { FeedPanelLive } from "@/components/home/feed-panel-live";
import { GanttPanelLive } from "@/components/home/gantt-panel-live";
import { ResizableHomeLayout } from "@/components/home/resizable-home-layout";
import { MobileHomeTabs } from "@/components/layout/mobile-tab-bar";
import type { HomeTab } from "@/types";
import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

export function HomeDashboard() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as HomeTab | null;
  const [mobileTab, setMobileTab] = useState<HomeTab>(
    tabParam === "gantt" || tabParam === "calendar" ? tabParam : "feed",
  );

  const handleTabChange = useCallback((tab: HomeTab) => {
    setMobileTab(tab);
    const url = tab === "feed" ? "/" : `/?tab=${tab}`;
    window.history.replaceState(null, "", url);
  }, []);

  return (
    <div className="flex h-[calc(100vh-8rem)] w-full min-w-0 max-w-full flex-col overflow-hidden lg:h-[calc(100vh-5.5rem)]">
      <MobileHomeTabs active={mobileTab} onChange={handleTabChange} />

      {/* 桌面：可拖拽调整宽/高 */}
      <div className="hidden min-h-0 min-w-0 w-full max-w-full flex-1 overflow-hidden lg:flex">
        <ResizableHomeLayout />
      </div>

      {/* 移动：单 Tab */}
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden lg:hidden">
        {mobileTab === "feed" && <FeedPanelLive />}
        {mobileTab === "gantt" && <GanttPanelLive />}
        {mobileTab === "calendar" && <CalendarPanelLive />}
      </div>
    </div>
  );
}
