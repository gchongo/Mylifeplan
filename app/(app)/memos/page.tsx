import { EmptyState } from "@/components/ui/feedback";

export default function MemosPage() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-gray-900">备忘录</h1>
      <p className="mb-4 text-sm text-gray-500">无日期的任务与计划暂存于此，补充日期后自动回流。</p>
      <EmptyState title="备忘录为空" description="M2/M8 接入 Memo 自动分流与回流。" />
    </div>
  );
}
