import { GanttPanelLive } from "@/components/home/gantt-panel-live";

export default function GanttFullPage() {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-4 lg:px-6">
      <GanttPanelLive fullPage className="h-full min-h-0 flex-1" />
    </div>
  );
}
