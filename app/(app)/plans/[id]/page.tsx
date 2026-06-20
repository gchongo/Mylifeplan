import { EmptyState } from "@/components/ui/feedback";

export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <EmptyState title={`计划详情 #${id}`} description="M4 接入计划详情与子计划/任务。" />
  );
}
