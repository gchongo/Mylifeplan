import { EmptyState } from "@/components/ui/feedback";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <EmptyState
      title={`任务详情 #${id}`}
      description="M4 接入任务详情、编辑与状态流转。"
    />
  );
}
