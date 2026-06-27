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

/** 子计划不单独设色，颜色仅在一级计划上定义，子级继承同一色相、按层级深浅区分 */
export function resolveEffectivePlanColor(
  item: { color?: string | null; parentId?: string | null; parentPlanId?: string | null },
  inherited?: { color?: string | null },
): string {
  if (item.parentId || item.parentPlanId) {
    return normalizePlanColor(inherited?.color);
  }
  return normalizePlanColor(item.color ?? inherited?.color);
}

/** 甘特计划树统一色：始终取一级计划颜色 */
export function resolvePlanTreeGroupColor(
  item: { color?: string | null; parentId?: string | null; parentPlanId?: string | null; id?: string },
  planById: Map<string, { color?: string | null; parentId?: string | null; parentPlanId?: string | null }>,
): string {
  let current: typeof item | undefined = item;
  while (current?.parentId || current?.parentPlanId) {
    const parentKey = current.parentId ?? current.parentPlanId;
    if (!parentKey) break;
    const parent = planById.get(parentKey);
    if (!parent) break;
    current = parent;
  }
  return normalizePlanColor(current?.color);
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

/** 移动端竖排标题：与计划色同 hue，白描边保证在条/网格上都可读 */
export function getMobilePlanBarLabelStyle(planColor: string): CSSProperties {
  const hex = normalizePlanColor(planColor);
  const { r, g, b } = hexToRgb(hex);
  const shade = 0.72;
  return {
    color: `rgb(${Math.round(r * shade)}, ${Math.round(g * shade)}, ${Math.round(b * shade)})`,
    textShadow:
      "0 0 4px rgba(255,255,255,0.98), 0 0 1px rgba(255,255,255,0.9), 0 1px 2px rgba(15,23,42,0.18)",
  };
}

/** 移动端计划条：与 PC getGroupColoredBarAppearance 同色相与深浅规则 */
export function getMobilePlanBarFillStyle(planColor: string, depth: number, opacityPercent = 100): CSSProperties {
  const bar = getGroupColoredBarAppearance(planColor, depth, "", false, opacityPercent);
  const isRoot = depth === 0;
  const c = normalizePlanColor(planColor);
  return {
    backgroundColor: bar.shellStyle?.backgroundColor,
    border: `${isRoot ? 1.5 : 1}px solid ${bar.shellStyle?.borderColor}`,
    boxShadow: `inset 0 1px 0 ${planColorRgba(c, 0.22)}`,
  };
}

export interface PlanBarAppearance {
  shellClass: string;
  shellStyle?: CSSProperties;
  textClass: string;
  textStyle?: CSSProperties;
  barHeightPx: number;
  statusDotClass: string;
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

/** 甘特图计划条高度：一级 > 二级 > 三级 */
export const GANTT_PLAN_BAR_HEIGHT_BY_DEPTH = [30, 24, 18] as const;

/** 甘特图行高：与条高配套，保证垂直居中留白 */
export const GANTT_PLAN_ROW_HEIGHT_BY_DEPTH = [36, 32, 28] as const;

export function ganttPlanBarHeightPx(depth: number): number {
  const idx = Math.min(Math.max(depth, 0), GANTT_PLAN_BAR_HEIGHT_BY_DEPTH.length - 1);
  return GANTT_PLAN_BAR_HEIGHT_BY_DEPTH[idx]!;
}

export function ganttPlanRowHeightPx(depth: number): number {
  const idx = Math.min(Math.max(depth, 0), GANTT_PLAN_ROW_HEIGHT_BY_DEPTH.length - 1);
  return GANTT_PLAN_ROW_HEIGHT_BY_DEPTH[idx]!;
}

export function getGroupColoredBarAppearance(
  groupColor: string | null | undefined,
  depth: number,
  statusDotClass: string,
  muted = false,
  opacityPercent = 100,
): PlanBarAppearance {
  const c = normalizePlanColor(groupColor);
  const isRoot = depth === 0;
  const opacityScale = Math.min(100, Math.max(20, opacityPercent)) / 100;
  const fillAlpha = (isRoot ? 0.45 : Math.max(0.2, 0.34 - depth * 0.05)) * opacityScale;

  return {
    shellClass: isRoot
      ? "border-[1.5px] border-solid shadow-sm"
      : depth === 1
        ? "border border-solid shadow-sm"
        : "border border-solid shadow-sm",
    shellStyle: {
      borderColor: planColorRgba(c, (isRoot ? 0.88 : depth === 1 ? 0.82 : 0.76) * opacityScale),
      backgroundColor: planColorRgba(c, fillAlpha),
      opacity: muted ? 0.78 : 1,
    },
    textClass: isRoot
      ? "font-semibold text-slate-900 dark:text-slate-50"
      : depth === 1
        ? "font-medium text-slate-800 dark:text-slate-200"
        : "font-normal text-slate-800 dark:text-slate-200",
    barHeightPx: ganttPlanBarHeightPx(depth),
    statusDotClass,
  };
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
      barHeightPx: 32,
      statusDotClass: "bg-gray-400 ring-gray-300",
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
      barHeightPx: 22,
      statusDotClass: "bg-gray-400 ring-gray-300",
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
    barHeightPx: isParent ? 32 : 22,
    statusDotClass: "bg-gray-400 ring-gray-300",
  };
}

export function getPlanGroupFrameAppearance(
  _color?: string | null | undefined,
): PlanGroupFrameAppearance {
  return {
    className:
      "pointer-events-none absolute z-[1] rounded-md border-2 border-slate-300 bg-slate-50/80 dark:border-slate-600 dark:bg-slate-900/35",
    style: {},
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
