"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TaskStatusIndicator } from "@/components/tasks/task-status-indicator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanForm, type PlanFormValues } from "@/components/forms/plan-form";
import { TaskForm } from "@/components/forms/task-form";
import { shouldShowInMemo } from "@/lib/content-router";

interface SubPlan {
  id: string;
  title: string;
  type: string;
  status: string;
}

interface LinkedTask {
  id: string;
  title: string;
  status: string;
  startDate: string | null;
  dueDate: string | null;
}

export function PlanDetailClient({
  plan,
  subPlans,
  tasks,
  parentTitle,
}: {
  plan: PlanFormValues & { id: string };
  subPlans: SubPlan[];
  tasks: LinkedTask[];
  parentTitle?: string | null;
}) {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function archivePlan() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived" }),
      });
      if (res.ok) {
        router.push(plan.type === "goal" || plan.type === "phase" ? "/plans/long" : "/plans/short");
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  }

  async function handleDelete() {
    if (!confirm("确定删除此计划？")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/plans/${plan.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push(plan.type === "goal" || plan.type === "phase" ? "/plans/long" : "/plans/short");
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  }

  if (showEdit) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>编辑计划</CardTitle>
        </CardHeader>
        <CardContent>
          <PlanForm plan={plan} redirectTo={`/plans/${plan.id}`} />
          <Button className="mt-4" variant="ghost" size="sm" onClick={() => setShowEdit(false)}>
            取消编辑
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <div>
            <CardTitle className="text-xl">{plan.title}</CardTitle>
            {parentTitle && (
              <p className="mt-1 text-sm text-gray-500">父计划：{parentTitle}</p>
            )}
          </div>
          <Badge variant="info">{plan.type}</Badge>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-700">
          {plan.description && <p>{plan.description}</p>}
          <dl className="grid grid-cols-2 gap-2">
            <dt className="text-gray-500">开始</dt>
            <dd>{plan.startDate ?? "—"}</dd>
            <dt className="text-gray-500">结束</dt>
            <dd>{plan.endDate ?? "—"}</dd>
            <dt className="text-gray-500">状态</dt>
            <dd>{plan.status ?? "not_started"}</dd>
          </dl>
          <div className="flex flex-wrap gap-2">
            {plan.status !== "archived" && (
              <>
                <Button size="sm" variant="secondary" onClick={() => setShowEdit(true)}>
                  编辑计划
                </Button>
                <Button size="sm" onClick={() => setShowNewTask((v) => !v)}>
                  {showNewTask ? "收起新建任务" : "在此计划下新建任务"}
                </Button>
              </>
            )}
            {plan.status === "archived" ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={async () => {
                  await fetch(`/api/plans/${plan.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "not_started" }),
                  });
                  router.refresh();
                }}
              >
                取消归档
              </Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={archivePlan} disabled={deleting}>
                归档
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={handleDelete} disabled={deleting}>
              删除
            </Button>
          </div>
        </CardContent>
      </Card>

      {showNewTask && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">新建关联任务</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskForm defaultPlanId={plan.id} redirectTo={`/plans/${plan.id}`} />
          </CardContent>
        </Card>
      )}

      {subPlans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">子计划</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {subPlans.map((sp) => (
                <li key={sp.id}>
                  <Link
                    href={`/plans/${sp.id}`}
                    className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 hover:bg-gray-50"
                  >
                    <span>{sp.title}</span>
                    <Badge variant="info">{sp.type}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">关联任务</CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <p className="text-sm text-gray-500">暂无关联任务。</p>
          ) : (
            <ul className="space-y-2">
              {tasks.map((t) => {
                const inMemo = shouldShowInMemo({
                  startDate: t.startDate,
                  dueDate: t.dueDate,
                });
                return (
                  <li
                    key={t.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2"
                  >
                    <Link href={`/tasks/${t.id}`} className="hover:text-brand-600">
                      {t.title}
                    </Link>
                    <div className="flex gap-2">
                      {inMemo && <Badge variant="warning">备忘录</Badge>}
                      <TaskStatusIndicator status={t.status} dueDate={t.dueDate} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
