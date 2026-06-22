"use client";

import type { GanttActualLinePreferences } from "@/lib/user-preferences";
import type { ActualEndKind } from "@/lib/gantt-actual-timeline";
import { ganttActualLineStrokeDasharray } from "@/lib/gantt-actual-line-style";

function EndCap({
  x,
  y,
  r,
  color,
  kind,
}: {
  x: number;
  y: number;
  r: number;
  color: string;
  kind: ActualEndKind;
}) {
  if (kind === "fixed") {
    return (
      <circle
        cx={x}
        cy={y}
        r={r}
        fill={color}
        stroke="white"
        strokeWidth={1}
        className="dark:stroke-gray-900"
      />
    );
  }

  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r={r}
        fill="white"
        stroke={color}
        strokeWidth={1.5}
        className="dark:fill-gray-900"
      />
      <path
        d={`M ${x + r * 0.35} ${y} L ${x + r * 1.8} ${y - r * 0.55} L ${x + r * 1.8} ${y + r * 0.55} Z`}
        fill={color}
      />
    </g>
  );
}

export function GanttActualExecutionLine({
  left,
  width,
  top,
  height,
  prefs,
  endKind = "fixed",
}: {
  left: number;
  width: number;
  top: number;
  height: number;
  prefs: GanttActualLinePreferences;
  endKind?: ActualEndKind;
}) {
  if (width < 2) return null;

  const midY = height / 2;
  const dotR = Math.max(3, prefs.width + 1);
  const dash = ganttActualLineStrokeDasharray(prefs.style);
  const endX = Math.max(width - dotR, dotR);
  const lineEndX = endKind === "open" ? Math.max(endX - dotR * 0.8, dotR) : endX;

  return (
    <svg
      className="pointer-events-none absolute z-[6] overflow-visible"
      style={{ left, top, width: Math.max(width, 2), height }}
      aria-hidden
    >
      <line
        x1={dotR}
        y1={midY}
        x2={lineEndX}
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
      <EndCap x={endX} y={midY} r={dotR} color={prefs.color} kind={endKind} />
    </svg>
  );
}
