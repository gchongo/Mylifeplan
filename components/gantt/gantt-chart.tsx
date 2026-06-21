"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  GANTT_DRAWER_TOGGLE_WIDTH,
  GANTT_TITLE_ROW_CLASS,
} from "@/lib/gantt-title-column";
import { GanttDrawerOpenTab, GanttTitleDrawer, GanttTitleDrawerControls, GanttTitleDrawerFooter } from "@/components/gantt/gantt-title-drawer";
import { GanttContributionDrawerPanel } from "@/components/gantt/gantt-contribution-drawer";
import { GanttDraggableBar } from "@/components/gantt/gantt-draggable-bar";
import { GanttPlanDrawerPanel } from "@/components/gantt/gantt-plan-drawer";
import { PlanFormModal } from "@/components/gantt/plan-form-modal";
import { TaskStatusIndicator } from "@/components/tasks/task-status-indicator";
import { Button, EmptyState, Loading as LoadingView } from "@/components/ui";
import { DrawerLayout } from "@/components/ui/drawer";
import {
  barMetricsFromDates,
  buildTimelineLayout,
  dateToX,
  HOUR_WIDTH,
  isTodayInColumn,
  scaleTimelineToViewport,
  shiftAnchor,
  todayStr,
  type GanttScaleId,
  type TimelineLayout,
} from "@/lib/gantt-scale";
import { filterGanttTasksByStatus } from "@/lib/gantt-task-filter";
import { GRID_BORDER } from "@/lib/gantt-grid-colors";
import { deriveParentStatus } from "@/lib/services/plan-rollup";
import {
  getGanttBarStyle,
  getStatusStyle,
  STATUS_LEGEND,
  type VisualStatusKey,
} from "@/lib/task-status-style";
import type { GanttContribution, GanttItem, PlanStatus } from "@/types";
import { apiJson } from "@/lib/client-api";
import { dispatchPlanUpdated, PLAN_UPDATED_EVENT } from "@/lib/plan-events";
import { cn } from "@/lib/utils";

const ROW_HEIGHT = 44;
const DEFAULT_LABEL_WIDTH = 200;
const MIN_LABEL_WIDTH = 120;
const MAX_LABEL_WIDTH = 560;
const GANTT_LABEL_WIDTH_KEY = "mylifeplan-gantt-label-width";
const GANTT_LABEL_VISIBLE_KEY = "mylifeplan-gantt-label-visible";
const FOOTER_HEIGHT = 48;
const TIMELINE_HEADER_HEIGHT = 28;

function readStoredLabelWidth() {
  if (typeof window === "undefined") return DEFAULT_LABEL_WIDTH;
  const n = parseInt(localStorage.getItem(GANTT_LABEL_WIDTH_KEY) ?? "", 10);
  if (Number.isNaN(n)) return DEFAULT_LABEL_WIDTH;
  return Math.min(MAX_LABEL_WIDTH, Math.max(MIN_LABEL_WIDTH, n));
}

function readStoredLabelVisible() {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(GANTT_LABEL_VISIBLE_KEY) !== "false";
}

function asPlanStatus(status: string | undefined | null): PlanStatus {
  if (status === "not_started" || status === "in_progress" || status === "done" || status === "archived") {
    return status;
  }
  if (status === "todo") return "not_started";
  return "not_started";
}

function itemDisplayStatus(item: GanttItem, allPlans: GanttItem[]): string {
  const children = allPlans.filter(
    (p) => p.parentId === item.id && p.status !== "archived",
  );
  if (children.length === 0) return item.status ?? "not_started";
  return deriveParentStatus(
    asPlanStatus(item.status),
    children.map((c) => asPlanStatus(c.status)),
  );
}

function itemHasRollup(item: GanttItem, allPlans: GanttItem[]): boolean {
  return allPlans.some((p) => p.parentId === item.id && p.status !== "archived");
}

type RowKind = "item";

interface GanttRow {
  kind: RowKind;
  item: GanttItem;
  depth: number;
}

function planDepth(itemId: string, byId: Map<string, GanttItem>): number {
  let depth = 0;
  let cur = byId.get(itemId);
  while (cur?.parentId && byId.has(cur.parentId)) {
    depth++;
    cur = byId.get(cur.parentId);
  }
  return depth;
}

