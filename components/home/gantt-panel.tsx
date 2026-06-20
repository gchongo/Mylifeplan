import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";

export function GanttPanel() {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>甘特图 · 看全局</CardTitle>
        <Badge variant="info">预估截止 · 虚线</Badge>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        <EmptyState
          title="甘特图待接入"
          description="有开始日期的任务/计划将在此展示时间条；无确定截止时使用 max(start+365, today) 虚拟截止。（M3）"
        />
        <div className="mt-4 rounded-lg border border-dashed border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
          示例：虚拟截止条将以虚线 +「预估截止」标签区分
        </div>
      </CardContent>
    </Card>
  );
}
