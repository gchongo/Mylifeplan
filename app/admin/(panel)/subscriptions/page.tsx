import { EmptyState } from "@/components/ui/feedback";

export default function AdminSubscriptionsPage() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">订阅管理</h1>
      <EmptyState title="订阅列表" description="M5 接入订阅状态手动维护。" />
    </div>
  );
}
