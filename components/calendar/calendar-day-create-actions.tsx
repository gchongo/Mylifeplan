"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ContributionFormModal } from "@/components/gantt/contribution-form-modal";
import { PlanFormModal } from "@/components/gantt/plan-form-modal";
import type { CalendarItem } from "@/types";

function dateToDefaultStart(dateStr: string) {
  return `${dateStr}T09:00`;
}

export function CalendarDayCreateActions({
  dateStr,
  dayItems,
  onSuccess,
}: {
  dateStr: string;
  dayItems: CalendarItem[];
  onSuccess: () => void;
}) {
  const [planId, setPlanId] = useState("");
  const [planOptions, setPlanOptions] = useState<{ id: string; title: string }[]>([]);
  const [contributionOpen, setContributionOpen] = useState(false);
  const [subPlanOpen, setSubPlanOpen] = useState(false);

  useEffect(() => {
    if (dayItems.length > 0) {
      setPlanOptions(dayItems.map((i) => ({ id: i.id, title: i.title })));
      setPlanId(dayItems[0]!.id);
      return;
    }

    let cancelled = false;
    fetch("/api/plans")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const plans = (data.plans ?? []) as { id: string; title: string }[];
        setPlanOptions(plans);
        setPlanId(plans[0]?.id ?? "");
      })
      .catch(() => {
        if (!cancelled) {
          setPlanOptions([]);
          setPlanId("");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [dayItems, dateStr]);

  if (planOptions.length === 0) {
    return (
      <p className="border-t border-gray-100 px-4 py-3 text-xs text-gray-400">
        暂无关联计划，请先在信息流创建计划。
      </p>
    );
  }

  return (
    <>
      <div className="space-y-2 border-t border-gray-100 px-4 py-3">
        <label className="block text-xs font-medium text-gray-500">关联计划</label>
        <select
          value={planId}
          onChange={(e) => setPlanId(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          {planOptions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={!planId}
            onClick={() => setContributionOpen(true)}
          >
            添加贡献
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={!planId}
            onClick={() => setSubPlanOpen(true)}
          >
            添加子计划
          </Button>
        </div>
      </div>

      {planId && (
        <>
          <ContributionFormModal
            open={contributionOpen}
            onClose={() => setContributionOpen(false)}
            planId={planId}
            occurredOn={dateStr}
            onSuccess={onSuccess}
          />
          <PlanFormModal
            open={subPlanOpen}
            onClose={() => setSubPlanOpen(false)}
            title="添加子计划"
            defaultParentPlanId={planId}
            defaultStartDate={dateToDefaultStart(dateStr)}
            onSuccess={onSuccess}
          />
        </>
      )}
    </>
  );
}
