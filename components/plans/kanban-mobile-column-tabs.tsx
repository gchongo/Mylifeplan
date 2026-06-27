"use client";

import { useI18n } from "@/components/i18n/i18n-provider";
import { KANBAN_COLUMNS, kanbanVisualForZone, type KanbanColumnId } from "@/lib/kanban-board";
import { getKanbanColumnAccentClass } from "@/lib/task-status-style";
import { cn } from "@/lib/utils";

export function KanbanMobileColumnTabs({
  activeColumnId,
  onChange,
  counts,
}: {
  activeColumnId: KanbanColumnId;
  onChange: (columnId: KanbanColumnId) => void;
  counts: Record<KanbanColumnId, number>;
}) {
  const { t } = useI18n();

  return (
    <div className="scrollbar-hide flex shrink-0 gap-1 overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-900">
      {KANBAN_COLUMNS.map((col) => {
        const active = activeColumnId === col.id;
        const accent = getKanbanColumnAccentClass(kanbanVisualForZone(col.id));
        return (
          <button
            key={col.id}
            type="button"
            onClick={() => onChange(col.id)}
            className={cn(
              "inline-flex min-w-[4.5rem] shrink-0 items-center justify-center gap-1.5 rounded-md px-2 py-2 text-[11px] font-medium leading-tight transition-colors",
              active
                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-gray-100"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200",
            )}
          >
            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", accent)} aria-hidden />
            <span>{t(`kanban.column.${col.id}`)}</span>
            <span className="text-[10px] text-gray-400">{counts[col.id] ?? 0}</span>
          </button>
        );
      })}
    </div>
  );
}
