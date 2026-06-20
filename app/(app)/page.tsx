import { HomeDashboard } from "@/components/home/home-dashboard";
import { Suspense } from "react";
import { Loading } from "@/components/ui/feedback";

export default function HomePage() {
  return (
    <Suspense fallback={<Loading label="加载首页…" />}>
      <HomeDashboard />
    </Suspense>
  );
}
