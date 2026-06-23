import { FullPanelPage } from "@/components/home/full-panel-page";
import { SummaryDashboard } from "@/components/summary/summary-dashboard";

export default function SummaryPage() {
  return (
    <FullPanelPage title="总结 · 看全局">
      <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overscroll-contain py-1">
        <SummaryDashboard />
      </div>
    </FullPanelPage>
  );
}
