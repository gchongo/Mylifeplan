import type { GanttTreeLine } from "@/lib/gantt-tree-lines";

export interface GanttMobileColumnLayout {
  itemId: string;
  parentId: string | null;
  left: number;
  width: number;
}

/** 移动端表头：父计划列 → 子计划列的分叉连线（横向列布局） */
export function buildMobileColumnForkLines(
  columns: GanttMobileColumnLayout[],
  headerHeight: number,
): GanttTreeLine[] {
  if (columns.length === 0) return [];

  const lines: GanttTreeLine[] = [];
  const colByItemId = new Map(columns.map((c) => [c.itemId, c]));
  const childrenOf = new Map<string, GanttMobileColumnLayout[]>();

  for (const col of columns) {
    if (!col.parentId) continue;
    const list = childrenOf.get(col.parentId) ?? [];
    list.push(col);
    childrenOf.set(col.parentId, list);
  }

  const yBranch = headerHeight * 0.36;
  const yTitle = headerHeight * 0.74;
  const spineInset = 10;

  for (const [parentId, children] of childrenOf) {
    const parent = colByItemId.get(parentId);
    if (!parent || children.length === 0) continue;

    const xParent = parent.left + parent.width / 2;
    const childCenters = children.map((c) => c.left + c.width / 2);
    const xFirst = Math.min(...childCenters);
    const xLast = Math.max(...childCenters);
    const spineX = Math.min(xParent, xFirst) - spineInset;

    if (xLast - spineX > 2) {
      lines.push({ x1: spineX, y1: yBranch, x2: xLast, y2: yBranch });
    }

    if (Math.abs(xParent - spineX) > 2) {
      lines.push({ x1: spineX, y1: yBranch, x2: xParent, y2: yBranch });
    }

    lines.push({ x1: xParent, y1: yBranch, x2: xParent, y2: yTitle });

    for (const xc of childCenters) {
      lines.push({ x1: xc, y1: yBranch, x2: xc, y2: yTitle });
    }
  }

  return lines;
}
