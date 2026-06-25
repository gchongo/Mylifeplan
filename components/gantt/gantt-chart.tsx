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
  GANTT_STICKY_HEADER_CLASS,
  GANTT_TITLE_ROW_CLASS,
} from "@/lib/gantt-title-column";
import { GanttDrawerOpenTab, GanttTitleDrawerControls } from "@/components/gantt/gantt-title-drawer";
import {
  GanttTitlePanel,
  GanttTitleTableHeader,
  GanttScheduleColumnPanel,
  GanttScheduleColumnHeader,
  GanttScheduleDateRowBar,
  GANTT_SCHEDULE_DATE_ROW_CONTROLS_WIDTH,
} from "@/components/gantt/gantt-schedule-panel";
import { GanttContributionDrawerPanel } from "@/components/gantt/gantt-contribution-drawer";
import { GanttActualExecutionLine } from "@/components/gantt/gantt-actual-execution-line";
import { GanttDraggableBar } from "@/components/gantt/gantt-draggable-bar";
import { useSettings } from "@/components/settings/settings-provider";
import { buildTimelineSubheaderSpans } from "@/lib/gantt-timeline-subheader";
import { localizeTimelineSubheaderSpans } from "@/lib/i18n/timeline-helpers";
import { GanttPlanDrawerPanel } from "@/components/gantt/gantt-plan-drawer";
import { PlanContributionComposeModal } from "@/components/forms/plan-contribution-compose-modal";
import type { PlanContributionComposeMode } from "@/components/forms/plan-contribution-compose-form";
import { PlanStatusMenuButton } from "@/components/plans/plan-status-menu";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button, EmptyState, Loading as LoadingView } from "@/components/ui";
import { DrawerLayout } from "@/components/ui/drawer";
import {
  ganttPlanBarMetrics,
  barMetricsFromDates,
  buildTimelineLayout,
  dateToX,
  getDateColumnBounds,
  getExecutionFillSpanMetrics,
  getExecutionLineSpanMetrics,
  HOUR_WIDTH,
  isTodayInColumn,
  planDateOnly,
  scaleTimelineToViewport,
  shiftAnchor,
  todayStr,
  type GanttScaleId,
  type TimelineLayout,
} from "@/lib/gantt-scale";
import {
  ganttTodayColumnBackground,
  ganttTodayColumnLabelStyle,
} from "@/lib/gantt-today-column-style";
import { defaultGanttStatusFilter, filterGanttTasksByStatus } from "@/lib/gantt-task-filter";
import { rowOffsetTop } from "@/lib/gantt-plan-groups";
import {
  buildBoundGroupPreview,
  getPlanContributionBounds,
  isDateWithinPlanSpan,
} from "@/lib/gantt-plan-bind";
import { buildParentChildForkLines } from "@/lib/gantt-tree-lines";
import { contributionsForGanttRow } from "@/lib/gantt-contribution-display";
import { datePartOf, planLocalDatePart } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { isPlanOverdue, getActiveSubPlanOverrunTail, getParentRolledUpOverrunTail, type PlanOverrunTail } from "@/lib/gantt-plan-status";
import {
  getPlanActualExecutionFill,
  getPlanActualExecutionSpan,
  nowPlanIso,
  type PlanExecutionSpan,
} from "@/lib/gantt-actual-timeline";
import {
  CONTRIBUTION_POINT_WIDTH_PX,
  contributionIntervalFillStyle,
  contributionMarkerHeight,
  isContributionInterval,
  resolveContributionMarkerColor,
} from "@/lib/contribution-marker-style";
import {
  getStatusStyle,
  resolveVisualStatus,
  type VisualStatusKey,
} from "@/lib/task-status-style";
import {
  getGroupColoredBarAppearance,
  getPlanLabelAppearance,
  ganttPlanRowHeightPx,
  resolveEffectivePlanColor,
} from "@/lib/plan-color";
import { GRID_BORDER, GRID_ROW_BORDER } from "@/lib/gantt-grid-colors";
import { deriveParentStatus } from "@/lib/services/plan-rollup";
import type { GanttContribution, GanttItem, PlanStatus } from "@/types";
import { apiJson } from "@/lib/client-api";
import { dispatchPlanUpdated, PLAN_UPDATED_EVENT } from "@/lib/plan-events";
import type { PlanContributionComposeResult } from "@/components/forms/plan-contribution-compose-form";
import { patchGanttItemFromPlan, applyGanttPlanPatch, mergeGanttItem, serializedPlanToGanttItem, type GanttPlanPatch, type SerializedPlanForGantt } from "@/lib/gantt-plan-sync";
import {
  DEFAULT_VISIBLE_SCHEDULE_COLUMNS,
  GANTT_SCHEDULE_TABLE_HEADER_HEIGHT,
  GANTT_SCHEDULE_UNIFORM_COL_WIDTH,
  readStoredScheduleColumns,
  scheduleColumnIndexAtScroll,
  scheduleColumnsTotalWidth,
  scheduleScrollLeftForIndex,
  type GanttScheduleColumnId,
} from "@/lib/gantt-schedule-columns";
import {
  DEFAULT_SCHEDULE_VIEWPORT_COLS,
  DEFAULT_TITLE_WIDTH,
  MAX_SCHEDULE_VIEWPORT_COLS,
  MAX_TITLE_WIDTH,
  MIN_SCHEDULE_VIEWPORT_COLS,
  MIN_TITLE_WIDTH,
  readStoredScheduleVisible,
  readStoredScheduleViewportCols,
  readStoredTitleVisible,
  readStoredTitleWidth,
  scheduleWidthFromViewportCols,
  writeStoredScheduleVisible,
  writeStoredScheduleViewportCols,
  writeStoredTitleVisible,
  writeStoredTitleWidth,
} from "@/lib/gantt-panel-prefs";
const ROW_GROUP_GAP = 8;
const DRAWER_TRANSITION_MS = 300;
const TIMELINE_DATE_HEADER_HEIGHT = 28;
const TIMELINE_SUBHEADER_HEIGHT = GANTT_SCHEDULE_TABLE_HEADER_HEIGHT;

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

interface GanttRow {
  item: GanttItem;
  depth: number;
  height: number;
  gapBefore: number;
  rootId: string;
}

function computeRowsTotalHeight(rows: GanttRow[]) {
  return rows.reduce((sum, row) => sum + row.gapBefore + row.height, 0);
}

/** 同一计划树内（一级 + 全部子计划）行距一致：不在组内画分隔线 */
function rowTightBelow(row: GanttRow, next: GanttRow | undefined) {
  if (!next) return false;
  return next.rootId === row.rootId;
}

/** 各行底边 y（与时间轴行高累计一致，供背景虚线 / 组框对齐） */
function rowBoundaryOffsets(rows: GanttRow[]): number[] {
  const offsets: number[] = [];
  let y = 0;
  for (const row of rows) {
    y += row.gapBefore + row.height;
    offsets.push(y);
  }
  return offsets;
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

  for (const plan of plans) {
    if (plan.parentId) {
      if (!planIds.has(plan.parentId)) continue;
    }
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
        height: ganttPlanRowHeightPx(depth),
        gapBefore: depth === 0 && rows.length > 0 ? ROW_GROUP_GAP : 0,
        rootId: currentRoot,
      });

      if (willExpand) {
        walk(item.id, depth + 1, currentRoot);
      }
    }
  }

  walk(null, 0, null);
  return rows;
}

