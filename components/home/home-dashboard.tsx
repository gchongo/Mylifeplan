"use client";

import { CalendarPanel } from "@/components/home/calendar-panel";
import { FeedPanel } from "@/components/home/feed-panel";
import { GanttPanel } from "@/components/home/gantt-panel";
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
    <div className="flex h-[calc(100vh-8rem)] flex-col lg:h-[calc(100vh-5.5rem)]">
      <MobileHomeTabs active={mobileTab} onChange={handleTabChange} />

      {/* 桌面：三区域 */}
      <div className="hidden flex-1 gap-4 lg:grid lg:grid-cols-[minmax(280px,1fr)_minmax(0,2fr)] lg:grid-rows-2">
        <div className="row-span-2 min-h-0">
          <FeedPanel />
        </div>
        <div className="min-h-0">
          <GanttPanel />
        </div>
        <div className="min-h-0">
          <CalendarPanel />
        </div>
      </div>

      {/* 移动：单 Tab */}
      <div className="flex-1 min-h-0 lg:hidden">
        {mobileTab === "feed" && <FeedPanel />}
        {mobileTab === "gantt" && <GanttPanel />}
        {mobileTab === "calendar" && <CalendarPanel />}
      </div>
    </div>
  );
}
