import { FullPanelPage } from "@/components/home/full-panel-page";
import { SummaryDashboard } from "@/components/summary/summary-dashboard";

export default function SummaryPage() {
  return (
    <FullPanelPage title="总结">
      <SummaryDashboard className="min-h-0 flex-1" />
    </FullPanelPage>
  );
}
