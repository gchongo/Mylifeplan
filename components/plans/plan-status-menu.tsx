"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { TaskStatusIndicator } from "@/components/tasks/task-status-indicator";
import { useI18n } from "@/components/i18n/i18n-provider";
import { localizeVisualStatusLabel } from "@/lib/i18n/gantt-helpers";
import { dispatchPlanUpdated } from "@/lib/plan-events";
import {
  kanbanCanMoveToUnscheduled,
  kanbanPatchForColumn,
  UNSCHEDULED_BLOCKED_HINT,
  type KanbanColumnId,
  type KanbanPlan,
} from "@/lib/kanban-board";
import { datetimeLocalToIso, normalizePlanDateInput } from "@/lib/dates";
import {
  STATUS_STYLES,
  type VisualStatusKey,
} from "@/lib/task-status-style";
import { computeFloatingMenuPosition } from "@/lib/floating-menu-position";
import type { PlanStatus } from "@/types";
import { cn } from "@/lib/utils";

type StatusMenuOption =
  | { kind: "unscheduled"; visual: "unscheduled" }
  | { kind: "status"; api: PlanStatus; visual: VisualStatusKey };

const PLAN_MENU_OPTIONS: StatusMenuOption[] = [
  { kind: "unscheduled", visual: "unscheduled" },
  { kind: "status", api: "not_started", visual: "todo" },
  { kind: "status", api: "in_progress", visual: "in_progress" },
  { kind: "status", api: "done", visual: "done" },
  { kind: "status", api: "archived", visual: "archived" },
];

const MENU_WIDTH = 144;
const ESTIMATED_MENU_ITEM_HEIGHT = 36;

