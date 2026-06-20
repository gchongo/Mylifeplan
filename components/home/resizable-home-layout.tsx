"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarPanelLive } from "@/components/home/calendar-panel-live";
import { FeedPanelLive } from "@/components/home/feed-panel-live";
import { GanttPanelLive } from "@/components/home/gantt-panel-live";
import { PanelResizeHandle } from "@/components/home/panel-resize-handle";

const STORAGE_FEED_WIDTH = "mylifeplan-home-feed-width";
const STORAGE_GANTT_HEIGHT = "mylifeplan-home-gantt-height";

const RESIZE_HANDLE_SIZE = 12;

const DEFAULT_FEED_WIDTH = 360;
const DEFAULT_GANTT_RATIO = 0.58;

const MIN_FEED_WIDTH = 260;
const MAX_FEED_WIDTH = 560;
const MAX_FEED_WIDTH_RATIO = 0.45;

const MIN_GANTT_HEIGHT = 160;
const MIN_CALENDAR_HEIGHT = 180;
const MAX_GANTT_HEIGHT_RATIO = 0.72;

function readNumber(key: string): number | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function ResizableHomeLayout() {
  const layoutRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);
  const [feedWidth, setFeedWidth] = useState(DEFAULT_FEED_WIDTH);
  const [ganttHeight, setGanttHeight] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const clampFeedWidth = useCallback((width: number) => {
    const total = layoutRef.current?.clientWidth ?? 1200;
    const maxW = Math.min(MAX_FEED_WIDTH, Math.floor(total * MAX_FEED_WIDTH_RATIO));
    return Math.min(maxW, Math.max(MIN_FEED_WIDTH, width));
  }, []);

  const clampGanttHeight = useCallback(
    (height: number, colHeight?: number) => {
      const colH = colHeight ?? rightColRef.current?.clientHeight ?? 600;
      const maxByCalendar = colH - MIN_CALENDAR_HEIGHT - RESIZE_HANDLE_SIZE;
      const maxByRatio = Math.floor(colH * MAX_GANTT_HEIGHT_RATIO);
      const max = Math.min(maxByCalendar, maxByRatio);
      return Math.min(max, Math.max(MIN_GANTT_HEIGHT, height));
    },
    [],
  );

  useEffect(() => {
    const w = readNumber(STORAGE_FEED_WIDTH);
    const h = readNumber(STORAGE_GANTT_HEIGHT);
    if (w !== null) setFeedWidth(w);
    if (h !== null) setGanttHeight(h);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    setFeedWidth((w) => clampFeedWidth(w));
    setGanttHeight((h) => (h === null ? h : clampGanttHeight(h)));
  }, [hydrated, clampFeedWidth, clampGanttHeight]);

  useEffect(() => {
    if (!hydrated) return;
    const layout = layoutRef.current;
    const col = rightColRef.current;
    if (!layout || !col) return;

    const ro = new ResizeObserver(() => {
      setFeedWidth((w) => clampFeedWidth(w));
      setGanttHeight((h) => (h === null ? h : clampGanttHeight(h!, col.clientHeight)));
    });
    ro.observe(layout);
    ro.observe(col);
    return () => ro.disconnect();
  }, [hydrated, clampFeedWidth, clampGanttHeight]);

  const resolveGanttHeight = useCallback(() => {
    const col = rightColRef.current;
    if (!col) return 280;
    if (ganttHeight !== null) return clampGanttHeight(ganttHeight, col.clientHeight);
    return clampGanttHeight(Math.round(col.clientHeight * DEFAULT_GANTT_RATIO), col.clientHeight);
  }, [ganttHeight, clampGanttHeight]);

  function startFeedWidthDrag(e: React.MouseEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = feedWidth;
    let latest = startWidth;

    function onMove(ev: MouseEvent) {
      latest = clampFeedWidth(startWidth + ev.clientX - startX);
      setFeedWidth(latest);
    }

    function onUp() {
      localStorage.setItem(STORAGE_FEED_WIDTH, String(Math.round(latest)));
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function startGanttHeightDrag(e: React.MouseEvent) {
    e.preventDefault();
    const col = rightColRef.current;
    if (!col) return;

    const startY = e.clientY;
    const startHeight = resolveGanttHeight();
    let latest = startHeight;

    function onMove(ev: MouseEvent) {
      latest = clampGanttHeight(startHeight + ev.clientY - startY, col!.clientHeight);
      setGanttHeight(latest);
    }

    function onUp() {
      localStorage.setItem(STORAGE_GANTT_HEIGHT, String(Math.round(latest)));
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  const ganttH = hydrated ? resolveGanttHeight() : undefined;

  return (
    <div ref={layoutRef} className="flex min-h-0 flex-1">
      <div className="min-h-0 shrink-0 overflow-hidden" style={{ width: feedWidth }}>
        <FeedPanelLive />
      </div>

      <PanelResizeHandle orientation="vertical" onMouseDown={startFeedWidthDrag} />

      <div ref={rightColRef} className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 shrink-0 overflow-hidden" style={{ height: ganttH }}>
          <GanttPanelLive />
        </div>

        <PanelResizeHandle orientation="horizontal" onMouseDown={startGanttHeightDrag} />

        <div
          className="min-h-0 flex-1 overflow-hidden"
          style={{ minHeight: MIN_CALENDAR_HEIGHT }}
        >
          <CalendarPanelLive />
        </div>
      </div>
    </div>
  );
}
