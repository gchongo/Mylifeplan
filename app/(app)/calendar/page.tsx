"use client";

import dynamic from "next/dynamic";
import { PanelSkeleton } from "@/components/ui/panel-skeleton";

const CalendarPageClient = dynamic(
  () => import("@/components/calendar/calendar-page-client").then((m) => m.CalendarPageClient),
  { loading: () => <PanelSkeleton className="h-[70vh] min-h-[24rem]" />, ssr: false },
);

export default function CalendarFullPage() {
  return <CalendarPageClient />;
}