export function PlanStatusMenuButton({
  planId,
  status,
  dueDate,
  startDate,
  endDate,
  overdue = false,
  isUnscheduled = false,
  contributionCount = 0,
  displayStatus,
  hasRollup = false,
  disabled = false,
  onStatusChanged,
}: {
  planId: string;
  status: string | undefined | null;
  dueDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  overdue?: boolean;
  isUnscheduled?: boolean;
  contributionCount?: number;
  displayStatus?: string | null;
  hasRollup?: boolean;
  disabled?: boolean;
  onStatusChanged?: (apiStatus: PlanStatus) => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const kanbanPlan: KanbanPlan = {
    id: planId,
    title: "",
    description: null,
    type: "goal",
    status: (status as PlanStatus) ?? "not_started",
    startDate: startDate ?? null,
    endDate: endDate ?? dueDate ?? null,
    parentPlanId: null,
    parentTitle: null,
    childStatuses: hasRollup ? ["not_started"] : [],
    contributionCount,
  };

  const canMoveToUnscheduled = kanbanCanMoveToUnscheduled(kanbanPlan);

  const updateMenuPos = useCallback(() => {
    const el = buttonRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const menuHeight =
      menuRef.current?.offsetHeight ??
      PLAN_MENU_OPTIONS.length * ESTIMATED_MENU_ITEM_HEIGHT + 8;
    setMenuPos(
      computeFloatingMenuPosition(rect, menuHeight, MENU_WIDTH, {
        gap: 4,
        viewportPadding: 8,
      }),
    );
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updateMenuPos();
    const frame = requestAnimationFrame(updateMenuPos);
    return () => cancelAnimationFrame(frame);
  }, [open, updateMenuPos]);

  useEffect(() => {
    if (!open) return;

    function onDocPointer(e: MouseEvent) {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    }

    function onScroll() {
      updateMenuPos();
    }

    document.addEventListener("mousedown", onDocPointer);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", updateMenuPos);
    return () => {
      document.removeEventListener("mousedown", onDocPointer);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", updateMenuPos);
    };
  }, [open, updateMenuPos]);

  function buildPatchBody(option: StatusMenuOption): Record<string, unknown> {
    if (option.kind === "unscheduled") {
      return kanbanPatchForColumn("unscheduled", kanbanPlan);
    }

    if (isUnscheduled && (option.api === "not_started" || option.api === "in_progress")) {
      const column: KanbanColumnId = option.api === "in_progress" ? "in_progress" : "not_started";
      return kanbanPatchForColumn(column, kanbanPlan);
    }

    if (isUnscheduled && option.api === "done") {
      return { status: "done" as PlanStatus };
    }

    return { status: option.api };
  }

  function isOptionActive(option: StatusMenuOption): boolean {
    if (option.kind === "unscheduled") return isUnscheduled;
    if (isUnscheduled) return false;
    return status === option.api;
  }

  async function selectOption(option: StatusMenuOption) {
    if (saving || disabled) return;
    if (option.kind === "unscheduled" && !canMoveToUnscheduled) {
      setMenuError(UNSCHEDULED_BLOCKED_HINT);
      return;
    }
    if (isOptionActive(option)) {
      setOpen(false);
      return;
    }

    setSaving(true);
    setMenuError(null);
    try {
      let body: Record<string, unknown>;
      try {
        body = buildPatchBody(option);
      } catch (e) {
        setMenuError(e instanceof Error ? e.message : UNSCHEDULED_BLOCKED_HINT);
        return;
      }

      if (body.startDate && typeof body.startDate === "string") {
        const normalized = normalizePlanDateInput(body.startDate, "start");
        body.startDate = normalized ? datetimeLocalToIso(normalized) : null;
      }

      const res = await fetch(`/api/plans/${planId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMenuError(typeof data.error === "string" ? data.error : t("common.updateFailed"));
        return;
      }

      const nextStatus = (data.plan?.status ?? body.status) as PlanStatus;
      dispatchPlanUpdated({ plan: data.plan });
      onStatusChanged?.(nextStatus);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  const menu =
    open && menuPos && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={menuRef}
            data-no-pan
            className="fixed z-[200] w-36 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900"
            style={{ top: menuPos.top, left: menuPos.left }}
          >
            {PLAN_MENU_OPTIONS.map((opt) => {
              const style = STATUS_STYLES[opt.visual];
              const active = isOptionActive(opt);
              const optionDisabled =
                saving || (opt.kind === "unscheduled" && !canMoveToUnscheduled);
              return (
                <button
                  key={opt.kind === "unscheduled" ? "unscheduled" : opt.api}
                  type="button"
                  data-no-pan
                  disabled={optionDisabled}
                  onClick={() => void selectOption(opt)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-gray-50 dark:hover:bg-gray-800",
                    active && "bg-gray-50 dark:bg-gray-800/80",
                    optionDisabled && "cursor-not-allowed opacity-50",
                    saving && "opacity-60",
                  )}
                  title={
                    opt.kind === "unscheduled" && !canMoveToUnscheduled
                      ? UNSCHEDULED_BLOCKED_HINT
                      : undefined
                  }
                >
                  <span className={cn("rounded-full ring-1 ring-inset ring-black/5", style.dot, "h-2 w-2 shrink-0")} />
                  <span className="text-gray-700 dark:text-gray-200">{localizeVisualStatusLabel(t, opt.visual)}</span>
                  {active && <span className="ml-auto text-[10px] text-brand-600">✓</span>}
                </button>
              );
            })}
            {menuError && (
              <p className="border-t border-gray-100 px-3 py-2 text-[10px] leading-snug text-red-600 dark:border-gray-800 dark:text-red-400">
                {menuError}
              </p>
            )}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        data-no-pan
        disabled={disabled || saving}
        onClick={(e) => {
          e.stopPropagation();
          setMenuError(null);
          setOpen((v) => !v);
        }}
        className={cn(
          "shrink-0 rounded-full p-0.5 hover:bg-black/5 dark:hover:bg-white/10",
          (disabled || saving) && "opacity-50",
        )}
        title={t("plansExt.switchStatus")}
        aria-label={t("plansExt.switchStatus")}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <TaskStatusIndicator
          status={status}
          dueDate={dueDate}
          overdue={overdue}
          isUnscheduled={isUnscheduled}
          displayStatus={displayStatus}
          hasRollup={hasRollup}
        />
      </button>
      {menu}
    </>
  );
}
