"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarPanelLive } from "@/components/home/calendar-panel-live";
import { FeedPanelLive } from "@/components/home/feed-panel-live";
import { GanttPanelLive } from "@/components/home/gantt-panel-live";
import { PanelResizeHandle } from "@/components/home/panel-resize-handle";

const STORAGE_FEED_WIDTH = "mylifeplan-home-feed-width";
const STORAGE_GANTT_HEIGHT = "mylifeplan-home-gantt-height";

const DEFAULT_FEED_WIDTH = 360;
const DEFAULT_GANTT_RATIO = 0.58;
const MIN_FEED_WIDTH = 260;
const MAX_FEED_WIDTH = 560;
const MIN_PANEL_HEIGHT = 140;

function readNumber(key: string): number | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function ResizableHomeLayout() {
  const rightColRef = useRef<HTMLDivElement>(null);
  const [feedWidth, setFeedWidth] = useState(DEFAULT_FEED_WIDTH);
  const [ganttHeight, setGanttHeight] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const w = readNumber(STORAGE_FEED_WIDTH);
    if (w !== null) setFeedWidth(w);
    const h = readNumber(STORAGE_GANTT_HEIGHT);
    if (h !== null) setGanttHeight(h);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const el = rightColRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      setGanttHeight((h) => {
        if (h === null) return h;
        const max = el.clientHeight - MIN_PANEL_HEIGHT - 12;
        return Math.min(Math.max(h, MIN_PANEL_HEIGHT), max);
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [hydrated]);

  const resolveGanttHeight = useCallback(() => {
    const el = rightColRef.current;
    if (!el) return 280;
    if (ganttHeight !== null) {
      return Math.min(
        Math.max(ganttHeight, MIN_PANEL_HEIGHT),
        el.clientHeight - MIN_PANEL_HEIGHT - 12,
      );
    }
    return Math.max(MIN_PANEL_HEIGHT, Math.round(el.clientHeight * DEFAULT_GANTT_RATIO));
  }, [ganttHeight]);

  function startFeedWidthDrag(e: React.MouseEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = feedWidth;
    let latest = startWidth;

    function onMove(ev: MouseEvent) {
      latest = Math.min(MAX_FEED_WIDTH, Math.max(MIN_FEED_WIDTH, startWidth + ev.clientX - startX));
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
      const max = col!.clientHeight - MIN_PANEL_HEIGHT - 12;
      latest = Math.min(max, Math.max(MIN_PANEL_HEIGHT, startHeight + ev.clientY - startY));
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
    <div className="flex min-h-0 flex-1 gap-0">
      <div className="min-h-0 shrink-0" style={{ width: feedWidth }}>
        <FeedPanelLive />
      </div>

      <PanelResizeHandle orientation="vertical" onMouseDown={startFeedWidthDrag} />

      <div ref={rightColRef} className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="min-h-0 shrink-0 overflow-hidden" style={{ height: ganttH }}>
          <GanttPanelLive />
        </div>

        <PanelResizeHandle orientation="horizontal" onMouseDown={startGanttHeightDrag} />

        <div className="min-h-0 flex-1 overflow-hidden">
          <CalendarPanelLive />
        </div>
      </div>
    </div>
  );
}
