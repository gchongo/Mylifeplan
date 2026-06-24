"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  datetimeLocalToIso,
  formatPlanDateTimeCompact,
  formatPlanDateTimeDisplay,
  localDateStr,
  normalizePlanDateInput,
  nowDatetimeLocal,
  toDatetimeLocalInput,
  type PlanDateTimeEdge,
} from "@/lib/dates";
import { cn } from "@/lib/utils";

export function splitDatetimeLocal(value: string): { date: string; time: string } {
  if (!value.trim()) return { date: "", time: "" };
  const [date, time = ""] = value.split("T");
  return { date, time: time.slice(0, 5) };
}

export function joinDatetimeLocal(date: string, time: string): string {
  if (!date.trim()) return "";
  return `${date}T${time.trim() || "00:00"}`;
}

function defaultDraftValue(mode: "datetime" | "date"): string {
  return mode === "date" ? localDateStr() : nowDatetimeLocal();
}

function formatTriggerDisplay(
  value: string,
  mode: "datetime" | "date",
  edge: PlanDateTimeEdge,
  emptyLabel: string,
): string {
  if (!value.trim()) return emptyLabel;
  if (mode === "date") {
    const d = value.includes("T") ? value.slice(0, 10) : value;
    return d || emptyLabel;
  }
  const normalized = normalizePlanDateInput(value, edge);
  if (!normalized) return emptyLabel;
  const iso = datetimeLocalToIso(normalized);
  return iso ? formatPlanDateTimeCompact(iso) : formatPlanDateTimeDisplay(normalized);
}

function draftPreviewText(
  draft: string,
  mode: "datetime" | "date",
  edge: PlanDateTimeEdge,
): string {
  if (!draft.trim()) return "—";
  if (mode === "date") {
    return draft.includes("T") ? draft.slice(0, 10) : draft;
  }
  const normalized = normalizePlanDateInput(draft, edge);
  if (!normalized) return "—";
  const iso = datetimeLocalToIso(normalized);
  return iso ? formatPlanDateTimeCompact(iso) : normalized;
}

export type PlanDateTimeFieldProps = {
  value: string;
  /** 确认后回调；返回错误文案则保持弹窗打开 */
  onConfirm: (value: string) => void | Promise<string | undefined | null>;
  edge?: PlanDateTimeEdge;
  mode?: "datetime" | "date";
  trigger?: "click" | "doubleClick";
  label?: string;
  panelTitle?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  className?: string;
  triggerClassName?: string;
  size?: "md" | "sm" | "cell";
  /** 单元格模式：自定义触发内容（甘特时间列） */
  cellDisplay?: ReactNode;
  cellTitle?: string;
  cellAriaLabel?: string;
  style?: React.CSSProperties;
};

