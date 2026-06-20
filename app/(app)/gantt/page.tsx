import { FullPanelPage } from "@/components/home/full-panel-page";
import { GanttPanelLive } from "@/components/home/gantt-panel-live";

export default function GanttFullPage() {
  return (
    <FullPanelPage title="甘特图 · 看全局">
      <GanttPanelLive fullPage />
    </FullPanelPage>
  );
}
