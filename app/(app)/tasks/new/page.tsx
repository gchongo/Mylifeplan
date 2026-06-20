import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select, Textarea, Button } from "@/components/ui";

const priorityOptions = [
  { value: "high", label: "高" },
  { value: "medium", label: "中" },
  { value: "low", label: "低" },
];

export default function NewTaskPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-xl font-semibold text-gray-900">新建任务</h1>
      <Card>
        <CardHeader>
          <CardTitle>任务信息</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <Input label="标题" placeholder="任务标题（必填）" required disabled />
            <Textarea label="描述" placeholder="可选" rows={3} disabled />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="开始日期" type="date" disabled />
              <Input label="截止日期" type="date" disabled />
            </div>
            <Select label="优先级" options={priorityOptions} disabled />
            <p className="text-xs text-gray-500">
              无日期 → 备忘录；有 start → 日历 + 甘特图（虚拟截止）；有 start + due → 真实截止。
            </p>
            <Button disabled>保存（M4 接入）</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
