import dynamic from "next/dynamic";
import { PanelSkeleton } from "@/components/ui/panel-skeleton";

const FeedPageClient = dynamic(
  () => import("@/components/feed/feed-page-client").then((m) => m.FeedPageClient),
  { loading: () => <PanelSkeleton className="h-[70vh] min-h-[24rem]" />, ssr: false },
);

export default function FeedFullPage() {
  return <FeedPageClient />;
}