interface PlanModalState {
  open: boolean;
  defaultMode?: PlanContributionComposeMode;
  defaultParentPlanId?: string | null;
  defaultStartDate?: string | null;
  defaultEndDate?: string | null;
}


function planBarStyle(
  item: GanttItem,
  depth: number,
  groupColor: string,
  displayStatus: string,
  overdue: boolean,
) {
  const visual = resolveVisualStatus(item.status, item.endDate, displayStatus, overdue);
  const statusStyle = getStatusStyle(item.status, item.endDate, displayStatus, overdue);
  const muted = visual === "done" || visual === "archived";
  return getGroupColoredBarAppearance(groupColor, depth, statusStyle.dot, muted);
}

function dataBoundsFromItems(items: GanttItem[]) {
  if (items.length === 0) return null;
  let from = planLocalDatePart(items[0]!.startDate);
  let to = planLocalDatePart(items[0]!.effectiveEnd);
  for (const item of items) {
    const start = planLocalDatePart(item.startDate);
    const end = planLocalDatePart(item.effectiveEnd);
    if (start < from) from = start;
    if (end > to) to = end;
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
  const { t, locale } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const headerTimelineRef = useRef<HTMLDivElement>(null);
  const headerTimelineSubRef = useRef<HTMLDivElement>(null);
  const scrolledToToday = useRef(false);
  const scrollTarget = useRef<"today" | "anchor">("today");
  const panRef = useRef<{ startX: number; startScrollLeft: number } | null>(null);
  const pendingScrollLeft = useRef<number | null>(null);
  const ganttFetchSeq = useRef(0);
  const skipNextPlanSyncRef = useRef(false);
  const [isPanning, setIsPanning] = useState(false);

  const [planModal, setPlanModal] = useState<PlanModalState>({
    open: false,
  });

  const [internalScale, setInternalScale] = useState<GanttScaleId>("month");
  const scale = scaleProp ?? internalScale;
  const [anchor, setAnchor] = useState(todayStr);

  const [items, setItems] = useState<GanttItem[]>([]);
  const [contributions, setContributions] = useState<GanttContribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<Set<VisualStatusKey>>(defaultGanttStatusFilter);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedContributionId, setSelectedContributionId] = useState<string | null>(null);
  const [scrollViewportHeight, setScrollViewportHeight] = useState(480);
  const [timelineViewportWidth, setTimelineViewportWidth] = useState(0);
  const [titleWidth, setTitleWidth] = useState(DEFAULT_TITLE_WIDTH);
  const [scheduleViewportCols, setScheduleViewportCols] = useState(DEFAULT_SCHEDULE_VIEWPORT_COLS);
  const [titlePanelVisible, setTitlePanelVisible] = useState(true);
  const [schedulePanelVisible, setSchedulePanelVisible] = useState(true);
  const [scheduleColumns, setScheduleColumns] = useState<GanttScheduleColumnId[]>(
    DEFAULT_VISIBLE_SCHEDULE_COLUMNS,
  );
  const [scheduleScrollLeft, setScheduleScrollLeft] = useState(0);
  const [isResizingTitle, setIsResizingTitle] = useState(false);
  const [isResizingSchedule, setIsResizingSchedule] = useState(false);
  const [barPreview, setBarPreview] = useState<
    Map<string, { start: string; end: string }>
  >(() => new Map());
  const [hoveredRootId, setHoveredRootId] = useState<string | null>(null);

  const { preferences } = useSettings();
  const actualLinePrefs = preferences.ganttActualLine;
  const contributionMarkerPrefs = preferences.ganttContributionMarkers;
  const todayColumnPrefs = preferences.ganttTodayColumn;
  const showActualTimeline = actualLinePrefs.enabled;
  const showContributionMarkers = contributionMarkerPrefs.enabled;
  const todayColumnBg = useMemo(
    () => ganttTodayColumnBackground(todayColumnPrefs),
    [todayColumnPrefs],
  );
  const todayColumnLabel = useMemo(
    () => ganttTodayColumnLabelStyle(todayColumnPrefs),
    [todayColumnPrefs],
  );

  const scheduleViewportWidth = scheduleWidthFromViewportCols(scheduleViewportCols);
  const scheduleColumnsWidth = scheduleColumnsTotalWidth(scheduleColumns);
  const scheduleWidth = Math.min(scheduleViewportWidth, scheduleColumnsWidth);
  const effectiveTitleWidth = titlePanelVisible ? titleWidth : 0;
  const effectiveScheduleWidth = schedulePanelVisible ? scheduleWidth : 0;
  const effectiveLeftWidth = effectiveTitleWidth + effectiveScheduleWidth;
  const leftSubheaderVisible = titlePanelVisible || schedulePanelVisible;
  const timelineHeaderHeight = TIMELINE_DATE_HEADER_HEIGHT + TIMELINE_SUBHEADER_HEIGHT;
  const scheduleMaxScrollIndex = Math.max(0, scheduleColumns.length - scheduleViewportCols);
  const scheduleScrollIndex = scheduleColumnIndexAtScroll(scheduleScrollLeft);
  const canScheduleScrollPrev = scheduleScrollIndex > 0;
  const canScheduleScrollNext = scheduleScrollIndex < scheduleMaxScrollIndex;
  const scheduleMaxScroll = scheduleScrollLeftForIndex(scheduleMaxScrollIndex);

  useEffect(() => {
    setTitleWidth(readStoredTitleWidth());
    setScheduleViewportCols(readStoredScheduleViewportCols());
    setTitlePanelVisible(readStoredTitleVisible());
    setSchedulePanelVisible(readStoredScheduleVisible());
    setScheduleColumns(readStoredScheduleColumns());
  }, []);

  useEffect(() => {
    if (!titlePanelVisible && schedulePanelVisible) {
      setSchedulePanelVisible(false);
      writeStoredScheduleVisible(false);
    }
  }, [titlePanelVisible, schedulePanelVisible]);

  useEffect(() => {
    setScheduleScrollLeft((prev) => Math.min(prev, scheduleMaxScroll));
  }, [scheduleMaxScroll, scheduleColumns, scheduleViewportCols]);

  useEffect(() => {
    onTitleColumnLayout?.({
      width: effectiveLeftWidth,
      visible: titlePanelVisible || schedulePanelVisible,
      collapsedWidth: GANTT_DRAWER_TOGGLE_WIDTH,
    });
  }, [effectiveLeftWidth, titlePanelVisible, schedulePanelVisible, onTitleColumnLayout]);

  const dataBounds = useMemo(() => dataBoundsFromItems(items), [items]);

  const fetchRange = useMemo(() => {
    const { from, to } = buildTimelineLayout(scale, anchor, null);
    return { from, to };
  }, [scale, anchor]);

  const layout: TimelineLayout = useMemo(() => {
    const base = buildTimelineLayout(scale, anchor, dataBounds);
    if (scale === "5year" && timelineViewportWidth > 0) {
      return scaleTimelineToViewport(base, timelineViewportWidth);
    }
    return base;
  }, [scale, anchor, dataBounds, timelineViewportWidth]);

  const timelineSubheaderSpans = useMemo(
    () =>
      localizeTimelineSubheaderSpans(
        buildTimelineSubheaderSpans(layout, preferences.calendarWeekNumbers.format),
        locale,
        t,
      ),
    [layout, preferences.calendarWeekNumbers.format, locale, t],
  );

  const { from, to } = layout;
  const timelineWidth = layout.totalWidth;
  const today = todayStr();
  const todayColumnBounds = useMemo(
    () => getDateColumnBounds(today, layout),
    [today, layout],
  );
  const todayX = todayColumnBounds
    ? todayColumnBounds.left + todayColumnBounds.width / 2
    : dateToX(today, layout);
  const todayVisible = today >= layout.from && today <= layout.to;

  useEffect(() => {
    const seq = ++ganttFetchSeq.current;
    setIsLoading(true);
    apiJson<{ items?: GanttItem[]; contributions?: GanttContribution[] }>(
      `/api/gantt?from=${fetchRange.from}&to=${fetchRange.to}`,
    )
      .then((data) => {
        if (seq !== ganttFetchSeq.current) return;
        setItems(data.items ?? []);
        setContributions(data.contributions ?? []);
      })
      .catch(() => {
        if (seq !== ganttFetchSeq.current) return;
        setItems([]);
        setContributions([]);
      })
      .finally(() => {
        if (seq !== ganttFetchSeq.current) return;
        setIsLoading(false);
      });
  }, [fetchRange.from, fetchRange.to]);

  const applyPlanPatch = useCallback((plan: GanttPlanPatch) => {
    setItems((prev) =>
      prev.map((item) => (item.id === plan.id ? patchGanttItemFromPlan(item, plan) : item)),
    );
  }, []);

  const refetchGantt = useCallback(async () => {
    const seq = ++ganttFetchSeq.current;
    try {
      const data = await apiJson<{ items?: GanttItem[]; contributions?: GanttContribution[] }>(
        `/api/gantt?from=${fetchRange.from}&to=${fetchRange.to}`,
      );
      if (seq !== ganttFetchSeq.current) return;
      setItems(data.items ?? []);
      setContributions(data.contributions ?? []);
    } catch {
      // Keep optimistic local state when background refresh fails.
    }
  }, [fetchRange.from, fetchRange.to]);

  const planById = useMemo(() => new Map(items.map((p) => [p.id, p])), [items]);

  const getDisplayStatus = useCallback(
    (item: GanttItem) => itemDisplayStatus(item, items),
    [items],
  );

  const filteredPlans = useMemo(
    () => filterGanttTasksByStatus(items, statusFilter, getDisplayStatus, planById),
    [items, statusFilter, getDisplayStatus, planById],
  );

  const rows = useMemo(
    () => buildPlanTreeRows(filteredPlans, expanded),
    [filteredPlans, expanded],
  );

  const visibleRowIds = useMemo(() => new Set(rows.map((r) => r.item.id)), [rows]);

  const forkLines = useMemo(() => {
    const layouts = rows.map((row, idx) => {
      const preview = barPreview.get(row.item.id);
      const start = preview?.start ?? row.item.startDate;
      const end = preview?.end ?? row.item.effectiveEnd;
      const { left } = ganttPlanBarMetrics(start, end, layout, {
        isVirtualEnd: row.item.isVirtualEnd,
      });
      return {
        itemId: row.item.id,
        depth: row.depth,
        parentId: row.item.parentId ?? null,
        top: rowOffsetTop(rows, idx) + row.gapBefore,
        height: row.height,
        barLeft: left,
      };
    });
    return buildParentChildForkLines(layouts);
  }, [rows, layout, barPreview]);

  const contributionBoundsByPlan = useMemo(() => {
    const map = new Map<string, { min?: string; max?: string }>();
    const planIds = new Set(items.map((p) => p.id));
    for (const id of planIds) {
      map.set(id, getPlanContributionBounds(id, contributions));
    }
    return map;
  }, [items, contributions]);

  const hideTitlePanel = useCallback(() => {
    setTitlePanelVisible(false);
    setSchedulePanelVisible(false);
    writeStoredTitleVisible(false);
    writeStoredScheduleVisible(false);
  }, []);

  const hideSchedulePanel = useCallback(() => {
    setSchedulePanelVisible(false);
    writeStoredScheduleVisible(false);
    setScheduleScrollLeft(0);
  }, []);

  const openSchedulePanel = useCallback(() => {
    if (!titlePanelVisible) return;
    setSchedulePanelVisible(true);
    writeStoredScheduleVisible(true);
  }, [titlePanelVisible]);

  const openLeftPanels = useCallback(() => {
    setTitlePanelVisible(true);
    setSchedulePanelVisible(true);
    writeStoredTitleVisible(true);
    writeStoredScheduleVisible(true);
  }, []);

  const scrollScheduleColumns = useCallback((delta: -1 | 1) => {
    setScheduleScrollLeft((prev) => {
      const currentIdx = scheduleColumnIndexAtScroll(prev);
      const nextIdx = Math.max(0, Math.min(scheduleMaxScrollIndex, currentIdx + delta));
      return scheduleScrollLeftForIndex(nextIdx);
    });
  }, [scheduleMaxScrollIndex]);

  const setScheduleViewportColsSnapped = useCallback((cols: number) => {
    const next = Math.min(
      MAX_SCHEDULE_VIEWPORT_COLS,
      Math.max(MIN_SCHEDULE_VIEWPORT_COLS, cols),
    );
    setScheduleViewportCols(next);
    writeStoredScheduleViewportCols(next);
  }, []);

  const startTitleResize = useCallback((clientX: number) => {
    const startX = clientX;
    const startWidth = titleWidth;
    setIsResizingTitle(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    function onMove(e: MouseEvent) {
      const next = Math.min(
        MAX_TITLE_WIDTH,
        Math.max(MIN_TITLE_WIDTH, startWidth + (e.clientX - startX)),
      );
      setTitleWidth(next);
    }

    function onUp(e: MouseEvent) {
      const next = Math.min(
        MAX_TITLE_WIDTH,
        Math.max(MIN_TITLE_WIDTH, startWidth + (e.clientX - startX)),
      );
      setTitleWidth(next);
      writeStoredTitleWidth(next);
      setIsResizingTitle(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [titleWidth]);

  const startScheduleResize = useCallback((clientX: number) => {
    const startX = clientX;
    const startCols = scheduleViewportCols;
    setIsResizingSchedule(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    function onMove(e: MouseEvent) {
      const deltaCols = Math.round((e.clientX - startX) / GANTT_SCHEDULE_UNIFORM_COL_WIDTH);
      const next = Math.min(
        MAX_SCHEDULE_VIEWPORT_COLS,
        Math.max(MIN_SCHEDULE_VIEWPORT_COLS, startCols + deltaCols),
      );
      setScheduleViewportCols(next);
    }

    function onUp(e: MouseEvent) {
      const deltaCols = Math.round((e.clientX - startX) / GANTT_SCHEDULE_UNIFORM_COL_WIDTH);
      const next = Math.min(
        MAX_SCHEDULE_VIEWPORT_COLS,
        Math.max(MIN_SCHEDULE_VIEWPORT_COLS, startCols + deltaCols),
      );
      setScheduleViewportColsSnapped(next);
      setIsResizingSchedule(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [scheduleViewportCols, setScheduleViewportColsSnapped]);

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
  const rowsBodyHeight = computeRowsTotalHeight(rows);
  const bodyAreaHeight = Math.max(rowsBodyHeight, scrollViewportHeight);

  const refetchGanttStable = useCallback(() => {
    void refetchGantt();
  }, [refetchGantt]);

  useEffect(() => {
    function onPlanUpdated() {
      if (skipNextPlanSyncRef.current) {
        skipNextPlanSyncRef.current = false;
        return;
      }
      void refetchGantt();
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
      const w = Math.floor(container.clientWidth - effectiveLeftWidth);
      setTimelineViewportWidth((prev) => (Math.abs(prev - w) > 4 ? w : prev));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(container);
    return () => ro.disconnect();
  }, [isLoading, fullPage, effectiveLeftWidth]);

  const syncTimelineHeaderScroll = useCallback(() => {
    const left = scrollRef.current?.scrollLeft ?? 0;
    const transform = `translateX(-${left}px)`;
    if (headerTimelineRef.current) {
      headerTimelineRef.current.style.transform = transform;
    }
    if (headerTimelineSubRef.current) {
      headerTimelineSubRef.current.style.transform = transform;
    }
  }, []);

  const scrollToToday = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !todayVisible) return false;
    const offset = effectiveLeftWidth + todayX - el.clientWidth / 2;
    el.scrollLeft = Math.max(0, offset);
    syncTimelineHeaderScroll();
    return true;
  }, [todayVisible, todayX, effectiveLeftWidth, syncTimelineHeaderScroll]);

  const scrollToAnchor = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return false;
    const anchorX = dateToX(anchor, layout);
    const offset = effectiveLeftWidth + anchorX - el.clientWidth / 2;
    el.scrollLeft = Math.max(0, offset);
    syncTimelineHeaderScroll();
    return true;
  }, [anchor, layout, effectiveLeftWidth, syncTimelineHeaderScroll]);

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
    syncTimelineHeaderScroll();
  }, [drawerOpen, selectedContributionId, selectedPlanId, syncTimelineHeaderScroll]);

  useLayoutEffect(() => {
    syncTimelineHeaderScroll();
  }, [syncTimelineHeaderScroll, timelineWidth, titleWidth, scheduleViewportCols, titlePanelVisible, schedulePanelVisible, rows.length]);

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

  function handleItemUpdated(
    updated: GanttItem,
    meta?: { shiftDescendants?: boolean; previousStart?: string; fromServer?: boolean },
  ) {
    skipNextPlanSyncRef.current = true;
    const planPatch: GanttPlanPatch = {
      id: updated.id,
      startDate: updated.startDate,
      endDate: updated.endDate,
      actualStartDate: updated.actualStartDate,
      actualEndDate: updated.actualEndDate,
    };
    setItems((prev) => applyGanttPlanPatch(prev, planPatch, meta));
  }

  function handleScheduleFieldSaved(plan?: GanttPlanPatch) {
    if (plan) {
      skipNextPlanSyncRef.current = true;
      applyPlanPatch(plan);
    }
    dispatchPlanUpdated();
  }

  function handlePlanStatusChanged(planId: string, apiStatus: PlanStatus) {
    skipNextPlanSyncRef.current = true;
    setItems((prev) =>
      prev.map((i) => (i.id === planId ? { ...i, status: apiStatus } : i)),
    );
    dispatchPlanUpdated();
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

  function openCreatePlan(
    parentPlanId?: string | null,
    defaultStartDate?: string | null,
    defaultMode: PlanContributionComposeMode = "plan",
  ) {
    setPlanModal({
      open: true,
      defaultMode,
      defaultParentPlanId: parentPlanId ?? null,
      defaultStartDate: defaultStartDate ?? null,
    });
  }

  function handlePlanComposeSuccess(result?: PlanContributionComposeResult) {
    skipNextPlanSyncRef.current = true;
    if (result?.kind === "plan") {
      const ganttItem = serializedPlanToGanttItem(result.plan as SerializedPlanForGantt);
      if (ganttItem) {
        setItems((prev) => {
          const next = mergeGanttItem(prev, ganttItem);
          if (ganttItem.parentId) {
            setExpanded((expanded) => {
              const ancestors = new Set(expanded);
              let cur: string | null = ganttItem.parentId ?? null;
              const byId = new Map(next.map((item) => [item.id, item]));
              while (cur) {
                ancestors.add(cur);
                cur = byId.get(cur)?.parentId ?? null;
              }
              return ancestors;
            });
          }
          return next;
        });
        return;
      }
    }
    if (result?.kind === "contribution") {
      void refetchGantt();
    }
  }

  function closePlanModal() {
    setPlanModal((prev) => ({ ...prev, open: false }));
  }

  function handlePanStart(e: React.MouseEvent) {
    if (e.button !== 0) return;
    if (isResizingTitle || isResizingSchedule) return;
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

  function todayColumnCellStyle(isToday: boolean): React.CSSProperties | undefined {
    if (!isToday || !todayColumnPrefs.enabled) return undefined;
    return todayColumnBg;
  }

  function renderTimelineDateCells() {
    return (
      <div
        className="flex bg-white text-xs dark:bg-gray-950"
        style={{ width: timelineWidth, height: TIMELINE_DATE_HEADER_HEIGHT, minHeight: TIMELINE_DATE_HEADER_HEIGHT }}
      >
        {layout.columns.map((col) => {
          const isToday = isTodayInColumn(today, col);
          const todayStyle = todayColumnCellStyle(isToday);
          return (
            <div
              key={col.key}
              className={cn(
                "py-1 text-center",
                GRID_BORDER,
                !todayStyle && cn(
                  "bg-white dark:bg-gray-950",
                  col.isWeekend && "bg-gray-50 dark:bg-gray-900/70",
                ),
              )}
              style={{ width: col.width, ...todayStyle }}
            >
              {isToday && (scale === "week" || scale === "month") ? (
                <span
                  className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-gray-200 px-1 text-[10px] font-semibold text-gray-800 dark:bg-gray-700 dark:text-gray-100"
                  style={todayColumnLabel}
                >
                  {col.headerBottom}
                </span>
              ) : (
                <span
                  className={cn(
                    "text-gray-600 dark:text-gray-300",
                    isToday && !todayColumnLabel && "font-semibold text-red-600 dark:text-red-400",
                    isToday && todayColumnLabel && "font-semibold",
                  )}
                  style={isToday ? todayColumnLabel : undefined}
                >
                  {scale === "day" ? formatHourLabel(parseInt(col.headerBottom, 10)) : col.headerBottom}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  function renderTimelineSubheaderCells() {
    return (
      <div
        className="flex bg-blue-50/50 text-[11px] text-gray-700 dark:bg-blue-950/30 dark:text-gray-200"
        style={{
          width: timelineWidth,
          height: TIMELINE_SUBHEADER_HEIGHT,
          minHeight: TIMELINE_SUBHEADER_HEIGHT,
        }}
      >
        {timelineSubheaderSpans.map((span, index) => (
          <div
            key={`${span.key}-${index}`}
            className="box-border flex shrink-0 items-center justify-center border-r-2 border-solid border-gray-300 dark:border-gray-600"
            style={{ width: span.width }}
          >
            <span className="w-full text-center font-medium leading-none">{span.label}</span>
          </div>
        ))}
      </div>
    );
  }

  function renderGridBackground(height: number) {
    const rowLines = rowBoundaryOffsets(rows);
    return (
      <div
        className="pointer-events-none absolute left-0 top-0 flex"
        style={{ width: timelineWidth, height }}
      >
        {layout.columns.map((col) => {
          const isToday = isTodayInColumn(today, col);
          const todayStyle = todayColumnCellStyle(isToday);
          return (
            <div
              key={col.key}
              className={cn(
                "h-full",
                GRID_BORDER,
                !todayStyle && cn(
                  "bg-white dark:bg-gray-950",
                  col.isWeekend && "bg-gray-50 dark:bg-gray-900/70",
                  col.isOtherMonth && "opacity-80",
                ),
              )}
              style={{ width: col.width, ...todayStyle }}
            />
          );
        })}
        {rowLines.map((top, i) => (
          <div
            key={`row-grid-${i}`}
            className={cn("absolute left-0", GRID_ROW_BORDER)}
            style={{ top, width: timelineWidth }}
          />
        ))}
      </div>
    );
  }

  function renderPlanTitleCell(
    row: GanttRow,
    idx: number,
    opts?: { compact?: boolean },
  ) {
    const item = row.item;
    const nextRow = rows[idx + 1];
    const tightBelow = rowTightBelow(row, nextRow);
    const childCount = filteredPlans.filter((p) => p.parentId === item.id).length;
    const showToggle = childCount > 0;
    const canAddChild = planDepth(item.id, planById) < 2;
    const isExpanded = expanded.has(item.id);
    const displayStatus = itemDisplayStatus(item, items);
    const hasRollup = itemHasRollup(item, items);
    const rootItem = planById.get(row.rootId) ?? item;
    const groupColor = resolveEffectivePlanColor(rootItem, rootItem);
    const labelStyle = getPlanLabelAppearance(groupColor);
    const isSelected = selectedPlanId === item.id;
    const compact = opts?.compact ?? false;

    return (
      <div
        className={cn(
          "group flex h-full items-center gap-0.5 overflow-hidden px-1 transition-colors duration-300 ease-out motion-reduce:transition-none",
          labelStyle.stripeClass,
          labelStyle.bgClass,
          isSelected && "bg-brand-50/70 ring-1 ring-inset ring-brand-400/35 dark:bg-brand-950/25 dark:ring-brand-500/30",
          !tightBelow && !compact && GANTT_TITLE_ROW_CLASS,
        )}
        style={{
          paddingLeft: 4 + row.depth * 14,
          ...labelStyle.bgStyle,
          ...labelStyle.stripeStyle,
        }}
      >
        {showToggle ? (
          <button
            type="button"
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-blue-400 hover:bg-blue-200/40 dark:text-blue-300 dark:hover:bg-blue-900/40"
            onClick={() => toggleExpand(item.id)}
            aria-label={isExpanded ? t("gantt.collapseRow") : t("gantt.expandRow")}
          >
            <span className={cn("text-[10px] transition-transform", isExpanded && "rotate-90")}>
              ▶
            </span>
          </button>
        ) : (
          <span className="h-5 w-5 shrink-0" aria-hidden />
        )}
        <button
          type="button"
          onClick={() => openPlan(item.id)}
          className={cn(
            "min-w-0 flex-1 truncate text-left hover:text-blue-700 dark:hover:text-blue-200",
            row.depth === 0
              ? "text-xs font-semibold text-slate-900 dark:text-slate-50"
              : "text-xs font-normal text-slate-600 dark:text-slate-300",
          )}
          title={item.title}
        >
          {item.title}
          {item.isUnscheduled && (
            <span className="ml-1 text-[9px] font-normal text-violet-600 dark:text-violet-400">
              {t("gantt.unscheduled")}
            </span>
          )}
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
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-sm leading-none text-blue-600",
              "opacity-0 transition-opacity hover:bg-blue-200/60 group-hover:opacity-100",
              "dark:text-blue-300 dark:hover:bg-blue-900/50",
            )}
            title={t("gantt.addPlanOrContribution")}
            aria-label={t("gantt.addPlanOrContribution")}
          >
            +
          </button>
        )}
        {item.status && (
          <PlanStatusMenuButton
            planId={item.id}
            status={item.status}
            overdue={isPlanOverdue(item, planById)}
            isUnscheduled={item.isUnscheduled}
            displayStatus={displayStatus}
            hasRollup={hasRollup}
            onStatusChanged={(apiStatus) => handlePlanStatusChanged(item.id, apiStatus)}
          />
        )}
      </div>
    );
  }

  function renderPlanOverrunTail(tail: PlanOverrunTail, barHeightPx: number, rowHeight: number) {
    const { left, width } = barMetricsFromDates(tail.from, tail.to, layout);
    const top = (rowHeight - barHeightPx) / 2;
    return (
      <div
        className="pointer-events-none absolute z-[4] rounded-r-full bg-red-400/55 dark:bg-red-500/50"
        style={{
          left,
          width: Math.max(width, 4),
          top,
          height: barHeightPx,
        }}
        aria-hidden
      />
    );
  }

  function renderExecutionFillTail(
    tail: PlanExecutionSpan,
    barHeightPx: number,
    rowHeight: number,
    tone: "green" | "red",
    isVirtualPlanEnd: boolean,
  ) {
    const isGreen = tone === "green";
    const snapToday =
      tail.endKind === "open" || planDateOnly(tail.to) === today ? today : undefined;
    const { left, width } = getExecutionFillSpanMetrics(tail.from, tail.to, layout, {
      snapEndToToday: snapToday,
      fromEndpoint: isGreen ? "actual" : "plan",
      toEndpoint: isGreen ? "plan" : "actual",
      isVirtualPlanEnd,
    });
    const top = (rowHeight - barHeightPx) / 2;
    return (
      <div
        className={cn(
          "pointer-events-none absolute z-[4] rounded-r-full",
          tone === "green"
            ? "bg-emerald-400/50 dark:bg-emerald-500/45"
            : "bg-red-400/55 dark:bg-red-500/50",
        )}
        style={{
          left,
          width: Math.max(width, 4),
          top,
          height: barHeightPx,
        }}
        aria-hidden
      />
    );
  }

  function renderContributionMarkers(
    rowContributions: GanttContribution[],
    spanStart: string,
    spanEnd: string,
    rowPlanId: string,
    barHeightPx: number,
    rowHeight: number,
  ) {
    const visible = rowContributions.filter((c) => {
      if (!isDateWithinPlanSpan(c.occurredOn, spanStart, spanEnd)) return false;
      const endOn = c.occurredEndOn ?? c.occurredOn;
      return isDateWithinPlanSpan(endOn, spanStart, spanEnd) || endOn > spanEnd;
    });

    if (visible.length === 0) return null;

    const markerHeight = contributionMarkerHeight(barHeightPx);
    const markerTop = (rowHeight - markerHeight) / 2;

    return (
      <>
        {visible.map((c) => {
          const color = resolveContributionMarkerColor(c, planById);
          const title = c.title;

          if (isContributionInterval(c)) {
            const end = c.occurredEndOn!;
            const { left, width } = barMetricsFromDates(c.occurredOn, end, layout);
            return (
              <button
                key={`contrib-span-${rowPlanId}-${c.id}`}
                type="button"
                data-gantt-bar
                onClick={() => openContribution(c.id)}
                className="pointer-events-auto absolute z-10 rounded-full ring-1 ring-white/80 hover:brightness-110 dark:ring-gray-900/80"
                style={{
                  left: Math.max(0, left),
                  width: Math.max(width, 4),
                  top: markerTop,
                  height: markerHeight,
                  ...contributionIntervalFillStyle(color),
                }}
                title={title}
                aria-label={t("gantt.contribution.interval", { title })}
              />
            );
          }

          const x = dateToX(c.occurredOn, layout);
          return (
            <button
              key={`contrib-point-${rowPlanId}-${c.id}`}
              type="button"
              data-gantt-bar
              onClick={() => openContribution(c.id)}
              className="pointer-events-auto absolute z-20 -translate-x-1/2 rounded-full hover:opacity-90"
              style={{
                left: Math.max(0, x),
                width: CONTRIBUTION_POINT_WIDTH_PX,
                top: markerTop,
                height: markerHeight,
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

  function renderContributionLayer() {
    if (!showContributionMarkers) return null;

    return (
      <div
        className="pointer-events-none absolute left-0 top-0 z-[4]"
        style={{ width: timelineWidth, minHeight: bodyAreaHeight }}
      >
        {rows.map((row, idx) => {
          const item = row.item;
          let markers: ReturnType<typeof renderContributionMarkers> = null;

          if (!item.isUnscheduled && !item.contributionOnly) {
            const previewDates = barPreview.get(item.id);
            const displayStart = previewDates?.start ?? item.startDate;
            const displayEnd = previewDates?.end ?? item.effectiveEnd;
            const rootItem = planById.get(row.rootId) ?? item;
            const groupColor = resolveEffectivePlanColor(rootItem, rootItem);
            const displayStatus = itemDisplayStatus(item, items);
            const overdue = isPlanOverdue(item, planById);
            const barStyle = planBarStyle(item, row.depth, groupColor, displayStatus, overdue);
            const rowContributions = contributionsForGanttRow(
              item.id,
              contributions,
              planById,
              expanded,
              visibleRowIds,
            );
            markers = renderContributionMarkers(
              rowContributions,
              displayStart,
              displayEnd,
              item.id,
              barStyle.barHeightPx,
              row.height,
            );
          }

          return (
            <div
              key={`contrib-layer-${item.id}-${idx}`}
              className="relative"
              style={{ height: row.height, marginTop: row.gapBefore, width: timelineWidth }}
            >
              {markers}
            </div>
          );
        })}
      </div>
    );
  }

  const onRootDragPreview = useCallback(
    (
      rootId: string,
      preview: { start: string; end: string } | null,
      mode?: "move" | "resize-start" | "resize-end",
    ) => {
      if (!preview) {
        setBarPreview(new Map());
        return;
      }
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
    [items, planById],
  );

  const clearBarPreview = useCallback(() => setBarPreview(new Map()), []);

  function renderTreeForkLines() {
    if (forkLines.length === 0) return null;
    return (
      <svg
        className="pointer-events-none absolute left-0 top-0 z-[1]"
        width={timelineWidth}
        height={bodyAreaHeight}
        aria-hidden
      >
        {forkLines.map((line, i) => (
          <line
            key={`fork-${i}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="currentColor"
            strokeWidth={1.5}
            className="text-slate-300 dark:text-slate-600"
          />
        ))}
      </svg>
    );
  }

  function renderBar(row: GanttRow, idx: number) {
    const item = row.item;
    const rootItem = planById.get(row.rootId) ?? item;
    const groupColor = resolveEffectivePlanColor(rootItem, rootItem);
    const previewDates = barPreview.get(item.id);
    const displayStart = previewDates?.start ?? item.startDate;
    const displayEnd = previewDates?.end ?? item.effectiveEnd;
    const { left, width } = ganttPlanBarMetrics(displayStart, displayEnd, layout, {
      isVirtualEnd: item.isVirtualEnd,
    });
    const displayStatus = itemDisplayStatus(item, items);
    const overdue = isPlanOverdue(item, planById);
    const barStyle = planBarStyle(item, row.depth, groupColor, displayStatus, overdue);
    const actualNowIso = nowPlanIso();
    const actualExecutionFill =
      showActualTimeline && !item.contributionOnly
        ? getPlanActualExecutionFill(item, items, actualNowIso)
        : { green: null, red: null };
    const executionSpan =
      showActualTimeline && !item.contributionOnly
        ? getPlanActualExecutionSpan(item, items, actualNowIso)
        : null;
    const activeOverrunTail =
      !showActualTimeline ? getActiveSubPlanOverrunTail(item, planById) : null;
    const parentOverrunTail =
      !showActualTimeline && !activeOverrunTail && !item.contributionOnly
        ? getParentRolledUpOverrunTail(item, items)
        : null;
    const shellWidth =
      activeOverrunTail != null
        ? ganttPlanBarMetrics(displayStart, activeOverrunTail.from, layout, {
            isVirtualEnd: item.isVirtualEnd,
          }).width
        : undefined;
    const isRootWithChildren =
      row.depth === 0 &&
      expanded.has(item.id) &&
      filteredPlans.some((p) => p.parentId === item.id);
    const showGroupTitles = hoveredRootId === row.rootId;
    const isSelected = selectedPlanId === item.id;

    if (item.isUnscheduled) {
      const anchorLeft = ganttPlanBarMetrics(displayStart, displayEnd, layout, {
        isVirtualEnd: item.isVirtualEnd,
      }).left;
      return (
        <div
          key={`bar-${item.id}-${idx}`}
          className="relative"
          style={{ height: row.height, marginTop: row.gapBefore, width: timelineWidth }}
          onMouseEnter={() => setHoveredRootId(row.rootId)}
        >
          <button
            type="button"
            data-gantt-bar
            onClick={() => openPlan(item.id)}
            className={cn(
              "absolute top-1/2 z-10 flex -translate-y-1/2 items-center gap-1 overflow-hidden rounded-full border border-dashed px-2 py-0.5 text-xs transition-[box-shadow,filter] duration-300 ease-out motion-reduce:transition-none",
              isSelected
                ? "border-violet-500/80 bg-violet-100 text-violet-800 ring-2 ring-brand-500/45 ring-offset-1 shadow-sm brightness-[1.06] dark:border-violet-400/80 dark:bg-violet-900/50 dark:text-violet-200"
                : "border-violet-400 bg-violet-50/80 text-violet-700 hover:bg-violet-100 dark:border-violet-500/70 dark:bg-violet-950/40 dark:text-violet-300",
            )}
            style={{ left: Math.max(anchorLeft, 8), height: barStyle.barHeightPx }}
            title={t("gantt.noTimeSet")}
          >
            <span className="h-2 w-2 shrink-0 rounded-full bg-violet-400 ring-1 ring-white" aria-hidden />
            <span
              className={cn(
                "truncate transition-[opacity,transform,max-width] duration-300 ease-out motion-reduce:transition-none",
                showGroupTitles
                  ? "max-w-[8rem] translate-x-0 opacity-100"
                  : "max-w-0 translate-x-1 opacity-0",
              )}
              aria-hidden={!showGroupTitles}
            >
              {t("gantt.unscheduled")}
            </span>
          </button>
        </div>
      );
    }

    const parentPlan = item.parentId ? planById.get(item.parentId) : null;
    const parentPreview = parentPlan ? barPreview.get(parentPlan.id) : undefined;
    const minStartDate = parentPreview?.start ?? parentPlan?.startDate;
    const contribBounds = contributionBoundsByPlan.get(item.id);

    return (
      <div
        key={`bar-${item.id}-${idx}`}
        className="relative"
        style={{ height: row.height, marginTop: row.gapBefore, width: timelineWidth }}
        onMouseEnter={() => setHoveredRootId(row.rootId)}
      >
        {!item.contributionOnly && actualExecutionFill.red &&
          renderExecutionFillTail(actualExecutionFill.red, barStyle.barHeightPx, row.height, "red", item.isVirtualEnd)}
        {!item.contributionOnly && actualExecutionFill.green &&
          renderExecutionFillTail(actualExecutionFill.green, barStyle.barHeightPx, row.height, "green", item.isVirtualEnd)}
        {!item.contributionOnly && activeOverrunTail &&
          renderPlanOverrunTail(activeOverrunTail, barStyle.barHeightPx, row.height)}
        {!item.contributionOnly && parentOverrunTail &&
          renderPlanOverrunTail(parentOverrunTail, barStyle.barHeightPx, row.height)}
        {!item.contributionOnly && executionSpan && (() => {
          const lineMetrics = getExecutionLineSpanMetrics(
            executionSpan.from,
            executionSpan.to,
            layout,
            executionSpan.endKind === "open"
              ? { endKind: "open", snapEndToToday: today }
              : { endKind: "fixed" },
          );
          return (
            <GanttActualExecutionLine
              left={lineMetrics.left}
              width={lineMetrics.width}
              top={(row.height - barStyle.barHeightPx) / 2}
              height={barStyle.barHeightPx}
              prefs={actualLinePrefs}
              endKind={executionSpan.endKind}
            />
          );
        })()}
        {!item.contributionOnly && (
          <GanttDraggableBar
            item={item}
            layout={layout}
            left={left}
            width={width}
            shellWidth={shellWidth}
            barShell={barStyle.shellClass}
            barShellStyle={barStyle.shellStyle}
            barText={barStyle.textClass}
            barTextStyle={barStyle.textStyle}
            barHeightPx={barStyle.barHeightPx}
            statusDotClass={barStyle.statusDotClass}
            showTitle={showGroupTitles}
            isSelected={isSelected}
            hitRowHeight={row.height}
            minStartDate={row.depth > 0 ? minStartDate : undefined}
            minContributionDate={contribBounds?.min}
            maxContributionDate={contribBounds?.max}
            previewOverride={previewDates ?? null}
            onPreviewDates={isRootWithChildren ? onRootDragPreview : undefined}
            isVirtualEnd={item.isVirtualEnd}
            onDragEnd={clearBarPreview}
            onDragFailed={() => void refetchGantt()}
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
      </div>
    );
  }

  function renderDrawerPanel() {
    if (selectedContributionId) {
      return (
        <GanttContributionDrawerPanel
          contributionId={selectedContributionId}
          onClose={closeContributionDrawer}
          onDeleted={refetchGanttStable}
          onUpdated={refetchGanttStable}
        />
      );
    }
    if (selectedPlanId) {
      return (
        <GanttPlanDrawerPanel
          planId={selectedPlanId}
          onClose={closePlanDrawer}
          onPlanChange={setSelectedPlanId}
        />
      );
    }
    return null;
  }

  function handleTimelineBackgroundClick(e: React.MouseEvent) {
    if (!drawerOpen) return;
    const target = e.target as HTMLElement;
    if (target.closest("[data-gantt-bar]")) return;
    if (target.closest("button, a, input, textarea, select, [data-no-pan]")) return;
    closeDrawer();
  }

  function renderLabelHeaderControls() {
    return (
      <GanttTitleDrawerControls
        allExpanded={allSubplansExpanded}
        onToggleExpandAll={toggleExpandAll}
        showExpandToggle={expandablePlanIds.length > 0}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onToggleTitlePanel={hideTitlePanel}
        onCreatePlan={() => openCreatePlan()}
      />
    );
  }

  const isResizingPanels = isResizingTitle || isResizingSchedule;

  const scheduleHeaderSpacerWidth = Math.max(
    0,
    scheduleWidth - GANTT_SCHEDULE_DATE_ROW_CONTROLS_WIDTH,
  );

  function renderPanelResizeHandle(
    left: number,
    ariaLabel: string,
    onStart: (clientX: number) => void,
    active: boolean,
  ) {
    return (
      <div
        data-no-pan
        role="separator"
        aria-orientation="vertical"
        aria-label={ariaLabel}
        className={cn(
          "absolute z-40 w-2 -translate-x-1/2 cursor-col-resize touch-none select-none",
          "hover:bg-blue-400/20",
          active && "bg-blue-500/25",
        )}
        style={{
          left,
          top: -timelineHeaderHeight,
          height: `calc(100% + ${timelineHeaderHeight}px)`,
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onStart(e.clientX);
        }}
      />
    );
  }

  function renderFixedHeaderRow() {
    return (
      <div
        className={cn(
          GANTT_STICKY_HEADER_CLASS,
          "relative flex shrink-0 flex-col overflow-visible",
        )}
      >
        <GanttDrawerOpenTab
          headerHeight={timelineHeaderHeight}
          visible={!titlePanelVisible}
          onOpen={openLeftPanels}
          title={t("gantt.showPlanList")}
        />
        <GanttDrawerOpenTab
          headerHeight={TIMELINE_DATE_HEADER_HEIGHT}
          left={effectiveTitleWidth}
          visible={titlePanelVisible && !schedulePanelVisible}
          onOpen={openSchedulePanel}
          title={t("gantt.showScheduleColumns")}
        />

        <div
          className="relative flex shrink-0 overflow-visible"
          style={{ height: TIMELINE_DATE_HEADER_HEIGHT, minHeight: TIMELINE_DATE_HEADER_HEIGHT }}
        >
          <div
            className={cn(
              "shrink-0 overflow-visible border-r border-blue-200/80 dark:border-blue-900/50",
              !isResizingPanels && "transition-[width] duration-300 ease-in-out",
            )}
            style={{
              width: effectiveTitleWidth,
              transitionDuration: isResizingPanels ? "0ms" : `${DRAWER_TRANSITION_MS}ms`,
            }}
          >
            {titlePanelVisible && (
              <div
                className="flex items-center overflow-visible bg-blue-50/80 dark:bg-blue-950/40"
                style={{ width: titleWidth, height: TIMELINE_DATE_HEADER_HEIGHT }}
              >
                {renderLabelHeaderControls()}
              </div>
            )}
          </div>

          {titlePanelVisible && schedulePanelVisible && (
            <>
              <GanttScheduleDateRowBar
                canScrollPrev={canScheduleScrollPrev}
                canScrollNext={canScheduleScrollNext}
                onScrollPrev={() => scrollScheduleColumns(-1)}
                onScrollNext={() => scrollScheduleColumns(1)}
                onHidePanel={hideSchedulePanel}
              />
              <div
                className={cn(
                  "shrink-0 border-r border-blue-200/60 bg-white dark:border-blue-900/40 dark:bg-gray-950",
                  !isResizingPanels && "transition-[width] duration-300 ease-in-out",
                )}
                style={{
                  width: scheduleHeaderSpacerWidth,
                  transitionDuration: isResizingPanels ? "0ms" : `${DRAWER_TRANSITION_MS}ms`,
                }}
                aria-hidden
              />
            </>
          )}

          <div className="relative min-w-0 flex-1 overflow-hidden bg-white dark:bg-gray-950">
            <div ref={headerTimelineRef} className="relative will-change-transform" style={{ width: timelineWidth }}>
              {renderTimelineDateCells()}
            </div>
          </div>
        </div>

        <div
          className="flex shrink-0 overflow-visible"
          style={{ height: TIMELINE_SUBHEADER_HEIGHT, minHeight: TIMELINE_SUBHEADER_HEIGHT }}
        >
          {leftSubheaderVisible && (
            <>
              <div
                className={cn(
                  "shrink-0 overflow-visible border-r border-blue-200/80 dark:border-blue-900/50",
                  !isResizingPanels && "transition-[width] duration-300 ease-in-out",
                )}
                style={{
                  width: effectiveTitleWidth,
                  transitionDuration: isResizingPanels ? "0ms" : `${DRAWER_TRANSITION_MS}ms`,
                }}
              >
                {titlePanelVisible && <GanttTitleTableHeader width={titleWidth} />}
              </div>

              <div
                className={cn(
                  "shrink-0 overflow-visible border-r border-blue-200/80 dark:border-blue-900/50",
                  !isResizingPanels && "transition-[width] duration-300 ease-in-out",
                )}
                style={{
                  width: effectiveScheduleWidth,
                  transitionDuration: isResizingPanels ? "0ms" : `${DRAWER_TRANSITION_MS}ms`,
                }}
              >
                {schedulePanelVisible && (
                  <GanttScheduleColumnHeader
                    width={scheduleWidth}
                    visibleColumns={scheduleColumns}
                    scrollLeft={scheduleScrollLeft}
                  />
                )}
              </div>
            </>
          )}

          <div className="relative min-w-0 flex-1 overflow-hidden border-b border-gray-100 bg-blue-50/40 dark:border-gray-800 dark:bg-blue-950/20">
            <div
              ref={headerTimelineSubRef}
              className="relative will-change-transform"
              style={{ width: timelineWidth }}
            >
              {renderTimelineSubheaderCells()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderScrollBody() {
    const mappedRows = rows.map((row, idx) => ({
      key: `label-${row.item.id}-${idx}`,
      height: row.height,
      gapBefore: row.gapBefore,
      tightBelow: rowTightBelow(row, rows[idx + 1]),
      item: row.item,
    }));

    return (
      <div className="relative min-h-0 flex-1">
        {titlePanelVisible && schedulePanelVisible &&
          renderPanelResizeHandle(
            effectiveTitleWidth,
            t("gantt.resizeTitleColumn"),
            startTitleResize,
            isResizingTitle,
          )}
        {schedulePanelVisible &&
          renderPanelResizeHandle(
            effectiveLeftWidth,
            t("gantt.resizeScheduleColumn"),
            startScheduleResize,
            isResizingSchedule,
          )}
        {titlePanelVisible && !schedulePanelVisible &&
          renderPanelResizeHandle(
            effectiveTitleWidth,
            t("gantt.resizeTitleColumn"),
            startTitleResize,
            isResizingTitle,
          )}

        <div
          ref={scrollRef}
          onScroll={syncTimelineHeaderScroll}
          onMouseDown={handlePanStart}
          className={cn(
            "h-full min-h-0 w-full max-w-full min-w-0 overflow-x-auto overflow-y-auto",
            isResizingPanels && "cursor-col-resize select-none",
            isPanning ? "cursor-grabbing select-none" : !isResizingPanels && "cursor-grab",
          )}
        >
          <div className="relative flex min-h-0 w-max">
            <div
              className={cn(
                "sticky left-0 z-20 shrink-0 overflow-hidden",
                !isResizingPanels && "transition-[width] duration-300 ease-in-out",
              )}
              style={{
                width: effectiveTitleWidth,
                transitionDuration: isResizingPanels ? "0ms" : `${DRAWER_TRANSITION_MS}ms`,
              }}
            >
              {titlePanelVisible && (
                <GanttTitlePanel
                  width={titleWidth}
                  bodyHeight={bodyAreaHeight}
                  rows={mappedRows}
                  renderTitleCell={(_row, idx) => renderPlanTitleCell(rows[idx]!, idx, { compact: true })}
                />
              )}
            </div>

            <div
              className={cn(
                "sticky z-20 shrink-0 overflow-hidden",
                !isResizingPanels && "transition-[width] duration-300 ease-in-out",
              )}
              style={{
                left: effectiveTitleWidth,
                width: effectiveScheduleWidth,
                transitionDuration: isResizingPanels ? "0ms" : `${DRAWER_TRANSITION_MS}ms`,
              }}
            >
              {schedulePanelVisible && (
                <GanttScheduleColumnPanel
                  width={scheduleWidth}
                  bodyHeight={bodyAreaHeight}
                  visibleColumns={scheduleColumns}
                  scrollLeft={scheduleScrollLeft}
                  rows={mappedRows}
                  allPlans={items}
                  onPlanFieldUpdated={handleScheduleFieldSaved}
                />
              )}
            </div>

            <div className="flex shrink-0 flex-col">
              <div
                className="relative"
                style={{ minHeight: bodyAreaHeight }}
                onClick={handleTimelineBackgroundClick}
                onMouseLeave={() => setHoveredRootId(null)}
              >
                {renderGridBackground(bodyAreaHeight)}
                {renderTreeForkLines()}

                {rows.map((row, idx) => (
                  <div key={`row-${idx}`} className="relative z-[2]">
                    {renderBar(row, idx)}
                  </div>
                ))}
                {renderContributionLayer()}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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
      <PlanContributionComposeModal
        open={planModal.open}
        onClose={closePlanModal}
        title={
          planModal.defaultParentPlanId
            ? t("gantt.addPlanOrContribution")
            : t("gantt.newPlanOrContribution")
        }
        defaultMode={planModal.defaultMode}
        fixedParentPlanId={planModal.defaultParentPlanId}
        fixedPlanId={planModal.defaultParentPlanId}
        defaultStartAt={planModal.defaultStartDate}
        defaultEndAt={planModal.defaultEndDate}
        onSuccess={handlePlanComposeSuccess}
      />
    );
  }

  if (isLoading) {
    return (
      <>
        {wrapWithDrawers(
          <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <LoadingView label={t("gantt.loading")} />
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
              title={t("gantt.emptyTitle")}
              description={t("gantt.emptyDescription")}
            />
            {fullPage && (
              <div className="px-4 pb-4">
                <Button type="button" onClick={() => openCreatePlan()}>
                  {t("gantt.newPlanOrContributionButton")}
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
      <div
        ref={containerRef}
        className={cn(
          "flex h-full min-h-0 w-full max-w-full min-w-0 flex-1 flex-col",
          "rounded-none border-0 bg-transparent shadow-none",
        )}
      >
        {renderFixedHeaderRow()}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <DrawerLayout open={drawerOpen} onClose={closeDrawer} panel={renderDrawerPanel()}>
            {renderScrollBody()}
          </DrawerLayout>
        </div>
      </div>

      {renderPlanModal()}
    </>
  );
});
