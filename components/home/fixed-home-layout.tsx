"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CalendarPanelLive,
  FeedPanelLive,
  SummaryPanelLive,
} from "@/components/home/home-panels-dynamic";
import { PanelResizeHandle } from "@/components/home/panel-resize-handle";
import { readStorageItem, writeStorageItem } from "@/lib/app-storage";
import { PanelSkeleton } from "@/components/ui/panel-skeleton";

const STORAGE_FEED_WIDTH = "meridian-home-feed-width";

const RESIZE_HANDLE_SIZE = 12;

const DEFAULT_FEED_WIDTH = 320;

const MIN_FEED_WIDTH = 240;
const MAX_FEED_WIDTH = 480;
const MAX_FEED_WIDTH_RATIO = 0.38;
const MIN_RIGHT_COLUMN_WIDTH = 380;

function readNumber(key: string): number | null {
  if (typeof window === "undefined") return null;
  const raw = readStorageItem(key);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function FixedHomeLayout() {
  const layoutRef = useRef<HTMLDivElement>(null);
  const [feedWidth, setFeedWidth] = useState(DEFAULT_FEED_WIDTH);
  const [hydrated, setHydrated] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const maxFeedWidthFor = useCallback((totalWidth: number) => {
    const byRatio = Math.floor(totalWidth * MAX_FEED_WIDTH_RATIO);
    const byRight = totalWidth - MIN_RIGHT_COLUMN_WIDTH - RESIZE_HANDLE_SIZE;
    return Math.min(MAX_FEED_WIDTH, byRatio, byRight);
  }, []);

  const clampFeedWidth = useCallback(
    (width: number) => {
      const total = layoutRef.current?.clientWidth ?? 1200;
      const maxW = maxFeedWidthFor(total);
      return Math.min(maxW, Math.max(MIN_FEED_WIDTH, width));
    },
    [maxFeedWidthFor],
  );

  useEffect(() => {
    const w = readNumber(STORAGE_FEED_WIDTH);
    if (w !== null) setFeedWidth(w);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(() => setShowCalendar(true));
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(() => setShowCalendar(true), 120);
    return () => window.clearTimeout(id);
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    setFeedWidth((w) => clampFeedWidth(w));
  }, [hydrated, clampFeedWidth]);

  useEffect(() => {
    if (!hydrated) return;
    const layout = layoutRef.current;
    if (!layout) return;

    const ro = new ResizeObserver(() => {
      setFeedWidth((w) => clampFeedWidth(w));
    });
    ro.observe(layout);
    return () => ro.disconnect();
  }, [hydrated, clampFeedWidth]);

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
      writeStorageItem(STORAGE_FEED_WIDTH, String(Math.round(latest)));
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  return (
    <div
      ref={layoutRef}
      className="flex h-full min-h-0 w-full min-w-0 max-w-full flex-1 overflow-hidden"
    >
      <div
        className="h-full min-h-0 min-w-0 shrink-0 overflow-hidden"
        style={{ width: feedWidth, maxWidth: "100%" }}
      >
        <FeedPanelLive />
      </div>

      <PanelResizeHandle orientation="vertical" onMouseDown={startFeedWidthDrag} />

      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 min-w-0 shrink-0 overflow-hidden">
          <SummaryPanelLive />
        </div>

        <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
          {showCalendar ? (
            <CalendarPanelLive />
          ) : (
            <PanelSkeleton className="h-full min-h-[280px]" />
          )}
        </div>
      </div>
    </div>
  );
}
