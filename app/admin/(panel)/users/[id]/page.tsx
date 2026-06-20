import Link from "next/link";
import { AdminUserDetail } from "@/components/admin/admin-user-detail";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div>
      <Link href="/admin/users" className="text-sm text-brand-600 hover:underline">
        ← 返回用户列表
      </Link>
      <h1 className="mb-4 mt-2 text-xl font-semibold">用户详情</h1>
      <AdminUserDetail userId={id} />
    </div>
  );
}
