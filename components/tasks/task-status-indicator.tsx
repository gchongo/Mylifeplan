"use client";

import { useI18n } from "@/components/i18n/i18n-provider";
import { localizeVisualStatusLabel } from "@/lib/i18n/gantt-helpers";
import {
  getStatusStyle,
  resolveVisualStatus,
  STATUS_LEGEND,
  statusLabel,
  type VisualStatusKey,
} from "@/lib/task-status-style";
import { cn } from "@/lib/utils";

const DOT_SIZE = {
  xs: "h-2 w-2",
  sm: "h-2.5 w-2.5",
  md: "h-3 w-3",
} as const;

export function TaskStatusIndicator({
  status,
  dueDate,
  displayStatus,
  overdue = false,
  hasRollup = false,
  size = "sm",
  showLabel = false,
  className,
}: {
  status: string | undefined | null;
  dueDate?: string | null;
  displayStatus?: string | null;
  overdue?: boolean;
  hasRollup?: boolean;
  size?: keyof typeof DOT_SIZE;
  showLabel?: boolean;
  className?: string;
}) {
  const visual = resolveVisualStatus(status, dueDate, displayStatus, overdue);
  const style = getStatusStyle(status, dueDate, displayStatus, overdue);
  const label = statusLabel(status, dueDate, displayStatus, hasRollup, overdue);

  if (showLabel) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
          pillClass(visual),
          className,
        )}
        title={label}
      >
        <span className={cn("shrink-0 rounded-full ring-2 ring-inset ring-white/40", style.dot, DOT_SIZE[size])} />
        <span>{label}</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-block shrink-0 rounded-full ring-2 ring-inset ring-white/50",
        style.dot,
        DOT_SIZE[size],
        className,
      )}
      title={label}
      aria-label={label}
    />
  );
}

function pillClass(visual: VisualStatusKey): string {
  switch (visual) {
    case "todo":
      return "bg-amber-50 text-amber-800";
    case "in_progress":
      return "bg-blue-50 text-blue-800";
    case "done":
      return "bg-emerald-50 text-emerald-800";
    case "overdue":
      return "bg-red-50 text-red-800";
    case "archived":
      return "bg-gray-100 text-gray-600";
    case "unscheduled":
      return "bg-violet-50 text-violet-800";
  }
}

export function StatusLegend({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600",
        compact && "gap-x-2",
      )}
      aria-label={t("gantt.statusLegend")}
    >
      {STATUS_LEGEND.map((key) => {
        const style = getStatusStyle(key === "todo" ? "not_started" : key, null);
        return (
          <span key={key} className="inline-flex items-center gap-1">
            <span
              className={cn("rounded-full ring-1 ring-inset ring-black/5", style.dot, "h-2 w-2")}
            />
            {!compact && <span>{localizeVisualStatusLabel(t, key)}</span>}
          </span>
        );
      })}
    </div>
  );
}
