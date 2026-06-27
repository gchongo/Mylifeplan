export interface GanttTreeLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface GanttTreeLineGroup {
  parentId: string;
  lines: GanttTreeLine[];
}

export interface GanttTreeRowLayout {
  itemId: string;
  depth: number;
  parentId: string | null;
  top: number;
  height: number;
  barLeft: number;
}

const BAR_GAP = 6;
const SPINE_INSET = 14;

function rowCenterY(row: Pick<GanttTreeRowLayout, "top" | "height">): number {
  return row.top + row.height / 2;
}

/** 分叉竖线锚定在父/子条形开始位置左侧，而非时间轴最左端 */
function spineXForGroup(
  parent: GanttTreeRowLayout,
  children: GanttTreeRowLayout[],
): number {
  const leftmost = Math.min(parent.barLeft, ...children.map((c) => c.barLeft));
  return Math.max(0, leftmost - SPINE_INSET);
}

function forkLinesForParentGroup(
  parent: GanttTreeRowLayout,
  children: GanttTreeRowLayout[],
): GanttTreeLine[] {
  const lines: GanttTreeLine[] = [];
  const spineX = spineXForGroup(parent, children);
  const yParent = rowCenterY(parent);
  const childCenters = children.map(rowCenterY);
  const yFirst = Math.min(...childCenters);
  const yLast = Math.max(...childCenters);

  const hookX = Math.max(spineX + 4, parent.barLeft - BAR_GAP);
  if (parent.barLeft > spineX + 4) {
    lines.push({ x1: spineX, y1: yParent, x2: hookX, y2: yParent });
  }

  if (yLast - yFirst > 0.5) {
    lines.push({ x1: spineX, y1: yFirst, x2: spineX, y2: yLast });
  }

  if (Math.abs(yParent - yFirst) > 0.5) {
    lines.push({ x1: spineX, y1: yParent, x2: spineX, y2: yFirst });
  }

  for (const child of children) {
    const y = rowCenterY(child);
    const targetX = Math.max(spineX + 4, child.barLeft - BAR_GAP);
    if (targetX - spineX > 3) {
      lines.push({ x1: spineX, y1: y, x2: targetX, y2: y });
    }
  }

  return lines;
}

/** 按父计划分组的分叉线（便于着色） */
export function buildParentChildForkLineGroups(rows: GanttTreeRowLayout[]): GanttTreeLineGroup[] {
  if (rows.length === 0) return [];

  const groups: GanttTreeLineGroup[] = [];
  const rowByItemId = new Map(rows.map((r) => [r.itemId, r]));
  const childrenOf = new Map<string, GanttTreeRowLayout[]>();

  for (const row of rows) {
    if (!row.parentId) continue;
    const list = childrenOf.get(row.parentId) ?? [];
    list.push(row);
    childrenOf.set(row.parentId, list);
  }

  for (const [parentId, children] of childrenOf) {
    const parent = rowByItemId.get(parentId);
    if (!parent || children.length === 0) continue;
    const lines = forkLinesForParentGroup(parent, children);
    if (lines.length > 0) {
      groups.push({ parentId, lines });
    }
  }

  return groups;
}

/** 仅父 → 直接子计划的分叉线（支持多层；子与子之间不连线） */
export function buildParentChildForkLines(rows: GanttTreeRowLayout[]): GanttTreeLine[] {
  return buildParentChildForkLineGroups(rows).flatMap((g) => g.lines);
}
