"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import {
  GANTT_SCHEDULE_COLUMNS,
  type GanttScheduleColumnId,
} from "@/lib/gantt-schedule-columns";
import { localizeScheduleColumnLabel } from "@/lib/i18n/gantt-helpers";
import { cn } from "@/lib/utils";

export function GanttScheduleColumnPicker({
  visibleColumns,
  onChange,
  compact = false,
}: {
  visibleColumns: GanttScheduleColumnId[];
  onChange: (next: GanttScheduleColumnId[]) => void;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const partial =
    visibleColumns.length > 0 && visibleColumns.length < GANTT_SCHEDULE_COLUMNS.length;

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open]);

  function toggle(id: GanttScheduleColumnId) {
    const set = new Set(visibleColumns);
    if (set.has(id)) {
      if (set.size <= 1) return;
      set.delete(id);
    } else {
      set.add(id);
    }
    const ordered = GANTT_SCHEDULE_COLUMNS.map((c) => c.id).filter((cid) => set.has(cid));
    onChange(ordered);
  }

  function selectAll() {
    onChange(GANTT_SCHEDULE_COLUMNS.map((c) => c.id));
  }

  return (
    <div ref={ref} className="relative z-50 shrink-0">
      <button
        type="button"
        data-no-pan
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={cn(
          "flex items-center justify-center rounded-md border text-[10px] font-medium",
          compact ? "h-6 px-1.5" : "h-7 px-2 text-xs",
          partial
            ? "border-blue-400 bg-blue-100 text-blue-800 dark:border-blue-600 dark:bg-blue-900/50 dark:text-blue-100"
            : "border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300",
        )}
        title={t("gantt.columnPicker.title")}
        aria-label={t("gantt.columnPicker.aria")}
      >
        {t("gantt.columnPicker.label")}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-[100] mt-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
          {GANTT_SCHEDULE_COLUMNS.map((col) => {
            const checked = visibleColumns.includes(col.id);
            return (
              <button
                key={col.id}
                type="button"
                data-no-pan
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(col.id);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <span
                  className={cn(
                    "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border",
                    checked
                      ? "border-brand-500 bg-brand-500 text-white"
                      : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900",
                  )}
                >
                  {checked && <span className="text-[9px] leading-none">✓</span>}
                </span>
                <span className="text-gray-700 dark:text-gray-200">{localizeScheduleColumnLabel(t, col.id)}</span>
              </button>
            );
          })}
          <div className="mt-1 border-t border-gray-100 px-2 pt-1 dark:border-gray-800">
            <button
              type="button"
              data-no-pan
              onClick={(e) => {
                e.stopPropagation();
                selectAll();
              }}
              className="w-full rounded px-2 py-1 text-left text-xs text-brand-600 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {t("gantt.columnPicker.showAll")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
