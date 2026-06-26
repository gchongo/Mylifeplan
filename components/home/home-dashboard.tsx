"use client";

import { FixedHomeLayout } from "@/components/home/fixed-home-layout";

/** 桌面端多栏首页；移动端由 HomePageClient 重定向至 /feed */
export function HomeDashboard() {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <FixedHomeLayout />
    </div>
  );
}
