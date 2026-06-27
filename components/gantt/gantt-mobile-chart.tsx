"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { CalendarMobileSplitLayout } from "@/components/calendar/calendar-mobile-split-layout";
import { GanttRowExpandIcon } from "@/components/gantt/gantt-row-expand-icon";
import { GanttToolbarControls } from "@/components/gantt/gantt-toolbar-controls";
import { GanttMobileBarTitleTrack } from "@/components/gantt/gantt-mobile-bar-title";
import { GanttActualExecutionLineVertical } from "@/components/gantt/gantt-actual-execution-line";
import { GanttMobileDraggableBar } from "@/components/gantt/gantt-mobile-draggable-bar";
import { GanttMobileScheduleDrawer } from "@/components/gantt/gantt-mobile-schedule-drawer";
import { GanttPlanDrawerPanel } from "@/components/gantt/gantt-plan-drawer";
import { GanttContributionDrawerPanel } from "@/components/gantt/gantt-contribution-drawer";
import { GanttPanelChevronDown, GanttPanelChevronUp } from "@/components/gantt/gantt-panel-chevron";
import { DrawerPanel } from "@/components/ui/drawer";
import { EmptyState, Loading as LoadingView } from "@/components/ui";
import { useI18n } from "@/components/i18n/i18n-provider";
import { useSettings } from "@/components/settings/settings-provider";
import { apiJson } from "@/lib/client-api";
import {
  CONTRIBUTION_POINT_WIDTH_PX,
  contributionIntervalFillStyle,
  isContributionInterval,
  resolveContributionMarkerColor,
} from "@/lib/contribution-marker-style";
import { getPlanActualExecutionSpan, nowPlanIso } from "@/lib/gantt-actual-timeline";
import { contributionsForGanttRow } from "@/lib/gantt-contribution-display";
import { buildMobilePlanBarForkLineGroups } from "@/lib/gantt-mobile-tree-lines";
import {
  mobilePlanBarCenterPx,
  mobilePlanBarLeftPx,
  mobilePlanBarWidthPx,
  mobilePlanColumnWidth,
  mobilePlanGridWidth,
} from "@/lib/gantt-mobile-layout";
import { buildMobileSecondaryAxisSpans, mobileWeekAxisWidthPx } from "@/lib/gantt-mobile-week-axis";
import { defaultGanttStatusFilter, filterGanttTasksByStatus } from "@/lib/gantt-task-filter";
import {
  buildBoundGroupPreview,
  getPlanContributionBounds,
  isDateWithinPlanSpan,
} from "@/lib/gantt-plan-bind";
import {
  applyGanttPlanPatch,
  type GanttPlanPatch,
} from "@/lib/gantt-plan-sync";
import { deriveParentStatus } from "@/lib/services/plan-rollup";
import {
  buildTimelineLayout,
  dateToX,
  ganttPlanBarMetrics,
  getDateColumnBounds,
  shiftAnchor,
  todayStr,
  type GanttScaleId,
  type TimelineLayout,
} from "@/lib/gantt-scale";
import { ganttTodayColumnBackground } from "@/lib/gantt-today-column-style";
import type { PlanDragMode } from "@/lib/gantt-plan-drag";
import { resolveEffectivePlanColor, resolvePlanTreeGroupColor } from "@/lib/plan-color";
import { queryKeys } from "@/lib/query/keys";
import type { GanttContribution, GanttItem } from "@/types";
import { cn } from "@/lib/utils";

const DAY_AXIS_WIDTH = 26;
const WEEK_AXIS_WIDTH = mobileWeekAxisWidthPx();
const TIME_AXIS_WIDTH = DAY_AXIS_WIDTH + WEEK_AXIS_WIDTH;
const HEADER_HEIGHT = 28;
const ROW_GROUP_GAP = 8;

type GanttRow = {
  item: GanttItem;
  depth: number;
  gapBefore: number;
  rootId: string;
};

function asPlanStatus(status: string | null | undefined) {
  if (status === "done" || status === "in_progress" || status === "not_started") return status;
  if (status === "todo") return "not_started";
  return "not_started";
}

