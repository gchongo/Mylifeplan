"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { GanttDraggableBar } from "@/components/gantt/gantt-draggable-bar";
import { GanttTaskDrawer } from "@/components/gantt/gantt-task-drawer";
import { GanttToolbar } from "@/components/gantt/gantt-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, Loading } from "@/components/ui/feedback";
import {
  barMetricsFromDates,
  buildCompactLayout,
  buildTimelineLayout,
  compactTimelineRange,
  dateToX,
  HOUR_WIDTH,
  isTodayInColumn,
  shiftAnchor,
  todayStr,
  type GanttScaleId,
  type TimelineLayout,
} from "@/lib/gantt-scale";
import type { GanttItem } from "@/types";
import { cn } from "@/lib/utils";

const ROW_HEIGHT = 44;
const LABEL_WIDTH = 200;
const FOOTER_HEIGHT = 48;
const TIMELINE_HEADER_HEIGHT = 52;

const STATUS_LABEL: Record<string, string> = {
  todo: "待办",
  in_progress: "执行",
  done: "完成",
  not_started: "规划",
  archived: "归档",
};

const TASK_BAR_BY_DEPTH = ["bg-slate-700/90", "bg-brand-600/90", "bg-teal-600/90"];
const TASK_LABEL_BY_DEPTH = ["bg-white", "bg-brand-50/90", "bg-teal-50/90"];

type RowKind = "item" | "add-child";

