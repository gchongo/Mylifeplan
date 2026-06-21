import type { CSSProperties } from "react";

/** 新建计划默认色 */
export const DEFAULT_PLAN_COLOR = "#6366F1";

/** 表单可选色板 */
export const PLAN_COLOR_SWATCHES = [
  "#6366F1",
  "#3B82F6",
  "#06B6D4",
  "#10B981",
  "#84CC16",
  "#EAB308",
  "#F97316",
  "#EF4444",
  "#EC4899",
  "#8B5CF6",
  "#64748B",
  "#78716C",
] as const;

const HEX_RE = /^#([0-9A-Fa-f]{6})$/;

export function normalizePlanColor(color: string | null | undefined): string {
  if (color && HEX_RE.test(color)) return color.toUpperCase();
  return DEFAULT_PLAN_COLOR;
}

/** 子计划未设颜色时继承一级计划颜色 */
export function resolveEffectivePlanColor(
  item: { color?: string | null },
  inherited?: { color?: string | null },
): string {
  return normalizePlanColor(item.color ?? inherited?.color);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = normalizePlanColor(hex).slice(1);
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function planColorRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export interface PlanBarAppearance {
  shellClass: string;
  shellStyle?: CSSProperties;
  textClass: string;
  textStyle?: CSSProperties;
}

export interface PlanGroupFrameAppearance {
  className: string;
  style: CSSProperties;
}

export interface PlanLabelAppearance {
  stripeClass: string;
  bgClass: string;
  stripeStyle?: CSSProperties;
  bgStyle?: CSSProperties;
}

export function getPlanBarAppearance(
  color: string | null | undefined,
  opts: { frameRoot?: boolean; inGroupChild?: boolean; isRoot?: boolean },
): PlanBarAppearance {
  const c = normalizePlanColor(color);

  if (opts.frameRoot) {
    return {
      shellClass: "border-0 bg-transparent shadow-none ring-0",
      textClass: "font-semibold",
      textStyle: { color: c },
    };
  }

  if (opts.inGroupChild) {
    return {
      shellClass: "border border-dashed shadow-none",
      shellStyle: {
        borderColor: planColorRgba(c, 0.55),
        backgroundColor: "rgba(255,255,255,0.75)",
      },
      textClass: "font-normal",
      textStyle: { color: c },
    };
  }

  const isParent = opts.isRoot ?? false;
  return {
    shellClass: isParent ? "border-2 border-solid" : "border-2 border-dashed",
    shellStyle: {
      borderColor: c,
      backgroundColor: planColorRgba(c, isParent ? 0.08 : 0.12),
    },
    textClass: isParent ? "font-semibold" : "font-normal",
    textStyle: { color: c },
  };
}

export function getPlanGroupFrameAppearance(
  color: string | null | undefined,
): PlanGroupFrameAppearance {
  const c = normalizePlanColor(color);
  return {
    className: "pointer-events-none absolute z-[1] rounded-md border-2",
    style: {
      borderColor: planColorRgba(c, 0.75),
      backgroundColor: planColorRgba(c, 0.1),
    },
  };
}

export function getPlanLabelAppearance(color: string | null | undefined): PlanLabelAppearance {
  const c = normalizePlanColor(color);
  return {
    stripeClass: "border-l-[3px]",
    bgClass: "",
    stripeStyle: { borderLeftColor: c },
    bgStyle: { backgroundColor: planColorRgba(c, 0.08) },
  };
}
