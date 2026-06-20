import { AdminSubscriptionsTable } from "@/components/admin/admin-subscriptions-table";

export default function AdminSubscriptionsPage() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">订阅管理</h1>
      <p className="mb-4 text-sm text-gray-500">手动维护套餐名称、有效期与支付状态。</p>
      <AdminSubscriptionsTable />
    </div>
  );
}
