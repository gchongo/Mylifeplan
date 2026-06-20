import { EmptyState } from "@/components/ui/feedback";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TasksPage() {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">任务列表</h1>
        <Link href="/tasks/new">
          <Button size="sm">新建任务</Button>
        </Link>
      </div>
      <EmptyState title="暂无任务" description="M4 接入任务 CRUD 与列表。" />
    </div>
  );
}
