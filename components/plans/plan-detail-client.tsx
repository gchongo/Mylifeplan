"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TaskStatusIndicator } from "@/components/tasks/task-status-indicator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanForm, type PlanFormValues } from "@/components/forms/plan-form";
import { shouldShowInMemo } from "@/lib/content-router";
import { formatPlanDateTimeDisplay } from "@/lib/dates";

interface SubPlan {
  id: string;
  title: string;
  status: string;
}

export function PlanDetailClient({
  plan,
  subPlans,
  parentTitle,
}: {
  plan: PlanFormValues & { id: string };
  subPlans: SubPlan[];
  parentTitle?: string | null;
}) {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const [showNewSubPlan, setShowNewSubPlan] = useState(false);
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
        router.push("/plans");
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
        router.push("/plans");
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  }

  const inMemo = shouldShowInMemo({ startDate: plan.startDate, endDate: plan.endDate });

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
          <TaskStatusIndicator status={plan.status ?? "not_started"} dueDate={plan.endDate} />
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-700">
          {plan.description && <p>{plan.description}</p>}
          <dl className="grid grid-cols-2 gap-2">
            <dt className="text-gray-500">开始</dt>
            <dd>{formatPlanDateTimeDisplay(plan.startDate)}</dd>
            <dt className="text-gray-500">结束</dt>
            <dd>{formatPlanDateTimeDisplay(plan.endDate)}</dd>
            <dt className="text-gray-500">状态</dt>
            <dd>{plan.status ?? "not_started"}</dd>
          </dl>
          {inMemo && (
            <p className="text-xs text-amber-600">无日期时此计划会同步出现在备忘录中。</p>
          )}
          <div className="flex flex-wrap gap-2">
            {plan.status !== "archived" && (
              <>
                <Button size="sm" variant="secondary" onClick={() => setShowEdit(true)}>
                  编辑计划
                </Button>
                <Button size="sm" onClick={() => setShowNewSubPlan((v) => !v)}>
                  {showNewSubPlan ? "收起" : "新建子计划"}
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

      {showNewSubPlan && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">新建子计划</CardTitle>
          </CardHeader>
          <CardContent>
            <PlanForm
              defaultParentPlanId={plan.id}
              redirectTo={`/plans/${plan.id}`}
            />
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
                    <TaskStatusIndicator status={sp.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
