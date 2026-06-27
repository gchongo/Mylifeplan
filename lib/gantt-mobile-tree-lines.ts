import type { GanttTreeLine } from "@/lib/gantt-tree-lines";

export interface GanttMobileBarForkLayout {
  itemId: string;
  parentId: string | null;
  left: number;
  width: number;
  barTop: number;
}

export interface GanttMobileForkLineGroup {
  parentId: string;
  lines: GanttTreeLine[];
}

const BAR_GAP = 6;
const SPINE_INSET = 10;

function columnCenterX(col: Pick<GanttMobileBarForkLayout, "left" | "width">): number {
  return col.left + col.width / 2;
}

function spineYForGroup(
  parent: GanttMobileBarForkLayout,
  children: GanttMobileBarForkLayout[],
): number {
  const topmost = Math.min(parent.barTop, ...children.map((c) => c.barTop));
  return Math.max(0, topmost - SPINE_INSET);
}

function forkLinesForParentGroup(
  parent: GanttMobileBarForkLayout,
  children: GanttMobileBarForkLayout[],
): GanttTreeLine[] {
  const lines: GanttTreeLine[] = [];
  const spineY = spineYForGroup(parent, children);
  const xParent = columnCenterX(parent);
  const childCenters = children.map(columnCenterX);
  const xFirst = Math.min(...childCenters);
  const xLast = Math.max(...childCenters);

  const hookY = Math.max(spineY + 4, parent.barTop - BAR_GAP);
  if (parent.barTop > spineY + 4) {
    lines.push({ x1: xParent, y1: spineY, x2: xParent, y2: hookY });
  }

  if (xLast - xFirst > 0.5) {
    lines.push({ x1: xFirst, y1: spineY, x2: xLast, y2: spineY });
  }

  if (Math.abs(xParent - xFirst) > 0.5) {
    lines.push({ x1: xParent, y1: spineY, x2: xFirst, y2: spineY });
  }

  for (const child of children) {
    const x = columnCenterX(child);
    const targetY = Math.max(spineY + 4, child.barTop - BAR_GAP);
    if (targetY - spineY > 3) {
      lines.push({ x1: x, y1: spineY, x2: x, y2: targetY });
    }
  }

  return lines;
}

/** 移动端甘特：父列 → 子列分叉线，锚定在各自计划条顶部（与 PC 条左缘逻辑对应） */
export function buildMobilePlanBarForkLineGroups(
  columns: GanttMobileBarForkLayout[],
): GanttMobileForkLineGroup[] {
  if (columns.length === 0) return [];

  const colByItemId = new Map(columns.map((c) => [c.itemId, c]));
  const childrenOf = new Map<string, GanttMobileBarForkLayout[]>();

  for (const col of columns) {
    if (!col.parentId) continue;
    const list = childrenOf.get(col.parentId) ?? [];
    list.push(col);
    childrenOf.set(col.parentId, list);
  }

  const groups: GanttMobileForkLineGroup[] = [];
  for (const [parentId, children] of childrenOf) {
    const parent = colByItemId.get(parentId);
    if (!parent || children.length === 0) continue;
    const lines = forkLinesForParentGroup(parent, children);
    if (lines.length > 0) {
      groups.push({ parentId, lines });
    }
  }

  return groups;
}

/** @deprecated 仅表头分叉，请改用 buildMobilePlanBarForkLineGroups */
export function buildMobileColumnForkLines(
  columns: Pick<GanttMobileBarForkLayout, "itemId" | "parentId" | "left" | "width">[],
  headerHeight: number,
): GanttTreeLine[] {
  void headerHeight;
  const withBarTop = columns.map((c) => ({ ...c, barTop: 0 }));
  return buildMobilePlanBarForkLineGroups(withBarTop).flatMap((g) => g.lines);
}
