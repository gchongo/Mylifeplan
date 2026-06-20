import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskForm } from "@/components/forms/task-form";

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ parentTaskId?: string; redirect?: string }>;
}) {
  const params = await searchParams;
  const redirectTo = params.redirect === "/gantt" ? "/gantt" : "/tasks";
  const backHref = params.redirect === "/gantt" ? "/gantt" : "/tasks";

  return (
    <div className="mx-auto max-w-2xl">
      <Link href={backHref} className="text-sm text-brand-600 hover:underline">
        ← 返回{params.redirect === "/gantt" ? "甘特图" : "任务列表"}
      </Link>
      <h1 className="mb-4 mt-2 text-xl font-semibold text-gray-900">
        {params.parentTaskId ? "新建子任务" : "新建任务"}
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>任务信息</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskForm
            defaultParentTaskId={params.parentTaskId ?? null}
            redirectTo={redirectTo}
          />
        </CardContent>
      </Card>
    </div>
  );
}