function itemDisplayStatus(item: GanttItem, allPlans: GanttItem[]): string {
  const children = allPlans.filter((p) => p.parentId === item.id && p.status !== "archived");
  if (children.length === 0) return item.status ?? "not_started";
  return deriveParentStatus(
    asPlanStatus(item.status),
    children.map((c) => asPlanStatus(c.status)),
  );
}

function buildPlanTreeRows(plans: GanttItem[], expanded: Set<string>): GanttRow[] {
  const planIds = new Set(plans.map((p) => p.id));
  const byParent = new Map<string | null, GanttItem[]>();

  for (const plan of plans) {
    const key = plan.parentId && planIds.has(plan.parentId) ? plan.parentId : null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(plan);
  }

  for (const list of byParent.values()) {
    list.sort((a, b) => {
      if (!!a.isUnscheduled !== !!b.isUnscheduled) return a.isUnscheduled ? 1 : -1;
      return a.startDate.localeCompare(b.startDate);
    });
  }

  const rows: GanttRow[] = [];

  function walk(parentId: string | null, depth: number, rootId: string | null) {
    for (const item of byParent.get(parentId) ?? []) {
      const currentRoot = depth === 0 ? item.id : rootId!;
      const childCount = byParent.get(item.id)?.length ?? 0;
      const willExpand = expanded.has(item.id) && childCount > 0;
      rows.push({
        item,
        depth,
        gapBefore: depth === 0 && rows.length > 0 ? ROW_GROUP_GAP : 0,
        rootId: currentRoot,
      });
      if (willExpand) walk(item.id, depth + 1, currentRoot);
    }
  }

  walk(null, 0, null);
  return rows;
}

function dataBoundsFromItems(items: GanttItem[]) {
  let from: string | undefined;
  let to: string | undefined;
  for (const item of items) {
    if (item.startDate) from = !from || item.startDate < from ? item.startDate : from;
    const end = item.effectiveEnd || item.endDate || item.startDate;
    if (end) to = !to || end > to ? end : to;
  }
  return { from, to };
}

function planBarVerticalMetrics(
  start: string,
  end: string,
  layout: TimelineLayout,
  opts?: { isVirtualEnd?: boolean },
): { top: number; height: number } {
  const { left, width } = ganttPlanBarMetrics(start, end, layout, opts);
  return { top: left, height: Math.max(width, 6) };
}

type GanttQueryData = { items: GanttItem[]; contributions: GanttContribution[] };

