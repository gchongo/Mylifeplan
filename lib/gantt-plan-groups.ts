/** 组框底部留白，避免最后一行子条贴底边 */
export const GROUP_FRAME_BOTTOM_PAD = 3;

export interface GanttRowGroupMeta {
  gapBefore: number;
  height: number;
  rootId: string;
}

export interface PlanGroupLayout {
  rootId: string;
  top: number;
  height: number;
  rowCount: number;
}

export function rowOffsetTop(rows: Array<{ gapBefore: number; height: number }>, index: number): number {
  let y = 0;
  for (let i = 0; i < index; i++) {
    y += rows[i]!.gapBefore + rows[i]!.height;
  }
  return y;
}

/** 每个一级计划及其当前可见后代 → 一组；至少 2 行才绘制时间轴组框 */
export function buildPlanGroupLayouts(rows: GanttRowGroupMeta[]): PlanGroupLayout[] {
  const groups: PlanGroupLayout[] = [];
  let i = 0;
  while (i < rows.length) {
    const rootId = rows[i]!.rootId;
    let j = i + 1;
    while (j < rows.length && rows[j]!.rootId === rootId) j++;
    const count = j - i;
    if (count >= 2) {
      const childrenTop = rowOffsetTop(rows, i + 1);
      groups.push({
        rootId,
        top: childrenTop,
        height: rowOffsetTop(rows, j) - childrenTop,
        rowCount: count,
      });
    }
    i = j;
  }
  return groups;
}
