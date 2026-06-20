import { EmptyState } from "@/components/ui/feedback";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <EmptyState title={`用户 #${id}`} description="M5 接入用户详情。" />
  );
}
