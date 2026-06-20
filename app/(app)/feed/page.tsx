import { FullPanelPage } from "@/components/home/full-panel-page";
import { FeedPanelLive } from "@/components/home/feed-panel-live";

export default function FeedFullPage() {
  return (
    <FullPanelPage title="信息流 · 看动态">
      <FeedPanelLive fullPage />
    </FullPanelPage>
  );
}