function buildPlanTreeRows(plans: GanttItem[], expanded: Set<string>): GanttRow[] {
  const planIds = new Set(plans.map((p) => p.id));
  const byParent = new Map<string | null, GanttItem[]>();
  const byId = new Map(plans.map((p) => [p.id, p]));

  for (const plan of plans) {
    const key = plan.parentId && planIds.has(plan.parentId) ? plan.parentId : null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(plan);
  }

  for (const list of byParent.values()) {
    list.sort((a, b) => a.startDate.localeCompare(b.startDate));
  }

  const rows: GanttRow[] = [];

  function walk(parentId: string | null, depth: number) {
    for (const item of byParent.get(parentId) ?? []) {
      rows.push({ kind: "item", item, depth });
      const childCount = byParent.get(item.id)?.length ?? 0;

      if (expanded.has(item.id) && childCount > 0) {
        walk(item.id, depth + 1);
      }
    }
  }

  walk(null, 0);
  return rows;
}

interface PlanModalState {
  open: boolean;
  title: string;
  defaultParentPlanId?: string | null;
  defaultStartDate?: string | null;
  defaultEndDate?: string | null;
}

function planBarStyle(item: GanttItem, allPlans: GanttItem[], depth: number) {
  const displayStatus = itemDisplayStatus(item, allPlans);
  return getGanttBarStyle(item.status, item.endDate, displayStatus, depth);
}

