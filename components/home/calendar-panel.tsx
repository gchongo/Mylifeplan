import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";

export function CalendarPanel() {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>日历 · 看执行</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        <EmptyState
          title="日历待接入"
          description="有开始日期的任务/计划将按月/周/日视图展示。（M3）"
        />
      </CardContent>
    </Card>
  );
}
