import { EmptyState } from "@/components/ui/feedback";

export default function LongPlansPage() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-gray-900">长期规划</h1>
      <p className="mb-4 text-sm text-gray-500">goal → phase → 关联任务</p>
      <EmptyState title="暂无长期目标" description="M4 接入 goal / phase 层级树。" />
    </div>
  );
}
