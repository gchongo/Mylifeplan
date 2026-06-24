import { AdminUserDetailPageClient } from "@/components/admin/admin-user-detail-page-client";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminUserDetailPageClient userId={id} />;
}
