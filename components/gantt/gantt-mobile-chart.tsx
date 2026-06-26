"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { GanttToolbarControls } from "@/components/gantt/gantt-toolbar-controls";
import { GanttMobileDraggableBar } from "@/components/gantt/gantt-mobile-draggable-bar";
import { GanttPlanDrawerPanel } from "@/components/gantt/gantt-plan-drawer";
import { GanttContributionDrawerPanel } from "@/components/gantt/gantt-contribution-drawer";
import { DrawerLayout, DrawerPanel } from "@/components/ui/drawer";
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
import { contributionsForGanttRow } from "@/lib/gantt-contribution-display";
import { defaultGanttStatusFilter, filterGanttTasksByStatus } from "@/lib/gantt-task-filter";
import {
  buildBoundGroupPreview,
  getPlanContributionBounds,
  isDateWithinPlanSpan,
} from "@/lib/gantt-plan-bind";
import {
  applyGanttPlanPatch,
  patchGanttItemFromPlan,
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
import {
  ganttTodayColumnBackground,
} from "@/lib/gantt-today-column-style";
import type { PlanDragMode } from "@/lib/gantt-plan-drag";
import { normalizePlanColor } from "@/lib/plan-color";
import { queryKeys } from "@/lib/query/keys";
import type { GanttContribution, GanttItem } from "@/types";
import { cn } from "@/lib/utils";

const TIME_AXIS_WIDTH = 52;
const PLAN_COLUMN_WIDTH = 108;
const HEADER_HEIGHT = 44;
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
  const [scale, setScale] = useState<GanttScaleId>("month");
  const [anchor, setAnchor] = useState(todayStr);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [statusFilter] = useState(defaultGanttStatusFilter);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedContributionId, setSelectedContributionId] = useState<string | null>(null);
  const [headerScrollLeft, setHeaderScrollLeft] = useState(0);
  const [barPreview, setBarPreview] = useState<Map<string, { start: string; end: string }>>(
    () => new Map(),
  );

  const showContributionMarkers = preferences.ganttContributionMarkers.enabled;
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
  const timelineHeight = layout.totalWidth;
  const gridWidth = rows.length * PLAN_COLUMN_WIDTH;
  const today = todayStr();
  const todayBounds = getDateColumnBounds(today, layout);
  const todayY = todayBounds ? todayBounds.left + todayBounds.width / 2 : dateToX(today, layout);

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

  const drawerOpen = selectedPlanId !== null || selectedContributionId !== null;

  function closeDrawer() {
    setSelectedPlanId(null);
    setSelectedContributionId(null);
  }

  function openPlan(planId: string) {
    setSelectedContributionId(null);
    setSelectedPlanId(planId);
  }

  function openContribution(contributionId: string) {
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

  function renderContributionMarkers(
    rowContributions: GanttContribution[],
    spanStart: string,
    spanEnd: string,
    rowPlanId: string,
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
                className="pointer-events-auto absolute inset-x-1 z-10 rounded-full ring-1 ring-white/80 hover:brightness-110 dark:ring-gray-900/80"
                style={{
                  top: Math.max(0, top),
                  height: Math.max(height, 4),
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
              className="pointer-events-auto absolute inset-x-2 z-20 rounded-full hover:opacity-90"
              style={{
                top: Math.max(0, y - CONTRIBUTION_POINT_WIDTH_PX / 2),
                height: CONTRIBUTION_POINT_WIDTH_PX,
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

  if (isLoading && items.length === 0) {
    return <LoadingView label={t("gantt.loading")} />;
  }

  if (!isLoading && items.length === 0) {
    return <EmptyState title={t("gantt.emptyTitle")} description={t("gantt.emptyDescription")} />;
  }

  return (
    <DrawerLayout
      open={drawerOpen}
      onClose={closeDrawer}
      placement="bottom"
      panel={
        selectedContributionId ? (
          <DrawerPanel onClose={closeDrawer}>
            <GanttContributionDrawerPanel
              contributionId={selectedContributionId}
              onClose={closeDrawer}
              onDeleted={closeDrawer}
              onUpdated={closeDrawer}
            />
          </DrawerPanel>
        ) : (
          <DrawerPanel onClose={closeDrawer}>
            <GanttPlanDrawerPanel
              planId={selectedPlanId!}
              onClose={closeDrawer}
              onPlanSaved={closeDrawer}
            />
          </DrawerPanel>
        )
      }
    >
      <div className={cn("flex h-full min-h-0 flex-col overflow-hidden bg-white dark:bg-gray-950", className)}>
        <div className="shrink-0 border-b border-gray-100 px-2 py-2 dark:border-gray-800">
          <GanttToolbarControls
            scale={scale}
            onScaleChange={setScale}
            onPrev={navigatePrev}
            onNext={navigateNext}
            onToday={goToday}
            className="flex-wrap gap-1"
          />
        </div>

        <div className="flex min-h-0 shrink-0 border-b border-gray-100 dark:border-gray-800">
          <div
            className="shrink-0 border-r border-gray-100 bg-blue-50/50 dark:border-gray-800 dark:bg-blue-950/20"
            style={{ width: TIME_AXIS_WIDTH, height: HEADER_HEIGHT }}
          />
          <div className="min-w-0 flex-1 overflow-hidden">
            <div
              className="flex will-change-transform"
              style={{ transform: `translateX(-${headerScrollLeft}px)`, width: gridWidth }}
            >
              {rows.map((row) => {
                const hasChildren = items.some((p) => p.parentId === row.item.id);
                return (
                  <div
                    key={row.item.id}
                    className="flex shrink-0 items-center gap-0.5 border-r border-gray-100 px-1 dark:border-gray-800"
                    style={{ width: PLAN_COLUMN_WIDTH, height: HEADER_HEIGHT }}
                  >
                    {hasChildren && (
                      <button
                        type="button"
                        className="shrink-0 text-[10px] text-gray-500"
                        onClick={() => toggleExpand(row.item.id)}
                        aria-label={expanded.has(row.item.id) ? "collapse" : "expand"}
                      >
                        {expanded.has(row.item.id) ? "▼" : "▶"}
                      </button>
                    )}
                    <button
                      type="button"
                      className="min-w-0 flex-1 truncate text-left text-[11px] font-medium text-gray-800 dark:text-gray-100"
                      style={{ paddingLeft: row.depth * 6 }}
                      onClick={() => setSelectedPlanId(row.item.id)}
                    >
                      {row.item.title}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="scrollbar-hide min-h-0 flex-1 overflow-auto"
        >
          <div className="flex" style={{ minHeight: timelineHeight }}>
            <div
              className="sticky left-0 z-20 shrink-0 border-r border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-950"
              style={{ width: TIME_AXIS_WIDTH }}
            >
              {layout.columns.map((col) => (
                <div
                  key={col.key}
                  className="border-b border-dashed border-gray-200 px-1 text-[9px] leading-tight text-gray-500 dark:border-gray-700 dark:text-gray-400"
                  style={{ height: col.width, ...todayColumnBg }}
                >
                  {col.headerBottom}
                </div>
              ))}
            </div>

            <div className="relative shrink-0" style={{ width: gridWidth, height: timelineHeight }}>
              {layout.columns.map((col, idx) => {
                const top = layout.columns
                  .slice(0, idx)
                  .reduce((sum, c) => sum + c.width, 0);
                return (
                  <div
                    key={`grid-${col.key}`}
                    className="pointer-events-none absolute left-0 right-0 border-b border-dashed border-gray-200 dark:border-gray-700"
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

              <div className="absolute inset-0 flex">
                {rows.map((row) => {
                  const item = row.item;
                  const previewDates = barPreview.get(item.id);
                  const displayStart = previewDates?.start ?? item.startDate;
                  const displayEnd = previewDates?.end ?? item.effectiveEnd;
                  const metrics = planBarVerticalMetrics(displayStart, displayEnd, layout, {
                    isVirtualEnd: item.isVirtualEnd,
                  });
                  const color = normalizePlanColor(item.color);
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
                      style={{ width: PLAN_COLUMN_WIDTH }}
                    >
                      {!item.isUnscheduled && !item.contributionOnly && (
                        <GanttMobileDraggableBar
                          item={item}
                          layout={layout}
                          top={metrics.top}
                          height={metrics.height}
                          color={color}
                          previewOverride={previewDates ?? null}
                          minStartDate={row.depth > 0 ? minStartDate : undefined}
                          minContributionDate={contribBounds?.min}
                          maxContributionDate={contribBounds?.max}
                          onUpdated={handleItemUpdated}
                          onPreviewDates={handlePreviewDates}
                          onDragEnd={clearBarPreview}
                          onDragFailed={() => void refetchGanttQuery()}
                          onTaskClick={() => openPlan(item.id)}
                        />
                      )}
                      {showContributionMarkers &&
                        !item.isUnscheduled &&
                        !item.contributionOnly &&
                        renderContributionMarkers(
                          rowContributions,
                          displayStart,
                          displayEnd,
                          item.id,
                        )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DrawerLayout>
  );
}
