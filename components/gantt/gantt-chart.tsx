"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, Loading } from "@/components/ui/feedback";
import type { GanttItem } from "@/types";
import { cn } from "@/lib/utils";

const DAY_WIDTH = 32;
const ROW_HEIGHT = 44;
const LABEL_WIDTH = 200;

const STATUS_LABEL: Record<string, string> = {
  todo: "待办",
  in_progress: "执行",
  done: "完成",
  not_started: "规划",
  archived: "归档",
};

type RowKind = "item" | "add-child";

interface GanttRow {
  kind: RowKind;
  item?: GanttItem;
  depth: number;
  parentTaskId?: string;
}

function parseUtcDate(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function addDaysUtc(base: string, days: number) {
  const dt = new Date(parseUtcDate(base));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string) {
  return Math.round((parseUtcDate(to) - parseUtcDate(from)) / 86400000);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function defaultTimelineRange() {
  const today = todayStr();
  return { from: addDaysUtc(today, -45), to: addDaysUtc(today, 75) };
}

function buildDayList(from: string, to: string) {
  const days: string[] = [];
  let cur = from;
  while (cur <= to) {
    days.push(cur);
    cur = addDaysUtc(cur, 1);
  }
  return days;
}

function monthSpans(days: string[]) {
  const spans: { label: string; count: number }[] = [];
  for (const d of days) {
    const dt = new Date(parseUtcDate(d));
    const label = `${dt.getUTCFullYear()}年${dt.getUTCMonth() + 1}月`;
    const last = spans[spans.length - 1];
    if (last?.label === label) last.count++;
    else spans.push({ label, count: 1 });
  }
  return spans;
}

function taskDepth(itemId: string, byId: Map<string, GanttItem>): number {
  let depth = 0;
  let cur = byId.get(itemId);
  while (cur?.parentId && byId.has(cur.parentId)) {
    depth++;
    cur = byId.get(cur.parentId);
  }
  return depth;
}

function buildTaskTreeRows(tasks: GanttItem[], expanded: Set<string>): GanttRow[] {
  const taskIds = new Set(tasks.map((t) => t.id));
  const byParent = new Map<string | null, GanttItem[]>();
  const byId = new Map(tasks.map((t) => [t.id, t]));

  for (const t of tasks) {
    const key = t.parentId && taskIds.has(t.parentId) ? t.parentId : null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(t);
  }

  for (const list of byParent.values()) {
    list.sort((a, b) => a.startDate.localeCompare(b.startDate));
  }

  const rows: GanttRow[] = [];

  function walk(parentId: string | null, depth: number) {
    for (const item of byParent.get(parentId) ?? []) {
      rows.push({ kind: "item", item, depth });
      const childCount = byParent.get(item.id)?.length ?? 0;
      const canHaveChildren = taskDepth(item.id, byId) < 2;

      if (expanded.has(item.id)) {
        if (childCount > 0) walk(item.id, depth + 1);
        else if (canHaveChildren) {
          rows.push({ kind: "add-child", depth: depth + 1, parentTaskId: item.id });
        }
      }
    }
  }

  walk(null, 0);
  return rows;
}

function itemHref(item: GanttItem) {
  return item.type === "task" ? `/tasks/${item.id}` : `/plans/${item.id}`;
}

export function GanttChart({ compact = false }: { compact?: boolean }) {
  const { from, to } = defaultTimelineRange();
  const [items, setItems] = useState<GanttItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrolledToToday = useRef(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/gantt?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((data) => setItems(data.items ?? []))
      .finally(() => setLoading(false));
  }, [from, to]);

  const days = useMemo(() => buildDayList(from, to), [from, to]);
  const months = useMemo(() => monthSpans(days), [days]);
  const timelineWidth = days.length * DAY_WIDTH;
  const totalWidth = LABEL_WIDTH + timelineWidth;
  const today = todayStr();
  const todayIndex = days.indexOf(today);

  const tasks = useMemo(() => items.filter((i) => i.type === "task"), [items]);
  const plans = useMemo(() => items.filter((i) => i.type === "plan"), [items]);
  const taskById = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  const taskRows = useMemo(() => buildTaskTreeRows(tasks, expanded), [tasks, expanded]);
  const planRows: GanttRow[] = plans.map((item) => ({ kind: "item", item, depth: 0 }));
  const rows = [...taskRows, ...planRows];

  const scrollToToday = useCallback(() => {
    const el = scrollRef.current;
    if (!el || todayIndex < 0) return;
    const offset = LABEL_WIDTH + todayIndex * DAY_WIDTH - el.clientWidth / 2 + DAY_WIDTH / 2;
    el.scrollLeft = Math.max(0, offset);
  }, [todayIndex]);

  useEffect(() => {
    if (!loading && items.length > 0 && !scrolledToToday.current) {
      scrolledToToday.current = true;
      requestAnimationFrame(scrollToToday);
    }
  }, [loading, items.length, scrollToToday]);

  function toggleExpand(taskId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }

  function barMetrics(item: GanttItem) {
    const startIdx = Math.max(0, daysBetween(from, item.startDate));
    const endIdx = Math.min(days.length - 1, daysBetween(from, item.effectiveEnd));
    const left = startIdx * DAY_WIDTH;
    const width = Math.max(DAY_WIDTH, (endIdx - startIdx + 1) * DAY_WIDTH);
    return { left, width };
  }

  function renderLabel(row: GanttRow, idx: number) {
    if (row.kind === "add-child") {
      return (
        <div
          key={`add-${row.parentTaskId}-${idx}`}
          className="flex items-center border-b border-gray-100 px-2"
          style={{ height: ROW_HEIGHT, paddingLeft: 12 + row.depth * 16 }}
        >
          <Link
            href={`/tasks/new?parentTaskId=${row.parentTaskId}&redirect=/gantt`}
            className="text-xs text-brand-600 hover:underline"
          >
            + 添加子任务
          </Link>
        </div>
      );
    }

    const item = row.item!;
    const childCount = tasks.filter((t) => t.parentId === item.id).length;
    const showToggle =
      item.type === "task" && (childCount > 0 || taskDepth(item.id, taskById) < 2);
    const isExpanded = expanded.has(item.id);

    return (
      <div
        key={`label-${item.type}-${item.id}-${idx}`}
        className="flex items-center gap-1 border-b border-gray-100 bg-white px-2"
        style={{ height: ROW_HEIGHT, paddingLeft: 12 + row.depth * 16 }}
      >
        {showToggle ? (
          <button
            type="button"
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-gray-400 hover:bg-gray-100"
            onClick={() => toggleExpand(item.id)}
            aria-label={isExpanded ? "折叠" : "展开"}
          >
            <span className={cn("text-[10px] transition-transform", isExpanded && "rotate-90")}>
              ▶
            </span>
          </button>
        ) : (
          <span className="w-5 shrink-0" />
        )}
        <Link
          href={itemHref(item)}
          className="min-w-0 flex-1 truncate text-sm hover:text-brand-600"
          title={item.title}
        >
          {item.title}
        </Link>
        {item.status && (
          <Badge variant="info" className="shrink-0 scale-90">
            {STATUS_LABEL[item.status] ?? item.status}
          </Badge>
        )}
      </div>
    );
  }

  function renderBar(row: GanttRow, idx: number) {
    if (row.kind === "add-child") {
      return (
        <div
          key={`bar-add-${idx}`}
          className="relative border-b border-gray-100"
          style={{ height: ROW_HEIGHT, width: timelineWidth }}
        />
      );
    }

    const item = row.item!;
    const { left, width } = barMetrics(item);

    return (
      <div
        key={`bar-${item.type}-${item.id}-${idx}`}
        className="relative border-b border-gray-100"
        style={{ height: ROW_HEIGHT, width: timelineWidth }}
      >
        <div
          className="absolute top-1/2 -translate-y-1/2"
          style={{ left, width: Math.max(width, DAY_WIDTH - 4) }}
        >
          <div
            className={cn(
              "relative h-7 overflow-hidden rounded-full",
              item.type === "task" ? "bg-slate-600/90" : "bg-purple-500/85",
            )}
          >
            <span className="block truncate px-3 text-xs leading-7 text-white">{item.title}</span>
          </div>
          {item.isVirtualEnd && (
            <div
              className="absolute top-1/2 h-0.5 w-12 -translate-y-1/2 bg-amber-400"
              style={{ left: "100%" }}
            >
              <span className="absolute -right-0.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-amber-400" />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (loading) return <Loading label="加载甘特图…" />;

  if (items.length === 0) {
    return (
      <EmptyState
        title="暂无时间条"
        description="创建带开始日期的任务或计划后，会在此展示。"
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto">
        <div style={{ width: totalWidth, minWidth: "100%" }}>
          {/* 时间轴（sticky 顶） */}
          <div className="sticky top-0 z-30 flex border-b border-gray-200 bg-white shadow-sm">
            <div
              className="sticky left-0 z-40 shrink-0 border-r border-gray-200 bg-gray-50"
              style={{ width: LABEL_WIDTH }}
            />
            <div style={{ width: timelineWidth }} className="relative shrink-0">
              <div className="flex border-b border-gray-100 bg-gray-50 text-xs text-gray-600">
                {months.map((m, i) => (
                  <div
                    key={`${m.label}-${i}`}
                    className="border-r border-gray-100 py-1 text-center"
                    style={{ width: m.count * DAY_WIDTH }}
                  >
                    {m.label}
                  </div>
                ))}
              </div>
              <div className="flex text-xs">
                {days.map((d) => {
                  const isToday = d === today;
                  const dayNum = parseInt(d.slice(8, 10), 10);
                  return (
                    <div
                      key={d}
                      className={cn(
                        "border-r border-gray-100 py-1 text-center",
                        isToday && "bg-red-50",
                      )}
                      style={{ width: DAY_WIDTH }}
                    >
                      {isToday ? (
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
                          {dayNum}
                        </span>
                      ) : (
                        <span className="text-gray-600">{dayNum}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 数据行 */}
          <div className="relative">
            {/* 背景网格 + 今日线 */}
            <div
              className="pointer-events-none absolute bottom-0 top-0 flex"
              style={{ left: LABEL_WIDTH, width: timelineWidth }}
            >
              {days.map((d, i) => (
                <div
                  key={d}
                  className={cn(
                    "border-r border-gray-100",
                    i % 7 < 2 ? "bg-gray-50/50" : "bg-transparent",
                  )}
                  style={{ width: DAY_WIDTH }}
                />
              ))}
              {todayIndex >= 0 && (
                <div
                  className="absolute bottom-0 top-0 w-px bg-red-400"
                  style={{ left: todayIndex * DAY_WIDTH + DAY_WIDTH / 2 }}
                />
              )}
            </div>

            {rows.map((row, idx) => (
              <div key={`row-${idx}`} className="flex">
                <div
                  className="sticky left-0 z-20 shrink-0 border-r border-gray-200 bg-white"
                  style={{ width: LABEL_WIDTH }}
                >
                  {renderLabel(row, idx)}
                </div>
                <div className="relative shrink-0">{renderBar(row, idx)}</div>
              </div>
            ))}

            <div className="flex">
              <div
                className="sticky left-0 z-20 border-r border-gray-200 bg-white p-2"
                style={{ width: LABEL_WIDTH }}
              >
                <Link href="/tasks/new?redirect=/gantt">
                  <Button size="sm" variant="secondary" type="button">
                    + 新建
                  </Button>
                </Link>
              </div>
              <div style={{ width: timelineWidth, height: 48 }} />
            </div>
          </div>
        </div>
      </div>

      {!compact && (
        <div className="flex shrink-0 items-center justify-between border-t border-gray-100 px-3 py-1.5 text-xs text-gray-500">
          <span>左右滑动浏览时间轴</span>
          <Button type="button" size="sm" variant="ghost" onClick={scrollToToday}>
            定位到今天
          </Button>
        </div>
      )}
    </div>
  );
}
