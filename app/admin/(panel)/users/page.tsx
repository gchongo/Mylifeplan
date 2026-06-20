import { AdminUsersTable } from "@/components/admin/admin-users-table";

export default function AdminUsersPage() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">用户管理</h1>
      <p className="mb-4 text-sm text-gray-500">查看注册用户，启用或禁用账号。</p>
      <AdminUsersTable />
    </div>
  );
}
