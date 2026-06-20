import { EmptyState } from "@/components/ui/feedback";

export default function ShortPlansPage() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-gray-900">短期计划</h1>
      <p className="mb-4 text-sm text-gray-500">weekly / daily 计划</p>
      <EmptyState title="暂无短期计划" description="M4 接入周计划与日计划。" />
    </div>
  );
}
