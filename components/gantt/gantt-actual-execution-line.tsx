"use client";

import type { GanttActualLinePreferences } from "@/lib/user-preferences";
import type { ActualEndKind } from "@/lib/gantt-actual-timeline";
import { ganttActualLineStrokeDasharray } from "@/lib/gantt-actual-line-style";

function VerticalEndCap({
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
        d={`M ${x} ${y + r * 0.35} L ${x - r * 0.55} ${y + r * 1.8} L ${x + r * 0.55} ${y + r * 1.8} Z`}
        fill={color}
      />
    </g>
  );
}

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

/** 移动端竖向甘特：实际执行线在计划条水平中心（与 PC 条内中线对应） */
export function GanttActualExecutionLineVertical({
  centerX,
  top,
  height,
  prefs,
  endKind = "fixed",
}: {
  centerX: number;
  top: number;
  height: number;
  prefs: GanttActualLinePreferences;
  endKind?: ActualEndKind;
}) {
  if (height < 2) return null;

  const dotR = Math.max(3, prefs.width + 1);
  const dash = ganttActualLineStrokeDasharray(prefs.style);
  const endY = Math.max(height - dotR, dotR);
  const lineEndY = endKind === "open" ? Math.max(endY - dotR * 0.8, dotR) : endY;
  const svgWidth = Math.max(dotR * 2 + 2, prefs.width + 4);

  return (
    <svg
      className="pointer-events-none absolute z-[6] overflow-visible"
      style={{
        left: centerX - svgWidth / 2,
        top,
        width: svgWidth,
        height: Math.max(height, 2),
      }}
      aria-hidden
    >
      <line
        x1={svgWidth / 2}
        y1={dotR}
        x2={svgWidth / 2}
        y2={lineEndY}
        stroke={prefs.color}
        strokeWidth={prefs.width}
        strokeDasharray={dash}
        strokeLinecap="round"
      />
      <circle
        cx={svgWidth / 2}
        cy={dotR}
        r={dotR}
        fill={prefs.color}
        stroke="white"
        strokeWidth={1}
        className="dark:stroke-gray-900"
      />
      <VerticalEndCap
        x={svgWidth / 2}
        y={endY}
        r={dotR}
        color={prefs.color}
        kind={endKind}
      />
    </svg>
  );
}
