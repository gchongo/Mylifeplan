import { FullPanelPage } from "@/components/home/full-panel-page";
import { CalendarPanelLive } from "@/components/home/calendar-panel-live";

export default function CalendarFullPage() {
  return (
    <FullPanelPage title="日历 · 看执行">
      <CalendarPanelLive fullPage />
    </FullPanelPage>
  );
}
