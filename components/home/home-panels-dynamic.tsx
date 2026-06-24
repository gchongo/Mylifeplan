"use client";

import dynamic from "next/dynamic";
import { PanelSkeleton } from "@/components/ui/panel-skeleton";

export const CalendarPanelLive = dynamic(
  () => import("@/components/home/calendar-panel-live").then((m) => m.CalendarPanelLive),
  { loading: () => <PanelSkeleton className="h-full min-h-[280px]" />, ssr: false },
);

export const SummaryPanelLive = dynamic(
  () => import("@/components/home/summary-panel-live").then((m) => m.SummaryPanelLive),
  { loading: () => <PanelSkeleton className="min-h-[8rem]" />, ssr: false },
);

export const FeedPanelLive = dynamic(
  () => import("@/components/home/feed-panel-live").then((m) => m.FeedPanelLive),
  { loading: () => <PanelSkeleton className="h-full min-h-[320px]" />, ssr: false },
);
