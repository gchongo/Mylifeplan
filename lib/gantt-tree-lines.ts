export interface GanttTreeLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface GanttTreeRowLayout {
  itemId: string;
  depth: number;
  parentId: string | null;
  top: number;
  height: number;
  barLeft: number;
}

const FORK_BASE_X = 10;
const FORK_DEPTH_STEP = 16;

function rowCenterY(row: Pick<GanttTreeRowLayout, "top" | "height">): number {
  return row.top + row.height / 2;
}

function forkColumnX(depth: number): number {
  return FORK_BASE_X + Math.max(0, depth) * FORK_DEPTH_STEP;
}

/** 仅父 → 直接子计划的分叉线（支持多层；子与子之间不连线） */
export function buildParentChildForkLines(rows: GanttTreeRowLayout[]): GanttTreeLine[] {
  if (rows.length === 0) return [];

  const lines: GanttTreeLine[] = [];
  const rowByItemId = new Map(rows.map((r) => [r.itemId, r]));
  const childrenOf = new Map<string, GanttTreeRowLayout[]>();

  for (const row of rows) {
    if (!row.parentId) continue;
    const list = childrenOf.get(row.parentId) ?? [];
    list.push(row);
    childrenOf.set(row.parentId, list);
  }

  for (const row of rows) {
    if (row.depth === 0) continue;
    const forkX = forkColumnX(row.depth - 1);
    const y = rowCenterY(row);
    const targetX = Math.max(forkX + 4, row.barLeft - 8);
    if (targetX - forkX > 3) {
      lines.push({ x1: forkX, y1: y, x2: targetX, y2: y });
    }
  }

  for (const [parentId, children] of childrenOf) {
    const parent = rowByItemId.get(parentId);
    if (!parent || children.length === 0) continue;

    const spineX = forkColumnX(parent.depth);
    const yParent = rowCenterY(parent);
    const childCenters = children.map(rowCenterY);
    const yFirst = Math.min(...childCenters);
    const yLast = Math.max(...childCenters);

    if (yLast - yFirst > 0.5) {
      lines.push({ x1: spineX, y1: yFirst, x2: spineX, y2: yLast });
    }

    if (Math.abs(yParent - yFirst) > 0.5) {
      lines.push({ x1: spineX, y1: yParent, x2: spineX, y2: yFirst });
    }

    const hookX = Math.max(spineX + 4, parent.barLeft - 8);
    if (parent.barLeft > spineX + 6) {
      lines.push({ x1: spineX, y1: yParent, x2: hookX, y2: yParent });
    }
  }

  return lines;
}
