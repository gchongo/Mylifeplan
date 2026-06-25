"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { TaskStatusIndicator } from "@/components/tasks/task-status-indicator";
import { useI18n } from "@/components/i18n/i18n-provider";
import { localizeVisualStatusLabel } from "@/lib/i18n/gantt-helpers";
import { dispatchPlanUpdated } from "@/lib/plan-events";
import {
  STATUS_STYLES,
  type VisualStatusKey,
} from "@/lib/task-status-style";
import type { PlanStatus } from "@/types";
import { cn } from "@/lib/utils";

const PLAN_STATUS_OPTIONS: { api: PlanStatus; visual: VisualStatusKey }[] = [
  { api: "not_started", visual: "todo" },
  { api: "in_progress", visual: "in_progress" },
  { api: "done", visual: "done" },
  { api: "archived", visual: "archived" },
];

const MENU_WIDTH = 144;
const MENU_GAP = 4;
const VIEWPORT_PADDING = 8;
/** Rough row height before the menu mounts (py-2 + text-xs line). */
const ESTIMATED_MENU_ITEM_HEIGHT = 36;

export function PlanStatusMenuButton({
  planId,
  status,
  dueDate,
  overdue = false,
  isUnscheduled = false,
  displayStatus,
  hasRollup = false,
  disabled = false,
  onStatusChanged,
}: {
  planId: string;
  status: string | undefined | null;
  dueDate?: string | null;
  overdue?: boolean;
  isUnscheduled?: boolean;
  displayStatus?: string | null;
  hasRollup?: boolean;
  disabled?: boolean;
  onStatusChanged?: (apiStatus: PlanStatus) => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updateMenuPos = useCallback(() => {
    const el = buttonRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const menuHeight =
      menuRef.current?.offsetHeight ??
      PLAN_STATUS_OPTIONS.length * ESTIMATED_MENU_ITEM_HEIGHT + 8;
    const spaceBelow = window.innerHeight - rect.bottom - MENU_GAP - VIEWPORT_PADDING;
    const spaceAbove = rect.top - MENU_GAP - VIEWPORT_PADDING;
    const openUpward = menuHeight > spaceBelow && spaceAbove >= spaceBelow;
    const top = openUpward
      ? Math.max(VIEWPORT_PADDING, rect.top - menuHeight - MENU_GAP)
      : rect.bottom + MENU_GAP;
    setMenuPos({ top, left: Math.max(VIEWPORT_PADDING, rect.right - MENU_WIDTH) });
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

  async function selectStatus(apiStatus: PlanStatus) {
    if (saving || disabled) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/plans/${planId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: apiStatus }),
      });
      if (!res.ok) return;
      onStatusChanged?.(apiStatus);
      dispatchPlanUpdated();
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
            {PLAN_STATUS_OPTIONS.map((opt) => {
              const style = STATUS_STYLES[opt.visual];
              const active = status === opt.api;
              return (
                <button
                  key={opt.api}
                  type="button"
                  data-no-pan
                  disabled={saving}
                  onClick={() => void selectStatus(opt.api)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-gray-50 dark:hover:bg-gray-800",
                    active && "bg-gray-50 dark:bg-gray-800/80",
                    saving && "opacity-60",
                  )}
                >
                  <span className={cn("rounded-full ring-1 ring-inset ring-black/5", style.dot, "h-2 w-2 shrink-0")} />
                  <span className="text-gray-700 dark:text-gray-200">{localizeVisualStatusLabel(t, opt.visual)}</span>
                  {active && <span className="ml-auto text-[10px] text-brand-600">✓</span>}
                </button>
              );
            })}
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
