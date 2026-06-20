import { centeredPageWidthClass } from "@/components/layout/centered-layout";
import { MemosList } from "@/components/memos/memos-list";
import { cn } from "@/lib/utils";

export default function MemosPage() {
  return (
    <div className={cn(centeredPageWidthClass)}>
      <h1 className="mb-4 text-xl font-semibold text-gray-900">备忘录</h1>
      <p className="mb-4 text-sm text-gray-500">
        无日期的任务与计划暂存于此，补充日期后自动回流。
      </p>
      <MemosList />
    </div>
  );
}