function planLabelStyle(item: GanttItem, allPlans: GanttItem[]) {
  const displayStatus = itemDisplayStatus(item, allPlans);
  return getStatusStyle(item.status, item.endDate, displayStatus);
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

export interface GanttChartHandle {
  navigatePrev: () => void;
  navigateNext: () => void;
  goToday: () => void;
}

export interface GanttTitleColumnLayout {
  width: number;
  visible: boolean;
  collapsedWidth: number;
}

export const GanttChart = forwardRef<
  GanttChartHandle,
  {
    fullPage?: boolean;
    scale?: GanttScaleId;
    onScaleChange?: (scale: GanttScaleId) => void;
    onTitleColumnLayout?: (layout: GanttTitleColumnLayout) => void;
  }
>(function GanttChart({ fullPage = false, scale: scaleProp, onScaleChange, onTitleColumnLayout }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrolledToToday = useRef(false);
  const scrollTarget = useRef<"today" | "anchor">("today");
  const panRef = useRef<{ startX: number; startScrollLeft: number } | null>(null);
  const pendingScrollLeft = useRef<number | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  const [planModal, setPlanModal] = useState<PlanModalState>({
    open: false,
    title: "新建计划",
  });

  const [internalScale, setInternalScale] = useState<GanttScaleId>("month");
  const scale = scaleProp ?? internalScale;
  const [anchor, setAnchor] = useState(todayStr);

  const [items, setItems] = useState<GanttItem[]>([]);
  const [contributions, setContributions] = useState<GanttContribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<Set<VisualStatusKey>>(
    () => new Set(STATUS_LEGEND),
  );
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedContributionId, setSelectedContributionId] = useState<string | null>(null);
  const [scrollViewportHeight, setScrollViewportHeight] = useState(480);
  const [timelineViewportWidth, setTimelineViewportWidth] = useState(0);
  const [labelWidth, setLabelWidth] = useState(DEFAULT_LABEL_WIDTH);
  const [labelVisible, setLabelVisible] = useState(true);
  const [isResizingLabel, setIsResizingLabel] = useState(false);

  const effectiveLabelWidth = labelVisible ? labelWidth : 0;

  useEffect(() => {
    setLabelWidth(readStoredLabelWidth());
    setLabelVisible(readStoredLabelVisible());
  }, []);

  useEffect(() => {
    onTitleColumnLayout?.({
      width: labelVisible ? labelWidth : 0,
      visible: labelVisible,
      collapsedWidth: GANTT_DRAWER_TOGGLE_WIDTH,
    });
  }, [labelWidth, labelVisible, onTitleColumnLayout]);

  const dataBounds = useMemo(() => dataBoundsFromItems(items), [items]);

  const layout: TimelineLayout = useMemo(() => {
    const base = buildTimelineLayout(scale, anchor, dataBounds);
    if (scale === "5year" && timelineViewportWidth > 0) {
      return scaleTimelineToViewport(base, timelineViewportWidth);
    }
    return base;
  }, [scale, anchor, dataBounds, timelineViewportWidth]);

  const { from, to } = layout;
  const timelineWidth = layout.totalWidth;
  const totalWidth = effectiveLabelWidth + timelineWidth;
  const today = todayStr();
  const todayX = dateToX(today, layout);
  const todayVisible = today >= layout.from && today <= layout.to;

  useEffect(() => {
    setIsLoading(true);
    apiJson<{ items?: GanttItem[]; contributions?: GanttContribution[] }>(
      `/api/gantt?from=${from}&to=${to}`,
    )
      .then((data) => {
        setItems(data.items ?? []);
        setContributions(data.contributions ?? []);
      })
      .catch(() => {
        setItems([]);
        setContributions([]);
      })
      .finally(() => setIsLoading(false));
  }, [from, to]);

  const planById = useMemo(() => new Map(items.map((p) => [p.id, p])), [items]);

  const getDisplayStatus = useCallback(
    (item: GanttItem) => itemDisplayStatus(item, items),
    [items],
  );

  const filteredPlans = useMemo(
    () => filterGanttTasksByStatus(items, statusFilter, getDisplayStatus),
    [items, statusFilter, getDisplayStatus],
  );

  const rows = useMemo(
    () => buildPlanTreeRows(filteredPlans, expanded),
    [filteredPlans, expanded],
  );

  const toggleLabelPanel = useCallback(() => {
    setLabelVisible((prev) => {
      const next = !prev;
      localStorage.setItem(GANTT_LABEL_VISIBLE_KEY, String(next));
      return next;
    });
  }, []);

  const startLabelResize = useCallback((clientX: number) => {
    const startX = clientX;
    const startWidth = labelWidth;
    setIsResizingLabel(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    function onMove(e: MouseEvent) {
      const next = Math.min(
        MAX_LABEL_WIDTH,
        Math.max(MIN_LABEL_WIDTH, startWidth + (e.clientX - startX)),
      );
      setLabelWidth(next);
    }

    function onUp(e: MouseEvent) {
      const next = Math.min(
        MAX_LABEL_WIDTH,
        Math.max(MIN_LABEL_WIDTH, startWidth + (e.clientX - startX)),
      );
      setLabelWidth(next);
      localStorage.setItem(GANTT_LABEL_WIDTH_KEY, String(next));
      setIsResizingLabel(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [labelWidth]);

  const expandablePlanIds = useMemo(() => {
    return filteredPlans
      .filter((p) => {
        const childCount = filteredPlans.filter((c) => c.parentId === p.id).length;
        return childCount > 0 || planDepth(p.id, planById) < 2;
      })
      .map((p) => p.id);
  }, [filteredPlans, planById]);

  const allSubplansExpanded =
    expandablePlanIds.length > 0 && expandablePlanIds.every((id) => expanded.has(id));
  const rowsBodyHeight = rows.length * ROW_HEIGHT + FOOTER_HEIGHT;
  const minBodyHeight = Math.max(
    rowsBodyHeight,
    scrollViewportHeight - TIMELINE_HEADER_HEIGHT,
  );

  const refetchGantt = useCallback(() => {
    apiJson<{ items?: GanttItem[]; contributions?: GanttContribution[] }>(
      `/api/gantt?from=${from}&to=${to}`,
    ).then((data) => {
      setItems(data.items ?? []);
      setContributions(data.contributions ?? []);
    });
  }, [from, to]);

  useEffect(() => {
    function onPlanUpdated() {
      refetchGantt();
    }
    window.addEventListener(PLAN_UPDATED_EVENT, onPlanUpdated);
    return () => window.removeEventListener(PLAN_UPDATED_EVENT, onPlanUpdated);
  }, [refetchGantt]);

  useEffect(() => {
    if (!isPanning) return;

    function onMove(e: MouseEvent) {
      const pan = panRef.current;
      const el = scrollRef.current;
      if (!pan || !el) return;
      el.scrollLeft = pan.startScrollLeft - (e.clientX - pan.startX);
    }

    function onUp() {
      panRef.current = null;
      setIsPanning(false);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isPanning]);

  useEffect(() => {
    const container = containerRef.current;
    const scroll = scrollRef.current;
    if (!container || !scroll) return;

    const update = () => {
      setScrollViewportHeight(scroll.clientHeight);
      const w = Math.floor(container.clientWidth - effectiveLabelWidth);
      setTimelineViewportWidth((prev) => (Math.abs(prev - w) > 4 ? w : prev));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(container);
    return () => ro.disconnect();
  }, [isLoading, fullPage, effectiveLabelWidth]);

  const scrollToToday = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !todayVisible) return false;
    const offset = effectiveLabelWidth + todayX - el.clientWidth / 2;
    el.scrollLeft = Math.max(0, offset);
    return true;
  }, [todayVisible, todayX, effectiveLabelWidth]);

  const scrollToAnchor = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return false;
    const anchorX = dateToX(anchor, layout);
    const offset = effectiveLabelWidth + anchorX - el.clientWidth / 2;
    el.scrollLeft = Math.max(0, offset);
    return true;
  }, [anchor, layout, effectiveLabelWidth]);

  useEffect(() => {
    scrolledToToday.current = false;
  }, [from, to, scale, anchor]);

  useLayoutEffect(() => {
    if (isLoading || scrolledToToday.current) return;

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
  }, [isLoading, scrollToToday, scrollToAnchor, from, to, scale, anchor]);

  const drawerOpen = selectedContributionId !== null || selectedPlanId !== null;

  useLayoutEffect(() => {
    if (pendingScrollLeft.current === null) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = pendingScrollLeft.current;
    pendingScrollLeft.current = null;
  }, [drawerOpen, selectedContributionId, selectedPlanId]);

  function preserveScrollLeft() {
    pendingScrollLeft.current = scrollRef.current?.scrollLeft ?? 0;
  }

  function closeDrawer() {
    setSelectedPlanId(null);
    setSelectedContributionId(null);
  }

  const changeScale = useCallback(
    (next: GanttScaleId) => {
      onScaleChange?.(next);
      if (scaleProp === undefined) setInternalScale(next);
      scrollTarget.current = "today";
      scrolledToToday.current = false;
    },
    [onScaleChange, scaleProp],
  );

  const goToday = useCallback(() => {
    scrollTarget.current = "today";
    setAnchor(todayStr());
    scrolledToToday.current = false;
    requestAnimationFrame(() => {
      scrollToToday();
      scrolledToToday.current = true;
    });
  }, [scrollToToday]);

  const navigatePrev = useCallback(() => {
    if (scale === "day") {
      scrollRef.current?.scrollBy({ left: -HOUR_WIDTH, behavior: "smooth" });
      return;
    }
    scrollTarget.current = "anchor";
    scrolledToToday.current = false;
    setAnchor((a) => shiftAnchor(scale, a, -1));
  }, [scale]);

  const navigateNext = useCallback(() => {
    if (scale === "day") {
      scrollRef.current?.scrollBy({ left: HOUR_WIDTH, behavior: "smooth" });
      return;
    }
    scrollTarget.current = "anchor";
    scrolledToToday.current = false;
    setAnchor((a) => shiftAnchor(scale, a, 1));
  }, [scale]);

  useImperativeHandle(
    ref,
    () => ({
      navigatePrev,
      navigateNext,
      goToday,
    }),
    [navigatePrev, navigateNext, goToday],
  );

  function handleItemUpdated(updated: GanttItem) {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }

  function openPlan(planId: string) {
    preserveScrollLeft();
    setSelectedContributionId(null);
    setSelectedPlanId(planId);
  }

  function closePlanDrawer() {
    setSelectedPlanId(null);
  }

  function openContribution(contributionId: string) {
    preserveScrollLeft();
    setSelectedPlanId(null);
    setSelectedContributionId(contributionId);
  }

  function closeContributionDrawer() {
    setSelectedContributionId(null);
  }

  function openCreatePlan(parentPlanId?: string | null, defaultStartDate?: string | null) {
    setPlanModal({
      open: true,
      title: parentPlanId ? "添加子计划" : "新建计划",
      defaultParentPlanId: parentPlanId ?? null,
      defaultStartDate: defaultStartDate ?? null,
    });
  }

  function closePlanModal() {
    setPlanModal((prev) => ({ ...prev, open: false }));
  }

  function handlePanStart(e: React.MouseEvent) {
    if (e.button !== 0) return;
    if (isResizingLabel) return;
    const target = e.target as HTMLElement;
    if (target.closest("[data-gantt-bar]")) return;
    if (target.closest("button, a, input, textarea, select, [data-no-pan]")) return;

    const el = scrollRef.current;
    if (!el) return;

    panRef.current = { startX: e.clientX, startScrollLeft: el.scrollLeft };
    setIsPanning(true);
    e.preventDefault();
  }

  function toggleExpandAll() {
    if (allSubplansExpanded) {
      setExpanded(new Set());
    } else {
      setExpanded(new Set(expandablePlanIds));
    }
  }

  function toggleExpand(planId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(planId)) next.delete(planId);
      else next.add(planId);
      return next;
    });
  }

  function renderTimelineHeaderOnly() {
    return (
      <div
        className="sticky top-0 z-20 flex shrink-0 border-b border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
        style={{ width: timelineWidth, minHeight: TIMELINE_HEADER_HEIGHT }}
      >
        <div className="flex w-full bg-white text-xs dark:bg-gray-950">
          {layout.columns.map((col) => {
            const isToday = isTodayInColumn(today, col);
            return (
              <div
                key={col.key}
                className={cn(
                  "bg-white py-1 text-center dark:bg-gray-950",
                  GRID_BORDER,
                  col.isWeekend && "bg-gray-50 dark:bg-gray-900/70",
                  isToday && "ring-1 ring-inset ring-red-200/80 dark:ring-red-500/40",
                )}
                style={{ width: col.width }}
              >
                {isToday && (scale === "week" || scale === "month") ? (
                  <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-gray-200 px-1 text-[10px] font-semibold text-gray-800 dark:bg-gray-700 dark:text-gray-100">
                    {col.headerBottom.replace(/^\S+\s/, "")}
                  </span>
                ) : (
                  <span
                    className={cn(
                      "text-gray-600 dark:text-gray-300",
                      isToday && "font-semibold text-red-600 dark:text-red-400",
                    )}
                  >
                    {scale === "day" ? formatHourLabel(parseInt(col.headerBottom, 10)) : col.headerBottom}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function renderGridBackground(height: number) {
    return (
      <div
        className="pointer-events-none absolute top-0 flex"
        style={{ left: effectiveLabelWidth, width: timelineWidth, height }}
      >
        {layout.columns.map((col) => (
          <div
            key={col.key}
            className={cn(
              "h-full bg-white dark:bg-gray-950",
              GRID_BORDER,
              col.isWeekend && "bg-gray-50 dark:bg-gray-900/70",
              col.isOtherMonth && "opacity-80",
            )}
            style={{ width: col.width }}
          />
        ))}
        {todayVisible && (
          <div
            className="absolute bottom-0 top-0 w-px bg-red-400 dark:bg-red-500"
            style={{ left: todayX }}
          />
        )}
      </div>
    );
  }

  function renderLabel(row: GanttRow, idx: number) {
    const item = row.item;
    const childCount = filteredPlans.filter((p) => p.parentId === item.id).length;
    const showToggle =
      childCount > 0 || planDepth(item.id, planById) < 2;
    const canAddChild = planDepth(item.id, planById) < 2;
    const isExpanded = expanded.has(item.id);
    const displayStatus = itemDisplayStatus(item, items);
    const hasRollup = itemHasRollup(item, items);
    const statusStyle = planLabelStyle(item, items);

    return (
      <div
        key={`label-${item.id}-${idx}`}
        className={cn(
          "group flex items-center gap-1 border-l-2 px-2",
          GANTT_TITLE_ROW_CLASS,
          statusStyle.stripe,
        )}
        style={{ height: ROW_HEIGHT, paddingLeft: 12 + row.depth * 16 }}
      >
        {showToggle ? (
          <button
            type="button"
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-blue-400 hover:bg-blue-200/40 dark:text-blue-300 dark:hover:bg-blue-900/40"
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
        <button
          type="button"
          onClick={() => openPlan(item.id)}
          className="min-w-0 flex-1 whitespace-normal break-words text-left text-sm leading-snug text-blue-950 hover:text-blue-700 dark:text-blue-50 dark:hover:text-blue-200"
          title={item.title}
        >
          {item.title}
        </button>
        {canAddChild && (
          <button
            type="button"
            data-no-pan
            onClick={(e) => {
              e.stopPropagation();
              openCreatePlan(item.id);
            }}
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-base leading-none text-blue-600",
              "opacity-0 transition-opacity hover:bg-blue-200/60 group-hover:opacity-100",
              "dark:text-blue-300 dark:hover:bg-blue-900/50",
            )}
            title="添加子计划"
            aria-label="添加子计划"
          >
            +
          </button>
        )}
        {item.status && (
          <TaskStatusIndicator
            status={item.status}
            dueDate={item.endDate}
            displayStatus={displayStatus}
            hasRollup={hasRollup}
          />
        )}
      </div>
    );
  }

  function renderContributionMarkers(planId: string) {
    const byDate = new Map<string, GanttContribution[]>();
    for (const c of contributions) {
      if (c.planId !== planId) continue;
      const list = byDate.get(c.occurredOn) ?? [];
      list.push(c);
      byDate.set(c.occurredOn, list);
    }

    return [...byDate.entries()].map(([date, list]) => {
      const x = dateToX(date, layout);
      const primary = list[list.length - 1]!;
      return (
        <button
          key={`${planId}-${date}`}
          type="button"
          data-gantt-bar
          onClick={() => openContribution(primary.id)}
          className="absolute top-1/2 z-20 flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand-500 ring-2 ring-white hover:bg-brand-600"
          style={{ left: x }}
          title={list.map((c) => c.title).join("、")}
          aria-label={`${date} 贡献：${primary.title}`}
        >
          {list.length > 1 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-3.5 min-w-[0.875rem] items-center justify-center rounded-full bg-gray-900 px-0.5 text-[9px] font-medium text-white">
              {list.length}
            </span>
          )}
        </button>
      );
    });
  }

  function renderBar(row: GanttRow, idx: number) {
    const item = row.item;
    const { left, width } = barMetricsFromDates(item.startDate, item.effectiveEnd, layout);
    const barStyle = planBarStyle(item, items, row.depth);

    return (
      <div
        key={`bar-${item.id}-${idx}`}
        className="relative border-b border-dashed border-gray-100"
        style={{ height: ROW_HEIGHT, width: timelineWidth }}
      >
        {!item.contributionOnly && (
          <GanttDraggableBar
            item={item}
            layout={layout}
            left={left}
            width={width}
            barShell={barStyle.shell}
            barText={barStyle.text}
            onUpdated={handleItemUpdated}
            onTaskClick={() => openPlan(item.id)}
          />
        )}
        {item.contributionOnly && (
          <div
            className="absolute top-1/2 h-px -translate-y-1/2 bg-purple-200"
            style={{ left: Math.max(left, 0), width: Math.max(width, 24) }}
          />
        )}
        {renderContributionMarkers(item.id)}
      </div>
    );
  }

  function renderDrawerPanel() {
    if (selectedContributionId) {
      return (
        <GanttContributionDrawerPanel
          contributionId={selectedContributionId}
          onClose={closeContributionDrawer}
          onDeleted={refetchGantt}
        />
      );
    }
    if (selectedPlanId) {
      return (
        <GanttPlanDrawerPanel planId={selectedPlanId} onClose={closePlanDrawer} />
      );
    }
    return null;
  }

  function wrapWithDrawers(content: React.ReactNode) {
    return (
      <DrawerLayout open={drawerOpen} onClose={closeDrawer} panel={renderDrawerPanel()}>
        {content}
      </DrawerLayout>
    );
  }

  function renderPlanModal() {
    return (
      <PlanFormModal
        open={planModal.open}
        onClose={closePlanModal}
        title={planModal.title}
        defaultParentPlanId={planModal.defaultParentPlanId}
        defaultStartDate={planModal.defaultStartDate}
        defaultEndDate={planModal.defaultEndDate}
        onSuccess={() => {
          refetchGantt();
          dispatchPlanUpdated();
        }}
      />
    );
  }

  if (isLoading) {
    return (
      <>
        {wrapWithDrawers(
          <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <LoadingView label="加载甘特图…" />
          </div>,
        )}
        {renderPlanModal()}
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        {wrapWithDrawers(
          <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <EmptyState
              title="暂无时间条"
              description="创建带开始日期的计划后，会在此展示。"
            />
            {fullPage && (
              <div className="px-4 pb-4">
                <Button type="button" onClick={() => openCreatePlan()}>
                  + 新建计划
                </Button>
              </div>
            )}
          </div>,
        )}
        {renderPlanModal()}
      </>
    );
  }

  return (
    <>
      {wrapWithDrawers(
        <div
          ref={containerRef}
          className={cn(
            "flex h-full min-h-0 w-full max-w-full min-w-0 flex-1 flex-col overflow-hidden",
            "rounded-none border-0 bg-transparent shadow-none",
          )}
        >
          <div className="relative min-h-0 flex-1">
            {!labelVisible && (
              <GanttDrawerOpenTab
                headerHeight={TIMELINE_HEADER_HEIGHT}
                onOpen={toggleLabelPanel}
              />
            )}

            <div
              ref={scrollRef}
              onMouseDown={handlePanStart}
              className={cn(
                "h-full min-h-0 w-full max-w-full min-w-0 overflow-x-auto overflow-y-auto",
                isResizingLabel && "cursor-col-resize select-none",
                isPanning ? "cursor-grabbing select-none" : !isResizingLabel && "cursor-grab",
              )}
            >
              <div className="relative flex min-h-0" style={{ width: totalWidth }}>
                <div className="flex shrink-0">
                {labelVisible && (
                  <GanttTitleDrawer
                    width={labelWidth}
                    headerHeight={TIMELINE_HEADER_HEIGHT}
                    bodyHeight={Math.max(
                      rows.length * ROW_HEIGHT,
                      minBodyHeight - TIMELINE_HEADER_HEIGHT - FOOTER_HEIGHT,
                    )}
                    footerHeight={FOOTER_HEIGHT}
                    isResizing={isResizingLabel}
                    onResizeStart={startLabelResize}
                    header={
                      <GanttTitleDrawerControls
                        allExpanded={allSubplansExpanded}
                        onToggleExpandAll={toggleExpandAll}
                        showExpandToggle={expandablePlanIds.length > 0}
                        statusFilter={statusFilter}
                        onStatusFilterChange={setStatusFilter}
                        onCloseDrawer={toggleLabelPanel}
                      />
                    }
                    body={rows.map((row, idx) => renderLabel(row, idx))}
                    footer={<GanttTitleDrawerFooter onCreatePlan={() => openCreatePlan()} />}
                  />
                )}

                <div className="flex shrink-0 flex-col">
                  {renderTimelineHeaderOnly()}

                  <div
                    className="relative"
                    style={{ minHeight: Math.max(rows.length * ROW_HEIGHT, minBodyHeight - TIMELINE_HEADER_HEIGHT - FOOTER_HEIGHT) }}
                  >
                    {renderGridBackground(
                      Math.max(rows.length * ROW_HEIGHT, minBodyHeight - TIMELINE_HEADER_HEIGHT - FOOTER_HEIGHT),
                    )}

                    {rows.map((row, idx) => (
                      <div key={`row-${idx}`} className="relative">
                        {renderBar(row, idx)}
                      </div>
                    ))}
                  </div>

                  <div style={{ width: timelineWidth, height: FOOTER_HEIGHT }} />
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>,
      )}

      {renderPlanModal()}
    </>
  );
});
