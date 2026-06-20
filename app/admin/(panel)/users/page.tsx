import { EmptyState } from "@/components/ui/feedback";

export default function AdminUsersPage() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">用户管理</h1>
      <EmptyState title="用户列表" description="M5 接入用户列表、启用/禁用。" />
    </div>
  );
}
