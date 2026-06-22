"use client";

import type { GanttActualLinePreferences } from "@/lib/user-preferences";
import { ganttActualLineStrokeDasharray } from "@/lib/gantt-actual-line-style";

export function GanttActualExecutionLine({
  left,
  width,
  top,
  height,
  prefs,
}: {
  left: number;
  width: number;
  top: number;
  height: number;
  prefs: GanttActualLinePreferences;
}) {
  if (width < 2) return null;

  const midY = height / 2;
  const dotR = Math.max(3, prefs.width + 1);
  const dash = ganttActualLineStrokeDasharray(prefs.style);

  return (
    <svg
      className="pointer-events-none absolute z-[6] overflow-visible"
      style={{ left, top, width: Math.max(width, 2), height }}
      aria-hidden
    >
      <line
        x1={dotR}
        y1={midY}
        x2={Math.max(width - dotR, dotR)}
        y2={midY}
        stroke={prefs.color}
        strokeWidth={prefs.width}
        strokeDasharray={dash}
        strokeLinecap="round"
      />
      <circle
        cx={dotR}
        cy={midY}
        r={dotR}
        fill={prefs.color}
        stroke="white"
        strokeWidth={1}
        className="dark:stroke-gray-900"
      />
      <circle
        cx={Math.max(width - dotR, dotR)}
        cy={midY}
        r={dotR}
        fill={prefs.color}
        stroke="white"
        strokeWidth={1}
        className="dark:stroke-gray-900"
      />
    </svg>
  );
}
