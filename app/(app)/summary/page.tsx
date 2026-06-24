import dynamic from "next/dynamic";
import { PanelSkeleton } from "@/components/ui/panel-skeleton";

const SummaryPageClient = dynamic(
  () => import("@/components/summary/summary-page-client").then((m) => m.SummaryPageClient),
  { loading: () => <PanelSkeleton className="h-[70vh] min-h-[20rem]" />, ssr: false },
);

export default function SummaryPage() {
  return <SummaryPageClient />;
}