interface GanttRow {
  kind: RowKind;
  item?: GanttItem;
  depth: number;
  parentTaskId?: string;
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
        if (canHaveChildren) {
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

function taskBarColor(depth: number) {
  return TASK_BAR_BY_DEPTH[Math.min(depth, TASK_BAR_BY_DEPTH.length - 1)];
}

function taskLabelBg(depth: number) {
  return TASK_LABEL_BY_DEPTH[Math.min(depth, TASK_LABEL_BY_DEPTH.length - 1)];
}

function dataBoundsFromItems(items: GanttItem[]) {
  if (items.length === 0) return null;
  let from = items[0]!.startDate;
  let to = items[0]!.effectiveEnd;
  for (const item of items) {
    if (item.startDate < from) from = item.startDate;
    if (item.effectiveEnd > to) to = item.effectiveEnd;
  }
  return { from, to };
}

function formatHourLabel(h: number) {
  return `${h}:00`;
}

export function GanttChart({ fullPage = false }: { fullPage?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrolledToToday = useRef(false);
  const scrollTarget = useRef<"today" | "anchor">("today");

  const [scale, setScale] = useState<GanttScaleId>("month");
  const [anchor, setAnchor] = useState(todayStr);

  const compactRange = useMemo(() => compactTimelineRange(), []);

  const [items, setItems] = useState<GanttItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [scrollViewportHeight, setScrollViewportHeight] = useState(480);

  const dataBounds = useMemo(() => dataBoundsFromItems(items), [items]);

  const layout: TimelineLayout = useMemo(() => {
    if (!fullPage) return buildCompactLayout(compactRange.from, compactRange.to);
    return buildTimelineLayout(scale, anchor, dataBounds);
  }, [fullPage, scale, anchor, dataBounds, compactRange]);

  const { from, to } = fullPage ? layout : compactRange;
  const timelineWidth = layout.totalWidth;
  const totalWidth = LABEL_WIDTH + timelineWidth;
  const today = todayStr();
  const todayX = dateToX(today, layout);
  const todayVisible = today >= layout.from && today <= layout.to;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/gantt?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((data) => setItems(data.items ?? []))
      .finally(() => setLoading(false));
  }, [from, to]);

  const tasks = useMemo(() => items.filter((i) => i.type === "task"), [items]);
  const plans = useMemo(() => items.filter((i) => i.type === "plan"), [items]);
  const taskById = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  const taskRows = useMemo(() => buildTaskTreeRows(tasks, expanded), [tasks, expanded]);
  const planRows: GanttRow[] = plans.map((item) => ({ kind: "item", item, depth: 0 }));
  const rows = [...taskRows, ...planRows];
  const rowsBodyHeight = rows.length * ROW_HEIGHT + FOOTER_HEIGHT;
  const minBodyHeight = Math.max(
    rowsBodyHeight,
    scrollViewportHeight - TIMELINE_HEADER_HEIGHT,
  );

  const refetchGantt = useCallback(() => {
    fetch(`/api/gantt?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((data) => setItems(data.items ?? []));
  }, [from, to]);

  const drawerChildTasks = useMemo(() => {
    if (!selectedTaskId) return [];
    return tasks
      .filter((t) => t.parentId === selectedTaskId)
      .map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status ?? "todo",
      }));
  }, [tasks, selectedTaskId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const update = () => setScrollViewportHeight(el.clientHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [loading, fullPage]);

  const scrollToToday = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !todayVisible) return false;
    const offset = LABEL_WIDTH + todayX - el.clientWidth / 2;
    el.scrollLeft = Math.max(0, offset);
    return true;
  }, [todayVisible, todayX]);

  const scrollToAnchor = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return false;
    const anchorX = dateToX(anchor, layout);
    const offset = LABEL_WIDTH + anchorX - el.clientWidth / 2;
    el.scrollLeft = Math.max(0, offset);
    return true;
  }, [anchor, layout]);

  useEffect(() => {
    scrolledToToday.current = false;
  }, [from, to, scale, anchor]);

  useLayoutEffect(() => {
    if (loading || scrolledToToday.current) return;

    const tryScroll = () => {
      const ok =
        scrollTarget.current === "today" ? scrollToToday() : scrollToAnchor();
      if (ok) scrolledToToday.current = true;
    };

    tryScroll();
    const raf = requestAnimationFrame(tryScroll);
    const timer = window.setTimeout(tryScroll, 150);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [loading, scrollToToday, scrollToAnchor, from, to, layout.totalWidth]);

  function goToday() {
    scrollTarget.current = "today";
    setAnchor(todayStr());
    scrolledToToday.current = false;
    requestAnimationFrame(() => {
      scrollToToday();
      scrolledToToday.current = true;
    });
  }

  function navigatePrev() {
    if (scale === "day") {
      scrollRef.current?.scrollBy({ left: -HOUR_WIDTH, behavior: "smooth" });
      return;
    }
    scrollTarget.current = "anchor";
    scrolledToToday.current = false;
    setAnchor((a) => shiftAnchor(scale, a, -1));
  }

  function navigateNext() {
    if (scale === "day") {
      scrollRef.current?.scrollBy({ left: HOUR_WIDTH, behavior: "smooth" });
      return;
    }
    scrollTarget.current = "anchor";
    scrolledToToday.current = false;
    setAnchor((a) => shiftAnchor(scale, a, 1));
  }

  function handleItemUpdated(updated: GanttItem) {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }

  function openTask(taskId: string) {
    setSelectedTaskId(taskId);
  }

  function closeTaskDrawer() {
    setSelectedTaskId(null);
  }

  function toggleExpand(taskId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }

  function renderToolbar() {
    if (!fullPage) return null;
    return (
      <GanttToolbar
        periodLabel={layout.periodLabel}
        scale={scale}
        onScaleChange={(s) => {
          setScale(s);
          scrollTarget.current = "today";
          scrolledToToday.current = false;
        }}
        onPrev={navigatePrev}
        onNext={navigateNext}
        onToday={goToday}
      />
    );
  }

  function renderTimelineHeader() {
    return (
      <div className="sticky top-0 z-30 flex border-b border-gray-200 bg-white shadow-sm">
        <div
          className="sticky left-0 z-40 shrink-0 border-r border-gray-200 bg-gray-50"
          style={{ width: LABEL_WIDTH }}
        />
        <div style={{ width: timelineWidth }} className="relative shrink-0">
          <div className="flex border-b border-gray-100 bg-gray-50 text-xs text-gray-600">
            {layout.topSpans.map((span) => (
              <div
                key={span.key}
                className="border-r border-dashed border-gray-200 py-1.5 text-center"
                style={{ width: span.width }}
              >
                {span.label}
              </div>
            ))}
          </div>
          <div className="flex text-xs">
            {layout.columns.map((col) => {
              const isToday = isTodayInColumn(today, col);
              return (
                <div
                  key={col.key}
                  className={cn(
                    "border-r border-dashed border-gray-200 py-1 text-center",
                    col.isWeekend && "bg-gray-50/80",
                    isToday && "bg-red-50",
                  )}
                  style={{ width: col.width }}
                >
                  {isToday && (scale === "week" || scale === "month") ? (
                    <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-gray-200 px-1 text-[10px] font-semibold text-gray-800">
                      {col.headerBottom.replace(/^\S+\s/, "")}
                    </span>
                  ) : (
                    <span className={cn("text-gray-600", isToday && "font-semibold text-red-600")}>
                      {scale === "day" ? formatHourLabel(parseInt(col.headerBottom, 10)) : col.headerBottom}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  function renderGridBackground(height: number) {
    return (
      <div
        className="pointer-events-none absolute top-0 flex"
        style={{ left: LABEL_WIDTH, width: timelineWidth, height }}
      >
        {layout.columns.map((col) => (
          <div
            key={col.key}
            className={cn(
              "h-full border-r border-dashed border-gray-200",
              col.isWeekend && "bg-gray-50/70",
              col.isOtherMonth && "bg-gray-50/40",
            )}
            style={{ width: col.width }}
          />
        ))}
        {todayVisible && (
          <div
            className="absolute bottom-0 top-0 w-px bg-red-400"
            style={{ left: todayX }}
          />
        )}
      </div>
    );
  }

  function renderLabel(row: GanttRow, idx: number) {
    if (row.kind === "add-child") {
      return (
        <div
          key={`add-${row.parentTaskId}-${idx}`}
          className="flex items-center border-b border-dashed border-gray-100 bg-teal-50/50 px-2"
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
    const labelBg = item.type === "task" ? taskLabelBg(row.depth) : "bg-purple-50/80";

    return (
      <div
        key={`label-${item.type}-${item.id}-${idx}`}
        className={cn("flex items-center gap-1 border-b border-dashed border-gray-100 px-2", labelBg)}
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
        {item.type === "task" && fullPage ? (
          <button
            type="button"
            onClick={() => openTask(item.id)}
            className="min-w-0 flex-1 truncate text-left text-sm hover:text-brand-600"
            title={item.title}
          >
            {item.title}
          </button>
        ) : (
          <Link
            href={itemHref(item)}
            className="min-w-0 flex-1 truncate text-sm hover:text-brand-600"
            title={item.title}
          >
            {item.title}
          </Link>
        )}
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
          className="relative border-b border-dashed border-gray-100"
          style={{ height: ROW_HEIGHT, width: timelineWidth }}
        />
      );
    }

    const item = row.item!;
    const { left, width } = barMetricsFromDates(item.startDate, item.effectiveEnd, layout);
    const barColor = item.type === "task" ? taskBarColor(row.depth) : "bg-purple-500/85";

    if (fullPage && item.type === "task") {
      return (
        <div
          key={`bar-${item.type}-${item.id}-${idx}`}
          className="relative border-b border-dashed border-gray-100"
          style={{ height: ROW_HEIGHT, width: timelineWidth }}
        >
          <GanttDraggableBar
            item={item}
            layout={layout}
            left={left}
            width={width}
            barColor={barColor}
            onUpdated={handleItemUpdated}
            onTaskClick={() => openTask(item.id)}
          />
        </div>
      );
    }

    return (
      <div
        key={`bar-${item.type}-${item.id}-${idx}`}
        className="relative border-b border-dashed border-gray-100"
        style={{ height: ROW_HEIGHT, width: timelineWidth }}
      >
        <div
          className="absolute top-1/2 -translate-y-1/2"
          style={{ left, width: Math.max(width, 8) }}
        >
          <div className={cn("relative h-7 overflow-hidden rounded-full", barColor)}>
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

  if (loading) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        {renderToolbar()}
        <Loading label="加载甘特图…" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        {renderToolbar()}
        <EmptyState
          title="暂无时间条"
          description="创建带开始日期的任务或计划后，会在此展示。"
        />
      </div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        className="flex h-full min-h-0 w-full max-w-full min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white"
      >
        {renderToolbar()}

        <div ref={scrollRef} className="min-h-0 w-full max-w-full min-w-0 flex-1 overflow-auto">
          <div style={{ width: totalWidth }}>
            {renderTimelineHeader()}

            <div className="relative" style={{ minHeight: minBodyHeight }}>
              {renderGridBackground(minBodyHeight)}

              {rows.map((row, idx) => {
                const labelBg =
                  row.kind === "item" && row.item?.type === "task"
                    ? taskLabelBg(row.depth)
                    : row.kind === "item" && row.item?.type === "plan"
                      ? "bg-purple-50/80"
                      : "bg-teal-50/50";

                return (
                  <div key={`row-${idx}`} className="relative flex">
                    <div
                      className={cn(
                        "sticky left-0 z-20 shrink-0 border-r border-gray-200",
                        labelBg,
                      )}
                      style={{ width: LABEL_WIDTH }}
                    >
                      {renderLabel(row, idx)}
                    </div>
                    <div className="relative z-10 shrink-0">{renderBar(row, idx)}</div>
                  </div>
                );
              })}

              <div className="relative flex">
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
                <div style={{ width: timelineWidth, height: FOOTER_HEIGHT }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {fullPage && (
        <GanttTaskDrawer
          taskId={selectedTaskId}
          open={selectedTaskId !== null}
          childTasks={drawerChildTasks}
          onClose={closeTaskDrawer}
          onOpenTask={openTask}
          onChanged={refetchGantt}
        />
      )}
    </>
  );
}