export function GanttMobileChart({ className }: { className?: string }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { preferences } = useSettings();
  const scrollRef = useRef<HTMLDivElement>(null);
  const savedScrollRef = useRef<{ top: number; left: number } | null>(null);
  const [scale, setScale] = useState<GanttScaleId>("month");
  const [anchor, setAnchor] = useState(todayStr);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [schedulePanelOpen, setSchedulePanelOpen] = useState(false);
  const [statusFilter] = useState(defaultGanttStatusFilter);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedContributionId, setSelectedContributionId] = useState<string | null>(null);
  const [headerScrollLeft, setHeaderScrollLeft] = useState(0);
  const [barPreview, setBarPreview] = useState<Map<string, { start: string; end: string }>>(
    () => new Map(),
  );

  const showContributionMarkers = preferences.ganttContributionMarkers.enabled;
  const actualLinePrefs = preferences.ganttActualLine;
  const showActualTimeline = actualLinePrefs.enabled;
  const todayColumnPrefs = preferences.ganttTodayColumn;
  const todayColumnBg = useMemo(
    () => ganttTodayColumnBackground(todayColumnPrefs),
    [todayColumnPrefs],
  );

  const fetchRange = useMemo(() => {
    const { from, to } = buildTimelineLayout(scale, anchor, null);
    return { from, to };
  }, [scale, anchor]);

  const ganttQueryKey = queryKeys.gantt.range(fetchRange.from, fetchRange.to);

  const { data: ganttData, isLoading, refetch: refetchGanttQuery } = useQuery({
    queryKey: ganttQueryKey,
    queryFn: async () => {
      const data = await apiJson<{ items?: GanttItem[]; contributions?: GanttContribution[] }>(
        `/api/gantt?from=${fetchRange.from}&to=${fetchRange.to}`,
      );
      return { items: data.items ?? [], contributions: data.contributions ?? [] };
    },
    placeholderData: keepPreviousData,
  });

  const items = useMemo(() => ganttData?.items ?? [], [ganttData?.items]);
  const contributions = useMemo(() => ganttData?.contributions ?? [], [ganttData?.contributions]);

  const updateGanttItems = useCallback(
    (updater: (prev: GanttItem[]) => GanttItem[]) => {
      queryClient.setQueryData<GanttQueryData>(ganttQueryKey, (old) => ({
        items: updater(old?.items ?? []),
        contributions: old?.contributions ?? [],
      }));
    },
    [ganttQueryKey, queryClient],
  );
  const planById = useMemo(() => new Map(items.map((p) => [p.id, p])), [items]);
  const getDisplayStatus = useCallback(
    (item: GanttItem) => itemDisplayStatus(item, items),
    [items],
  );
  const filteredPlans = useMemo(
    () => filterGanttTasksByStatus(items, statusFilter, getDisplayStatus, planById),
    [items, statusFilter, getDisplayStatus, planById],
  );
  const rows = useMemo(() => buildPlanTreeRows(filteredPlans, expanded), [filteredPlans, expanded]);
  const visibleRowIds = useMemo(() => new Set(rows.map((r) => r.item.id)), [rows]);

  const contributionBoundsByPlan = useMemo(() => {
    const map = new Map<string, { min?: string; max?: string }>();
    for (const id of items.map((p) => p.id)) {
      map.set(id, getPlanContributionBounds(id, contributions));
    }
    return map;
  }, [items, contributions]);

  const layout = useMemo(
    () => buildTimelineLayout(scale, anchor, dataBoundsFromItems(items)),
    [scale, anchor, items],
  );
  const weekSpans = useMemo(
    () => buildMobileSecondaryAxisSpans(layout, preferences.calendarWeekNumbers.format),
    [layout, preferences.calendarWeekNumbers.format],
  );
  const timelineHeight = layout.totalWidth;
  const gridWidth = useMemo(() => mobilePlanGridWidth(rows), [rows]);
  const today = todayStr();
  const todayBounds = getDateColumnBounds(today, layout);
  const todayY = todayBounds ? todayBounds.left + todayBounds.width / 2 : dateToX(today, layout);

  const bodyForkLineGroups = useMemo(() => {
    let left = 0;
    const columns: {
      itemId: string;
      parentId: string | null;
      left: number;
      width: number;
      barTop: number;
    }[] = [];

    for (const row of rows) {
      left += row.gapBefore;
      const width = mobilePlanColumnWidth(row.depth);
      if (!row.item.isUnscheduled && !row.item.contributionOnly) {
        const preview = barPreview.get(row.item.id);
        const start = preview?.start ?? row.item.startDate;
        const end = preview?.end ?? row.item.effectiveEnd;
        const { top: barTop } = planBarVerticalMetrics(start, end, layout, {
          isVirtualEnd: row.item.isVirtualEnd,
        });
        columns.push({
          itemId: row.item.id,
          parentId: row.item.parentId ?? null,
          left,
          width,
          barTop,
        });
      }
      left += width;
    }

    return buildMobilePlanBarForkLineGroups(columns);
  }, [rows, layout, barPreview]);

  const forkLineColorForParent = useCallback(
    (parentId: string) => {
      const parent = planById.get(parentId);
      if (!parent) return "#94a3b8";
      return resolvePlanTreeGroupColor(parent, planById);
    },
    [planById],
  );

  function renderPlanColumns(renderCell: (row: GanttRow) => ReactNode) {
    const nodes: ReactNode[] = [];
    for (const row of rows) {
      if (row.gapBefore > 0) {
        nodes.push(<div key={`gap-${row.item.id}`} className="shrink-0" style={{ width: row.gapBefore }} />);
      }
      nodes.push(renderCell(row));
    }
    return nodes;
  }

  const scrollToToday = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = Math.max(0, todayY - el.clientHeight / 2);
  }, [todayY]);

  useEffect(() => {
    if (isLoading) return;
    requestAnimationFrame(scrollToToday);
  }, [isLoading, scale, anchor, scrollToToday]);

  const goToday = useCallback(() => {
    setAnchor(todayStr());
    requestAnimationFrame(scrollToToday);
  }, [scrollToToday]);

  const navigatePrev = useCallback(() => {
    setAnchor((a) => shiftAnchor(scale, a, -1));
  }, [scale]);

  const navigateNext = useCallback(() => {
    setAnchor((a) => shiftAnchor(scale, a, 1));
  }, [scale]);

  function toggleExpand(planId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(planId)) next.delete(planId);
      else next.add(planId);
      return next;
    });
  }

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setHeaderScrollLeft(el.scrollLeft);
  }

  const detailDrawerOpen = selectedPlanId !== null || selectedContributionId !== null;

  function closeDetailDrawer() {
    setSelectedPlanId(null);
    setSelectedContributionId(null);
    const saved = savedScrollRef.current;
    if (saved && scrollRef.current) {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = saved.top;
          scrollRef.current.scrollLeft = saved.left;
          setHeaderScrollLeft(saved.left);
        }
      });
    }
    savedScrollRef.current = null;
  }

  function openPlan(planId: string) {
    const el = scrollRef.current;
    if (el) {
      savedScrollRef.current = { top: el.scrollTop, left: el.scrollLeft };
    }
    setSelectedContributionId(null);
    setSelectedPlanId(planId);
  }

  function openContribution(contributionId: string) {
    const el = scrollRef.current;
    if (el) {
      savedScrollRef.current = { top: el.scrollTop, left: el.scrollLeft };
    }
    setSelectedPlanId(null);
    setSelectedContributionId(contributionId);
  }

  function handleItemUpdated(
    updated: GanttItem,
    meta?: { shiftDescendants?: boolean; previousStart?: string; fromServer?: boolean },
  ) {
    const planPatch: GanttPlanPatch = {
      id: updated.id,
      startDate: updated.startDate,
      endDate: updated.endDate,
      actualStartDate: updated.actualStartDate,
      actualEndDate: updated.actualEndDate,
    };
    updateGanttItems((prev) => applyGanttPlanPatch(prev, planPatch, meta));
  }

  const handlePreviewDates = useCallback(
    (planId: string, preview: { start: string; end: string } | null, mode?: PlanDragMode) => {
      if (!preview) {
        setBarPreview(new Map());
        return;
      }
      const item = planById.get(planId);
      const rootId = item?.parentId
        ? rows.find((r) => r.item.id === planId)?.rootId ?? planId
        : planId;
      const root = planById.get(rootId);
      if (!root) {
        setBarPreview(new Map());
        return;
      }
      if (mode === "move") {
        setBarPreview(buildBoundGroupPreview(root, preview, items));
        return;
      }
      setBarPreview(new Map([[rootId, preview]]));
    },
    [items, planById, rows],
  );

  const clearBarPreview = useCallback(() => setBarPreview(new Map()), []);

  const dragEnabled = !detailDrawerOpen;

  function renderContributionMarkers(
    rowContributions: GanttContribution[],
    spanStart: string,
    spanEnd: string,
    rowPlanId: string,
    barCenter: number,
    barWidth: number,
  ) {
    const visible = rowContributions.filter((c) => {
      if (!isDateWithinPlanSpan(c.occurredOn, spanStart, spanEnd)) return false;
      const endOn = c.occurredEndOn ?? c.occurredOn;
      return isDateWithinPlanSpan(endOn, spanStart, spanEnd) || endOn > spanEnd;
    });

    if (visible.length === 0) return null;

    return (
      <>
        {visible.map((c) => {
          const color = resolveContributionMarkerColor(c, planById);
          const title = c.title;

          if (isContributionInterval(c)) {
            const { top, height } = planBarVerticalMetrics(c.occurredOn, c.occurredEndOn!, layout);
            return (
              <button
                key={`contrib-span-${rowPlanId}-${c.id}`}
                type="button"
                data-gantt-bar
                onClick={() => openContribution(c.id)}
                className="pointer-events-auto absolute z-10 rounded-full ring-1 ring-white/80 hover:brightness-110 dark:ring-gray-900/80"
                style={{
                  top: Math.max(0, top),
                  height: Math.max(height, 4),
                  left: barCenter,
                  width: Math.max(4, barWidth - 6),
                  transform: "translateX(-50%)",
                  ...contributionIntervalFillStyle(color),
                }}
                title={title}
                aria-label={t("gantt.contribution.interval", { title })}
              />
            );
          }

          const y = dateToX(c.occurredOn, layout);
          return (
            <button
              key={`contrib-point-${rowPlanId}-${c.id}`}
              type="button"
              data-gantt-bar
              onClick={() => openContribution(c.id)}
              className="pointer-events-auto absolute z-20 rounded-full hover:opacity-90"
              style={{
                top: Math.max(0, y - CONTRIBUTION_POINT_WIDTH_PX / 2),
                height: CONTRIBUTION_POINT_WIDTH_PX,
                width: CONTRIBUTION_POINT_WIDTH_PX,
                left: barCenter,
                transform: "translateX(-50%)",
                backgroundColor: color,
              }}
              title={title}
              aria-label={t("gantt.contribution.point", { title })}
            />
          );
        })}
      </>
    );
  }

  function renderActualLine(
    item: GanttItem,
    displayStart: string,
    displayEnd: string,
    barCenter: number,
  ) {
    if (!showActualTimeline || item.contributionOnly || item.isUnscheduled) return null;
    const span = getPlanActualExecutionSpan(item, items, nowPlanIso());
    if (!span) return null;

    const clipStart = span.from < displayStart ? displayStart : span.from;
    const clipEnd = span.to > displayEnd ? displayEnd : span.to;
    if (clipStart > clipEnd) return null;

    const { top, height } = planBarVerticalMetrics(clipStart, clipEnd, layout, {
      isVirtualEnd: item.isVirtualEnd,
    });

    return (
      <GanttActualExecutionLineVertical
        centerX={barCenter}
        top={Math.max(0, top)}
        height={Math.max(height, 4)}
        prefs={actualLinePrefs}
        endKind={span.endKind}
      />
    );
  }

  function renderPlanHeader() {
    return (
      <div className="relative flex min-h-0 shrink-0 border-b border-gray-100 dark:border-gray-800">
        <div
          className="flex shrink-0 items-center justify-center border-r border-gray-100 bg-blue-50/50 text-[10px] font-medium text-gray-500 dark:border-gray-800 dark:bg-blue-950/20 dark:text-gray-400"
          style={{ width: TIME_AXIS_WIDTH, height: HEADER_HEIGHT }}
        >
          {t("gantt.tasksHeader")}
        </div>
        <div className="relative min-w-0 flex-1 overflow-hidden">
          <div
            className="relative flex will-change-transform"
            style={{ transform: `translateX(-${headerScrollLeft}px)`, width: gridWidth }}
          >
            {renderPlanColumns((row) => {
              const childCount = filteredPlans.filter((p) => p.parentId === row.item.id).length;
              const hasChildren = childCount > 0 && row.depth < 2;
              const isExpanded = expanded.has(row.item.id);
              const columnWidth = mobilePlanColumnWidth(row.depth);
              return (
                <div
                  key={row.item.id}
                  className="flex shrink-0 items-center justify-center border-r border-gray-100 dark:border-gray-800"
                  style={{ width: columnWidth, height: HEADER_HEIGHT }}
                >
                  {hasChildren ? (
                    <button
                      type="button"
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-blue-500 hover:bg-blue-100/60 dark:text-blue-400 dark:hover:bg-blue-900/40"
                      onClick={() => toggleExpand(row.item.id)}
                      aria-label={isExpanded ? t("gantt.collapseRow") : t("gantt.expandRow")}
                    >
                      <GanttRowExpandIcon expanded={isExpanded} />
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  function renderGanttBody() {
    return (
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="scrollbar-hide min-h-0 flex-1 overflow-x-auto overflow-y-auto overscroll-contain"
      >
        <div
          className="flex"
          style={{ minHeight: timelineHeight, minWidth: TIME_AXIS_WIDTH + gridWidth }}
        >
          <div
            className="sticky left-0 z-30 flex shrink-0 border-r border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-950"
            style={{ width: TIME_AXIS_WIDTH }}
          >
            <div className="shrink-0 border-r border-gray-100 dark:border-gray-800" style={{ width: DAY_AXIS_WIDTH }}>
              {layout.columns.map((col) => (
                <div
                  key={`day-${col.key}`}
                  className="flex items-center justify-center border-b border-dashed border-gray-200 text-[9px] tabular-nums text-gray-600 dark:border-gray-700 dark:text-gray-400"
                  style={{ height: col.width, ...todayColumnBg }}
                >
                  {col.headerBottom}
                </div>
              ))}
            </div>
            <div className="shrink-0" style={{ width: WEEK_AXIS_WIDTH }}>
              {weekSpans.map((span) => (
                <div
                  key={span.key}
                  className="flex items-center justify-center border-b border-dashed border-gray-200 text-[8px] leading-none text-gray-500 dark:border-gray-700 dark:text-gray-400"
                  style={{ height: span.height }}
                >
                  <span className="[writing-mode:vertical-lr] [text-orientation:upright]">
                    {span.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            className="relative flex shrink-0 flex-row"
            style={{ width: gridWidth, minHeight: timelineHeight }}
          >
            {layout.columns.map((col, idx) => {
              const top = layout.columns.slice(0, idx).reduce((sum, c) => sum + c.width, 0);
              return (
                <div
                  key={`grid-${col.key}`}
                  className="pointer-events-none absolute left-0 right-0 z-0 border-b border-dashed border-gray-200 dark:border-gray-700"
                  style={{ top, height: col.width }}
                />
              );
            })}

            {today >= layout.from && today <= layout.to && (
              <div
                className="pointer-events-none absolute left-0 right-0 z-10 border-t-2 border-red-500/70"
                style={{ top: todayY }}
              />
            )}

            {bodyForkLineGroups.length > 0 && (
              <svg
                className="pointer-events-none absolute left-0 top-0 z-[4]"
                width={gridWidth}
                height={timelineHeight}
                aria-hidden
              >
                {bodyForkLineGroups.map((group) =>
                  group.lines.map((line, i) => (
                    <line
                      key={`fork-${group.parentId}-${i}`}
                      x1={line.x1}
                      y1={line.y1}
                      x2={line.x2}
                      y2={line.y2}
                      stroke={forkLineColorForParent(group.parentId)}
                      strokeWidth={1.5}
                      strokeLinecap="round"
                    />
                  )),
                )}
              </svg>
            )}

            {renderPlanColumns((row) => {
                const item = row.item;
                const columnWidth = mobilePlanColumnWidth(row.depth);
                const barWidth = mobilePlanBarWidthPx(row.depth);
                const barLeft = mobilePlanBarLeftPx(row.depth);
                const barCenter = mobilePlanBarCenterPx(row.depth);
                const previewDates = barPreview.get(item.id);
                const displayStart = previewDates?.start ?? item.startDate;
                const displayEnd = previewDates?.end ?? item.effectiveEnd;
                const metrics = planBarVerticalMetrics(displayStart, displayEnd, layout, {
                  isVirtualEnd: item.isVirtualEnd,
                });
                const barTop = metrics.top;
                const barHeight = metrics.height;
                const rootItem = planById.get(row.rootId) ?? item;
                const groupColor = resolveEffectivePlanColor(rootItem, rootItem);
                const parentPlan = item.parentId ? planById.get(item.parentId) : null;
                const parentPreview = parentPlan ? barPreview.get(parentPlan.id) : undefined;
                const minStartDate = parentPreview?.start ?? parentPlan?.startDate;
                const contribBounds = contributionBoundsByPlan.get(item.id);
                const rowContributions = showContributionMarkers
                  ? contributionsForGanttRow(
                      item.id,
                      contributions,
                      planById,
                      expanded,
                      visibleRowIds,
                    )
                  : [];

                return (
                  <div
                    key={item.id}
                    className="relative shrink-0 border-r border-gray-100 dark:border-gray-800"
                    style={{ width: columnWidth, minHeight: timelineHeight }}
                  >
                    {!item.isUnscheduled && !item.contributionOnly && (
                      <div
                        className="relative z-[22]"
                        style={{ marginLeft: barLeft, width: barWidth }}
                      >
                        <GanttMobileBarTitleTrack
                          barTop={barTop}
                          barHeight={barHeight}
                          barWidthPx={barWidth}
                          timelineHeight={timelineHeight}
                          title={item.title}
                          depth={row.depth}
                          planColor={groupColor}
                          onTitleClick={() => openPlan(item.id)}
                        />
                      </div>
                    )}

                    <div className="pointer-events-none absolute inset-0 z-[5]">
                      {!item.isUnscheduled && !item.contributionOnly && (
                        <>
                          <GanttMobileDraggableBar
                            item={item}
                            layout={layout}
                            top={barTop}
                            height={barHeight}
                            barWidthPx={barWidth}
                            barLeftPx={barLeft}
                            depth={row.depth}
                            color={groupColor}
                            previewOverride={previewDates ?? null}
                            minStartDate={row.depth > 0 ? minStartDate : undefined}
                            minContributionDate={contribBounds?.min}
                            maxContributionDate={contribBounds?.max}
                            onUpdated={handleItemUpdated}
                            onPreviewDates={handlePreviewDates}
                            onDragEnd={clearBarPreview}
                            onDragFailed={() => void refetchGanttQuery()}
                            onTaskClick={() => openPlan(item.id)}
                            dragEnabled={dragEnabled}
                          />
                          {renderActualLine(item, displayStart, displayEnd, barCenter)}
                        </>
                      )}
                      {showContributionMarkers &&
                        !item.isUnscheduled &&
                        !item.contributionOnly &&
                        renderContributionMarkers(
                          rowContributions,
                          displayStart,
                          displayEnd,
                          item.id,
                          barCenter,
                          barWidth,
                        )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    );
  }

  const detailPanel = selectedContributionId ? (
    <DrawerPanel onClose={closeDetailDrawer}>
      <GanttContributionDrawerPanel
        contributionId={selectedContributionId}
        onClose={closeDetailDrawer}
        onDeleted={closeDetailDrawer}
        onUpdated={closeDetailDrawer}
      />
    </DrawerPanel>
  ) : selectedPlanId ? (
    <DrawerPanel onClose={closeDetailDrawer}>
      <GanttPlanDrawerPanel
        planId={selectedPlanId}
        onClose={closeDetailDrawer}
        onPlanSaved={closeDetailDrawer}
      />
    </DrawerPanel>
  ) : null;

  if (isLoading && items.length === 0) {
    return <LoadingView label={t("gantt.loading")} />;
  }

  if (!isLoading && items.length === 0) {
    return <EmptyState title={t("gantt.emptyTitle")} description={t("gantt.emptyDescription")} />;
  }

  return (
    <div className={cn("flex h-full min-h-0 flex-col overflow-hidden bg-white dark:bg-gray-950", className)}>
      <div className="flex shrink-0 items-center gap-1 border-b border-gray-100 px-2 py-2 dark:border-gray-800">
        <button
          type="button"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-blue-600 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950/50"
          onClick={() => setSchedulePanelOpen((v) => !v)}
          title={
            schedulePanelOpen ? t("gantt.schedule.hideColumns") : t("gantt.columnPicker.aria")
          }
          aria-label={
            schedulePanelOpen ? t("gantt.schedule.hideColumns") : t("gantt.columnPicker.aria")
          }
          aria-expanded={schedulePanelOpen}
        >
          {schedulePanelOpen ? (
            <GanttPanelChevronDown className="text-blue-600 dark:text-blue-300" />
          ) : (
            <GanttPanelChevronUp className="text-blue-600 dark:text-blue-300" />
          )}
        </button>
        <GanttToolbarControls
          variant="mobile"
          scale={scale}
          onScaleChange={setScale}
          onPrev={navigatePrev}
          onNext={navigateNext}
          onToday={goToday}
          className="min-w-0 flex-1"
        />
      </div>

      {schedulePanelOpen && (
        <GanttMobileScheduleDrawer
          rows={rows}
          allPlans={items}
          scrollLeft={headerScrollLeft}
          timeAxisWidth={TIME_AXIS_WIDTH}
          gridWidth={gridWidth}
        />
      )}

      <CalendarMobileSplitLayout
        open={detailDrawerOpen}
        className="min-h-0 flex-1"
        calendar={
          <div className="flex h-full min-h-0 flex-col overflow-hidden">
            {renderPlanHeader()}
            {renderGanttBody()}
          </div>
        }
        sheet={detailPanel}
      />
    </div>
  );
}