export function PlanDateTimeField({
  value,
  onConfirm,
  edge = "start",
  mode = "datetime",
  trigger = "click",
  label,
  panelTitle,
  placeholder = "点击选择",
  disabled = false,
  required = false,
  name,
  className,
  triggerClassName,
  size = "md",
  cellDisplay,
  cellTitle,
  cellAriaLabel,
  style,
}: PlanDateTimeFieldProps) {
  const popoverId = useId();
  const anchorRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [panelPos, setPanelPos] = useState<{ top: number; left: number } | null>(null);

  const title = panelTitle ?? label ?? "选择时间";
  const { date: draftDate, time: draftTime } =
    mode === "datetime" ? splitDatetimeLocal(draft) : { date: draft, time: "" };

  const updatePanelPos = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const panelWidth = 300;
    const left = Math.min(
      Math.max(8, rect.left + rect.width / 2 - panelWidth / 2),
      window.innerWidth - panelWidth - 8,
    );
    const top = Math.min(rect.bottom + 6, window.innerHeight - 280);
    setPanelPos({ top, left });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePanelPos();
  }, [open, updatePanelPos]);

  useEffect(() => {
    if (!open) return;
    function onScrollOrResize() {
      updatePanelPos();
    }
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);
    return () => {
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [open, updatePanelPos]);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (anchorRef.current?.contains(target)) return;
      const panel = document.getElementById(popoverId);
      if (panel?.contains(target)) return;
      setOpen(false);
      setError("");
    }
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [open, popoverId]);

  function openEditor() {
    if (disabled) return;
    const initial = value.trim()
      ? mode === "date"
        ? value.includes("T")
          ? value.slice(0, 10)
          : value
        : toDatetimeLocalInput(value) || value
      : defaultDraftValue(mode);
    setDraft(initial);
    setError("");
    setOpen(true);
  }

  function setDraftParts(date: string, time: string) {
    if (mode === "date") {
      setDraft(date);
      return;
    }
    setDraft(joinDatetimeLocal(date, time));
  }

  async function commit() {
    if (busy) return;
    const nextValue =
      mode === "date"
        ? draft.trim()
          ? draft.includes("T")
            ? draft.slice(0, 10)
            : draft.trim()
          : ""
        : draft.trim()
          ? normalizePlanDateInput(draft.trim(), edge) ?? draft.trim()
          : "";

    const prevComparable =
      mode === "date"
        ? (value.includes("T") ? value.slice(0, 10) : value.trim())
        : value.trim()
          ? normalizePlanDateInput(toDatetimeLocalInput(value) || value, edge) ?? value.trim()
          : "";

    const nextComparable =
      mode === "date"
        ? nextValue
        : nextValue
          ? normalizePlanDateInput(nextValue, edge) ?? nextValue
          : "";

    if (nextComparable === prevComparable || (!nextComparable && !prevComparable)) {
      setOpen(false);
      setError("");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const err = await onConfirm(nextValue);
      if (err) {
        setError(err);
        return;
      }
      setOpen(false);
    } catch {
      setError("操作失败");
    } finally {
      setBusy(false);
    }
  }

  function cancel() {
    if (busy) return;
    setOpen(false);
    setError("");
  }

  function clearDraft() {
    setDraft("");
    confirmRef.current?.focus();
  }

  function setToday() {
    setDraft(defaultDraftValue(mode));
    confirmRef.current?.focus();
  }

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

  const displayText = formatTriggerDisplay(value, mode, edge, placeholder);
  const preview = draftPreviewText(draft, mode, edge);

  const triggerHandlers =
    trigger === "doubleClick"
      ? { onDoubleClick: openEditor }
      : { onClick: openEditor };

  const panel =
    open && panelPos && typeof document !== "undefined"
      ? createPortal(
          <div
            id={popoverId}
            data-no-pan
            role="dialog"
            aria-label={title}
            className="fixed z-[300] w-[300px] rounded-lg border border-blue-200 bg-white shadow-xl dark:border-blue-800 dark:bg-gray-900"
            style={{ top: panelPos.top, left: panelPos.left }}
          >
            <div className="border-b border-blue-100 px-3 py-2 dark:border-blue-900/50">
              <p className="text-xs font-medium text-gray-800 dark:text-gray-100">{title}</p>
              <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                {mode === "date"
                  ? "选好日期后，点击下方「确认」"
                  : "选好日期和时间后，点击下方「确认」"}
              </p>
            </div>

            <div className="space-y-2 px-3 py-2">
              <div className={cn("grid gap-2", mode === "datetime" ? "grid-cols-2" : "grid-cols-1")}>
                <label className="block">
                  <span className="mb-1 block text-[10px] text-gray-500 dark:text-gray-400">日期</span>
                  <input
                    type="date"
                    data-no-pan
                    value={draftDate}
                    disabled={busy}
                    onChange={(e) => setDraftParts(e.target.value, draftTime)}
                    onKeyDown={onFieldKeyDown}
                    className="w-full rounded border border-gray-200 px-2 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-950"
                  />
                </label>
                {mode === "datetime" && (
                  <label className="block">
                    <span className="mb-1 block text-[10px] text-gray-500 dark:text-gray-400">时间</span>
                    <input
                      type="time"
                      data-no-pan
                      value={draftTime}
                      disabled={busy}
                      onChange={(e) => setDraftParts(draftDate, e.target.value)}
                      onKeyDown={onFieldKeyDown}
                      className="w-full rounded border border-gray-200 px-2 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-950"
                    />
                  </label>
                )}
              </div>

              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                将保存为：
                <span className="ml-1 font-medium text-gray-800 dark:text-gray-100">{preview}</span>
              </p>
              {error && <p className="text-[11px] text-red-600">{error}</p>}
            </div>

            <div className="grid grid-cols-4 gap-1.5 border-t border-blue-100 px-3 py-2.5 dark:border-blue-900/50">
              <button
                type="button"
                data-no-pan
                disabled={busy}
                onClick={clearDraft}
                className="rounded border border-gray-200 px-1 py-2 text-[11px] text-blue-600 hover:bg-blue-50 dark:border-gray-700 dark:text-blue-400 dark:hover:bg-blue-950/50"
              >
                清除
              </button>
              <button
                type="button"
                data-no-pan
                disabled={busy}
                onClick={setToday}
                className="rounded border border-gray-200 px-1 py-2 text-[11px] text-blue-600 hover:bg-blue-50 dark:border-gray-700 dark:text-blue-400 dark:hover:bg-blue-950/50"
              >
                今天
              </button>
              <button
                ref={confirmRef}
                type="button"
                data-no-pan
                disabled={busy}
                onClick={() => void commit()}
                className="rounded bg-blue-600 px-1 py-2 text-[11px] font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {busy ? "…" : "确认"}
              </button>
              <button
                type="button"
                data-no-pan
                disabled={busy}
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

  if (size === "cell") {
    return (
      <>
        <button
          ref={anchorRef}
          type="button"
          data-no-pan
          disabled={disabled || open}
          {...triggerHandlers}
          className={triggerClassName}
          style={style}
          title={cellTitle}
          aria-label={cellAriaLabel}
        >
          {cellDisplay}
        </button>
        {name && <input type="hidden" name={name} value={value} readOnly />}
        {panel}
      </>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </span>
      )}
      <button
        ref={anchorRef}
        type="button"
        data-no-pan
        disabled={disabled || open}
        {...triggerHandlers}
        className={cn(
          "w-full rounded-lg border border-gray-300 bg-white text-left tabular-nums text-gray-900",
          "hover:border-brand-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20",
          "disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100",
          size === "sm" ? "px-2 py-1 text-sm" : "px-3 py-2 text-sm",
          !value.trim() && "text-gray-400 dark:text-gray-500",
          triggerClassName,
        )}
        style={style}
      >
        {displayText}
      </button>
      {name && <input type="hidden" name={name} value={value} readOnly />}
      {panel}
    </div>
  );
}
