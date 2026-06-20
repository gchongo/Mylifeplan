import { FullPanelPage } from "@/components/home/full-panel-page";
import { CalendarPanelLive } from "@/components/home/calendar-panel-live";

export default function CalendarFullPage() {
  return (
    <FullPanelPage title="日历 · 看执行">
      <CalendarPanelLive fullPage className="min-h-0 flex-1" />
    </FullPanelPage>
  );
}
