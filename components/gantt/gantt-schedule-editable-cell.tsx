"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  scheduleColumnPlanField,
  type GanttScheduleEditableColumnId,
} from "@/lib/gantt-schedule-columns";
import {
  datetimeLocalToIso,
  formatPlanDateTimeCompact,
  normalizePlanDateInput,
  nowDatetimeLocal,
  toDatetimeLocalInput,
  type PlanDateTimeEdge,
} from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { ScheduleCellValue } from "@/lib/gantt-schedule-columns";

function scheduleFieldEdge(
  field: ReturnType<typeof scheduleColumnPlanField>,
): PlanDateTimeEdge {
  return field === "endDate" || field === "actualEndDate" ? "end" : "start";
}

function splitDatetimeLocal(value: string): { date: string; time: string } {
  if (!value.trim()) return { date: "", time: "" };
  const [date, time = ""] = value.split("T");
  return { date, time: time.slice(0, 5) };
}

function joinDatetimeLocal(date: string, time: string): string {
  if (!date.trim()) return "";
  return `${date}T${time.trim() || "00:00"}`;
}

export function GanttScheduleEditableCell({
  columnId,
  planId,
  rawValue,
  cell,
  width,
  onSaved,
}: {
  columnId: GanttScheduleEditableColumnId;
  planId: string;
  rawValue: string | null;
  cell: ScheduleCellValue;
  width: number;
  onSaved: () => void;
}) {
  const popoverId = useId();
  const anchorRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [panelPos, setPanelPos] = useState<{ top: number; left: number } | null>(null);

  const edge = scheduleFieldEdge(scheduleColumnPlanField(columnId));
  const { date: draftDate, time: draftTime } = splitDatetimeLocal(draft);

  const updatePanelPos = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const panelWidth = 300;
    const left = Math.min(
      Math.max(8, rect.left + rect.width / 2 - panelWidth / 2),
      window.innerWidth - panelWidth - 8,
    );
    const top = Math.min(rect.bottom + 6, window.innerHeight - 260);
    setPanelPos({ top, left });
  }, []);

  useLayoutEffect(() => {
    if (!editing) return;
    updatePanelPos();
  }, [editing, updatePanelPos]);

  useEffect(() => {
    if (!editing) return;

    function onScrollOrResize() {
      updatePanelPos();
    }

    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);
    return () => {
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [editing, updatePanelPos]);

  useEffect(() => {
    if (!editing) return;
    confirmRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    if (!editing) return;

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (anchorRef.current?.contains(target)) return;
      const panel = document.getElementById(popoverId);
      if (panel?.contains(target)) return;
      setEditing(false);
      setError("");
    }

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [editing, popoverId]);

  function openEditor() {
    const initial = rawValue?.trim()
      ? toDatetimeLocalInput(rawValue)
      : nowDatetimeLocal();
    setDraft(initial);
    setError("");
    setEditing(true);
  }

  function setDraftParts(date: string, time: string) {
    setDraft(joinDatetimeLocal(date, time));
  }

  async function commit() {
    if (saving) return;
    const field = scheduleColumnPlanField(columnId);
    const normalizedDraft = draft.trim() ? normalizePlanDateInput(draft, edge) : null;
    const nextIso = normalizedDraft ? datetimeLocalToIso(normalizedDraft) : null;
    const prevIso = rawValue?.trim() ? datetimeLocalToIso(toDatetimeLocalInput(rawValue)) : null;
    if (nextIso === prevIso || (!nextIso && !prevIso)) {
      setEditing(false);
      return;
    }

    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/plans/${planId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: nextIso }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "保存失败");
        return;
      }
      setEditing(false);
      onSaved();
    } catch {
      setError("网络错误");
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    if (saving) return;
    setEditing(false);
    setError("");
  }

  function clearDraft() {
    setDraft("");
    confirmRef.current?.focus();
  }

  function setToday() {
    setDraft(nowDatetimeLocal());
    confirmRef.current?.focus();
  }

  const label =
    cell.text === "—" ? "双击设置时间" : `双击修改：${cell.text}`;

  const columnTitle =
    columnId === "planStart"
      ? "计划开始"
      : columnId === "planEnd"
        ? "计划结束"
        : columnId === "actualStart"
          ? "实际开始"
          : "实际结束";

  const normalizedDraft = draft.trim() ? normalizePlanDateInput(draft, edge) : null;
  const draftPreview = normalizedDraft
    ? formatPlanDateTimeCompact(datetimeLocalToIso(normalizedDraft) ?? normalizedDraft)
    : "—";

  function onFieldKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      void commit();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  }

  const panel =
    editing && panelPos && typeof document !== "undefined"
      ? createPortal(
          <div
            id={popoverId}
            data-no-pan
            role="dialog"
            aria-label={`${columnTitle}时间`}
            className="fixed z-[300] w-[300px] rounded-lg border border-blue-200 bg-white shadow-xl dark:border-blue-800 dark:bg-gray-900"
            style={{ top: panelPos.top, left: panelPos.left }}
          >
            <div className="border-b border-blue-100 px-3 py-2 dark:border-blue-900/50">
              <p className="text-xs font-medium text-gray-800 dark:text-gray-100">{columnTitle}</p>
              <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                选好日期和时间后，点击下方「确认」保存
              </p>
            </div>

            <div className="space-y-2 px-3 py-2">
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="mb-1 block text-[10px] text-gray-500 dark:text-gray-400">日期</span>
                  <input
                    type="date"
                    data-no-pan
                    value={draftDate}
                    disabled={saving}
                    onChange={(e) => setDraftParts(e.target.value, draftTime)}
                    onKeyDown={onFieldKeyDown}
                    className="w-full rounded border border-gray-200 px-2 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-950"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[10px] text-gray-500 dark:text-gray-400">时间</span>
                  <input
                    type="time"
                    data-no-pan
                    value={draftTime}
                    disabled={saving}
                    onChange={(e) => setDraftParts(draftDate, e.target.value)}
                    onKeyDown={onFieldKeyDown}
                    className="w-full rounded border border-gray-200 px-2 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-950"
                  />
                </label>
              </div>

              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                将保存为：
                <span className="ml-1 font-medium text-gray-800 dark:text-gray-100">{draftPreview}</span>
              </p>
              {error && <p className="text-[11px] text-red-600">{error}</p>}
            </div>

            <div className="grid grid-cols-4 gap-1.5 border-t border-blue-100 px-3 py-2.5 dark:border-blue-900/50">
              <button
                type="button"
                data-no-pan
                disabled={saving}
                onClick={clearDraft}
                className="rounded border border-gray-200 px-1 py-2 text-[11px] text-blue-600 hover:bg-blue-50 dark:border-gray-700 dark:text-blue-400 dark:hover:bg-blue-950/50"
              >
                清除
              </button>
              <button
                type="button"
                data-no-pan
                disabled={saving}
                onClick={setToday}
                className="rounded border border-gray-200 px-1 py-2 text-[11px] text-blue-600 hover:bg-blue-50 dark:border-gray-700 dark:text-blue-400 dark:hover:bg-blue-950/50"
              >
                今天
              </button>
              <button
                ref={confirmRef}
                type="button"
                data-no-pan
                disabled={saving}
                onClick={() => void commit()}
                className="rounded bg-blue-600 px-1 py-2 text-[11px] font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "…" : "确认"}
              </button>
              <button
                type="button"
                data-no-pan
                disabled={saving}
                onClick={cancel}
                className="rounded border border-gray-200 px-1 py-2 text-[11px] text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                取消
              </button>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        data-no-pan
        disabled={editing}
        onDoubleClick={openEditor}
        className={cn(
          "relative flex h-full w-full shrink-0 items-center justify-center border-l border-blue-100/80 px-0.5 text-center text-[10px] tabular-nums leading-tight transition-colors dark:border-blue-900/35",
          "cursor-pointer hover:bg-blue-100/70 dark:hover:bg-blue-900/35",
          cell.muted && "text-gray-400",
          cell.virtual && "italic text-gray-500",
          cell.highlight && "bg-amber-50 font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
          !cell.muted && !cell.virtual && !cell.highlight && "text-gray-600 dark:text-gray-300",
        )}
        style={{ width }}
        title={cell.virtual ? `${cell.text}（预估截止，双击设置正式截止）` : label}
        aria-label={label}
      >
        {cell.text}
      </button>
      {panel}
    </>
  );
}
