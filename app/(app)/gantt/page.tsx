import { GanttPanelLive } from "@/components/home/gantt-panel-live";

export default function GanttFullPage() {
  return (
    <div className="flex h-[calc(100vh-5.5rem)] min-w-0 max-w-full flex-col overflow-hidden px-4 lg:px-6">
      <GanttPanelLive fullPage className="h-full min-h-0 flex-1" />
    </div>
  );
}
