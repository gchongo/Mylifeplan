"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  scheduleColumnPlanField,
  type GanttScheduleEditableColumnId,
} from "@/lib/gantt-schedule-columns";
import { normalizePlanDateInput, toDatetimeLocalInput, type PlanDateTimeEdge } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { ScheduleCellValue } from "@/lib/gantt-schedule-columns";

function scheduleFieldEdge(
  field: ReturnType<typeof scheduleColumnPlanField>,
): PlanDateTimeEdge {
  return field === "endDate" || field === "actualEndDate" ? "end" : "start";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editingRef = useRef(false);
  const savingRef = useRef(false);
  const outsideCommitTimerRef = useRef<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  editingRef.current = editing;
  savingRef.current = saving;

  useEffect(() => {
    if (!editing) return;
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    try {
      input.showPicker?.();
    } catch {
      // showPicker may require a user gesture; focus is enough
    }
  }, [editing]);

  function scheduleCommitOnBlur(relatedTarget: EventTarget | null) {
    if (relatedTarget && containerRef.current?.contains(relatedTarget as Node)) return;
    scheduleOutsideCommit();
  }

  function scheduleOutsideCommit() {
    if (outsideCommitTimerRef.current != null) {
      window.clearTimeout(outsideCommitTimerRef.current);
    }
    outsideCommitTimerRef.current = window.setTimeout(() => {
      outsideCommitTimerRef.current = null;
      if (savingRef.current || !editingRef.current) return;
      if (containerRef.current?.contains(document.activeElement)) return;
      void commit();
    }, 150);
  }

  useEffect(() => {
    if (!editing) {
      if (outsideCommitTimerRef.current != null) {
        window.clearTimeout(outsideCommitTimerRef.current);
        outsideCommitTimerRef.current = null;
      }
      return;
    }

    function onPointerDown(event: PointerEvent) {
      const root = containerRef.current;
      if (!root || root.contains(event.target as Node)) return;
      if (savingRef.current) return;
      scheduleOutsideCommit();
    }

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [editing]);

  function openEditor() {
    setDraft(toDatetimeLocalInput(rawValue));
    setError("");
    setEditing(true);
  }

  async function commit() {
    if (saving) return;
    const field = scheduleColumnPlanField(columnId);
    const edge = scheduleFieldEdge(field);
    const normalizedDraft = draft.trim() ? normalizePlanDateInput(draft, edge) : null;
    const nextIso = normalizedDraft ? new Date(normalizedDraft).toISOString() : null;
    const prevNormalized = rawValue?.trim()
      ? normalizePlanDateInput(toDatetimeLocalInput(rawValue), edge)
      : null;
    const prevIso = prevNormalized ? new Date(prevNormalized).toISOString() : null;
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
        body: JSON.stringify({ [field]: normalizedDraft }),
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
    if (outsideCommitTimerRef.current != null) {
      window.clearTimeout(outsideCommitTimerRef.current);
      outsideCommitTimerRef.current = null;
    }
    setEditing(false);
    setError("");
  }

  const label =
    cell.text === "—" ? "双击设置时间，点击外部保存" : `双击修改：${cell.text}，点击外部保存`;

  return (
    <div
      ref={containerRef}
      className="relative flex h-full shrink-0 items-center justify-center"
      style={{ width }}
    >
      <button
        type="button"
        data-no-pan
        disabled={editing}
        onDoubleClick={openEditor}
        className={cn(
          "flex h-full w-full items-center justify-center border-l border-blue-100/80 px-0.5 text-center text-[10px] tabular-nums leading-tight transition-colors dark:border-blue-900/35",
          "cursor-pointer hover:bg-blue-100/70 dark:hover:bg-blue-900/35",
          cell.muted && "text-gray-400",
          cell.virtual && "italic text-gray-500",
          cell.highlight && "bg-amber-50 font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
          !cell.muted && !cell.virtual && !cell.highlight && "text-gray-600 dark:text-gray-300",
          editing && "invisible",
        )}
        title={cell.virtual ? `${cell.text}（预估截止，双击设置正式截止）` : label}
        aria-label={label}
      >
        {cell.text}
      </button>

      {editing && (
        <div
          className="absolute left-1/2 top-full z-[80] mt-0.5 w-max max-w-[min(16rem,calc(100vw-2rem))] -translate-x-1/2 rounded-md border border-blue-200 bg-white p-2 shadow-lg dark:border-blue-800 dark:bg-gray-900"
          data-no-pan
          role="dialog"
          aria-labelledby={popoverId}
        >
          <p id={popoverId} className="mb-1 text-[10px] font-medium text-gray-500 dark:text-gray-400">
            {columnId === "planStart" && "计划开始"}
            {columnId === "planEnd" && "计划结束"}
            {columnId === "actualStart" && "实际开始"}
            {columnId === "actualEnd" && "实际结束"}
          </p>
          <input
            ref={inputRef}
            type="datetime-local"
            data-no-pan
            value={draft}
            disabled={saving}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={(e) => scheduleCommitOnBlur(e.relatedTarget)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void commit();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                cancel();
              }
            }}
            className="w-full rounded border border-gray-200 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-950"
          />
          {error && <p className="mt-1 text-[10px] text-red-600">{error}</p>}
          <div className="mt-2 flex justify-end gap-1">
            <button
              type="button"
              data-no-pan
              disabled={saving}
              onClick={cancel}
              className="rounded px-2 py-0.5 text-[10px] text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              取消
            </button>
            <button
              type="button"
              data-no-pan
              disabled={saving}
              onClick={() => void commit()}
              className="rounded bg-blue-600 px-2 py-0.5 text-[10px] text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "保存中…" : "保存"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
