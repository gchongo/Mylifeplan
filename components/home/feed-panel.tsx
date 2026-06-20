import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";

export function FeedPanel() {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>信息流 · 看动态</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        <EmptyState
          title="暂无动态"
          description="创建任务或计划后，最近操作会显示在这里。（M3 接入真实数据）"
        />
      </CardContent>
    </Card>
  );
}
