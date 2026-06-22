import type { CSSProperties } from "react";
import type { GanttTodayColumnFillStyle, GanttTodayColumnPreferences } from "@/lib/user-preferences";

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const match = /^#?([0-9A-Fa-f]{6})$/.exec(hex);
  if (!match) return null;
  const n = parseInt(match[1]!, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function ganttTodayColumnBackground(
  prefs: GanttTodayColumnPreferences,
): CSSProperties | undefined {
  if (!prefs.enabled) return undefined;

  const rgb = hexToRgb(prefs.color);
  if (!rgb) return undefined;

  const alpha = Math.min(100, Math.max(5, prefs.opacity)) / 100;
  const { r, g, b } = rgb;
  const fill = (a: number) => `rgba(${r}, ${g}, ${b}, ${a})`;

  switch (prefs.fillStyle) {
    case "striped":
      return {
        backgroundColor: fill(alpha * 0.3),
        backgroundImage: `repeating-linear-gradient(
          -45deg,
          ${fill(alpha)} 0,
          ${fill(alpha)} 3px,
          transparent 3px,
          transparent 9px
        )`,
      };
    case "dotted":
      return {
        backgroundColor: fill(alpha * 0.2),
        backgroundImage: `radial-gradient(${fill(alpha)} 1.25px, transparent 1.25px)`,
        backgroundSize: "7px 7px",
      };
    case "solid":
    default:
      return { backgroundColor: fill(alpha) };
  }
}

export function ganttTodayColumnLabelStyle(
  prefs: GanttTodayColumnPreferences,
): CSSProperties | undefined {
  if (!prefs.enabled) return undefined;
  const rgb = hexToRgb(prefs.color);
  if (!rgb) return undefined;
  return { color: prefs.color };
}

export function isGanttTodayColumnFillStyle(value: unknown): value is GanttTodayColumnFillStyle {
  return value === "solid" || value === "striped" || value === "dotted";
}
