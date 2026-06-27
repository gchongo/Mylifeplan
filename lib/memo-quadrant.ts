import { defaultStickyPosition } from "@/lib/memo-sticky";

export const MEMO_QUADRANT_BOARD_WIDTH = 960;
export const MEMO_QUADRANT_BOARD_HEIGHT = 720;

export const MEMO_QUADRANT_IDS = [
  "urgent_important",
  "not_urgent_important",
  "not_urgent_not_important",
  "urgent_not_important",
] as const;

export type MemoQuadrantId = (typeof MEMO_QUADRANT_IDS)[number];

/** 移动端便签页 Tab 顺序：Q1 → Q2 → Q3 → Q4 */
export const MOBILE_MEMO_QUADRANT_TAB_ORDER: MemoQuadrantId[] = [
  "urgent_important",
  "not_urgent_important",
  "not_urgent_not_important",
  "urgent_not_important",
];

/** 经典矩阵：右上 Q1，左上 Q2，左下 Q3，右下 Q4 */
export const MEMO_QUADRANTS: {
  id: MemoQuadrantId;
  label: string;
  shortLabel: string;
  hint: string;
  gridClass: string;
}[] = [
  {
    id: "urgent_important",
    label: "重要且紧急",
    shortLabel: "Q1",
    hint: "立即处理",
    gridClass: "col-start-2 row-start-1",
  },
  {
    id: "not_urgent_important",
    label: "重要不紧急",
    shortLabel: "Q2",
    hint: "计划安排",
    gridClass: "col-start-1 row-start-1",
  },
  {
    id: "urgent_not_important",
    label: "紧急不重要",
    shortLabel: "Q4",
    hint: "委托他人",
    gridClass: "col-start-2 row-start-2",
  },
  {
    id: "not_urgent_not_important",
    label: "不重要不紧急",
    shortLabel: "Q3",
    hint: "尽量精简",
    gridClass: "col-start-1 row-start-2",
  },
];

export const DEFAULT_STICKY_WIDTH = 240;
export const DEFAULT_STICKY_HEIGHT = 180;
export const MIN_STICKY_WIDTH = 180;
export const MIN_STICKY_HEIGHT = 120;

/** 便签板最小尺寸（实际以视口与便签范围为准） */
export const MEMO_BOARD_MIN_WIDTH = 640;
export const MEMO_BOARD_MIN_HEIGHT = 480;

/** 左=不紧急，右=紧急；上=重要，下=不重要 */
export const MEMO_AXIS_LABELS = {
  top: "重要",
  bottom: "不重要",
  left: "不紧急",
  right: "紧急",
} as const;

export type MemoBoardAxis = {
  axisXRatio: number;
  axisYRatio: number;
};

export const DEFAULT_MEMO_BOARD_AXIS: MemoBoardAxis = {
  axisXRatio: 0.5,
  axisYRatio: 0.5,
};

export function resolveMemoBoardAxisPixels(
  boardWidth: number,
  boardHeight: number,
  axis: MemoBoardAxis = DEFAULT_MEMO_BOARD_AXIS,
) {
  return {
    axisXRatio: axis.axisXRatio,
    axisYRatio: axis.axisYRatio,
    axisX: boardWidth * axis.axisXRatio,
    axisY: boardHeight * axis.axisYRatio,
  };
}

export function getQuadrantBounds(
  quadrant: MemoQuadrantId,
  boardWidth: number,
  boardHeight: number,
  axis: MemoBoardAxis = DEFAULT_MEMO_BOARD_AXIS,
) {
  const { axisX, axisY } = resolveMemoBoardAxisPixels(boardWidth, boardHeight, axis);
  switch (quadrant) {
    case "urgent_important":
      return { left: axisX, top: 0, width: boardWidth - axisX, height: axisY };
    case "not_urgent_important":
      return { left: 0, top: 0, width: axisX, height: axisY };
    case "urgent_not_important":
      return { left: axisX, top: axisY, width: boardWidth - axisX, height: boardHeight - axisY };
    default:
      return { left: 0, top: axisY, width: axisX, height: boardHeight - axisY };
  }
}

export function computeMemoBoardSize(
  viewportWidth: number,
  viewportHeight: number,
  notes: { x: number; y: number; width?: number | null; height?: number | null }[],
): { width: number; height: number } {
  const pad = 48;
  let width = Math.max(viewportWidth, MEMO_BOARD_MIN_WIDTH);
  let height = Math.max(viewportHeight, MEMO_BOARD_MIN_HEIGHT);

  for (const note of notes) {
    const w = note.width ?? DEFAULT_STICKY_WIDTH;
    const h = note.height ?? DEFAULT_STICKY_HEIGHT;
    width = Math.max(width, note.x + w + pad);
    height = Math.max(height, note.y + h + pad);
  }

  return { width, height };
}

export function isMemoQuadrantId(value: string | null | undefined): value is MemoQuadrantId {
  return MEMO_QUADRANT_IDS.includes(value as MemoQuadrantId);
}

/** 根据便签中心点判断所在象限（右=紧急，左=不紧急；上=重要，下=不重要） */
export function detectMemoQuadrant(
  x: number,
  y: number,
  width: number,
  height: number,
  boardWidth = MEMO_QUADRANT_BOARD_WIDTH,
  boardHeight = MEMO_QUADRANT_BOARD_HEIGHT,
  axis: MemoBoardAxis = DEFAULT_MEMO_BOARD_AXIS,
): MemoQuadrantId {
  const cx = x + width / 2;
  const cy = y + height / 2;
  const { axisX, axisY } = resolveMemoBoardAxisPixels(boardWidth, boardHeight, axis);
  const urgent = cx >= axisX;
  const important = cy < axisY;
  if (important && urgent) return "urgent_important";
  if (important && !urgent) return "not_urgent_important";
  if (!important && urgent) return "urgent_not_important";
  return "not_urgent_not_important";
}

/** 远程创建便签时，按象限落在板上的默认位置 */
export function defaultPositionForQuadrant(
  quadrant: MemoQuadrantId,
  boardWidth = MEMO_QUADRANT_BOARD_WIDTH,
  boardHeight = MEMO_QUADRANT_BOARD_HEIGHT,
  index = 0,
  axis: MemoBoardAxis = DEFAULT_MEMO_BOARD_AXIS,
): { x: number; y: number } {
  const bounds = getQuadrantBounds(quadrant, boardWidth, boardHeight, axis);
  const pad = 28;
  const stagger = index % 6;
  const offsetX = (stagger % 3) * 32;
  const offsetY = Math.floor(stagger / 3) * 28;
  return { x: bounds.left + pad + offsetX, y: bounds.top + pad + offsetY };
}

export function stickyNoteFitsQuadrant(
  x: number,
  y: number,
  width: number,
  height: number,
  quadrant: MemoQuadrantId,
  boardWidth: number,
  boardHeight: number,
  axis: MemoBoardAxis = DEFAULT_MEMO_BOARD_AXIS,
): boolean {
  return detectMemoQuadrant(x, y, width, height, boardWidth, boardHeight, axis) === quadrant;
}

/**
 * 便签板加载/远程创建：若已指定象限，则优先落入该象限（信息流 Q1–Q4 创建）。
 * 仅当无象限或用户拖动后，才由坐标反推象限。
 */
export function resolveStickyNotePlacement(args: {
  quadrant?: string | null;
  posX?: number | null;
  posY?: number | null;
  width?: number | null;
  height?: number | null;
  boardWidth: number;
  boardHeight: number;
  indexInQuadrant: number;
  axis?: MemoBoardAxis;
}): { x: number; y: number; quadrant: MemoQuadrantId | null } {
  const width = args.width ?? DEFAULT_STICKY_WIDTH;
  const height = args.height ?? DEFAULT_STICKY_HEIGHT;
  const axis = args.axis ?? DEFAULT_MEMO_BOARD_AXIS;

  if (isMemoQuadrantId(args.quadrant)) {
    const hasPos = args.posX != null && args.posY != null;
    if (
      hasPos &&
      stickyNoteFitsQuadrant(
        args.posX!,
        args.posY!,
        width,
        height,
        args.quadrant,
        args.boardWidth,
        args.boardHeight,
        axis,
      )
    ) {
      return { x: args.posX!, y: args.posY!, quadrant: args.quadrant };
    }
    const pos = defaultPositionForQuadrant(
      args.quadrant,
      args.boardWidth,
      args.boardHeight,
      args.indexInQuadrant,
      axis,
    );
    return { x: pos.x, y: pos.y, quadrant: args.quadrant };
  }

  if (args.posX != null && args.posY != null) {
    return {
      x: args.posX,
      y: args.posY,
      quadrant: detectMemoQuadrant(
        args.posX,
        args.posY,
        width,
        height,
        args.boardWidth,
        args.boardHeight,
        axis,
      ),
    };
  }

  const fallback = defaultStickyPosition(args.indexInQuadrant);
  return {
    x: fallback.x,
    y: fallback.y,
    quadrant: detectMemoQuadrant(
      fallback.x,
      fallback.y,
      width,
      height,
      args.boardWidth,
      args.boardHeight,
      axis,
    ),
  };
}

export function quadrantLabel(id: string | null | undefined): string | null {
  if (!isMemoQuadrantId(id)) return null;
  return MEMO_QUADRANTS.find((q) => q.id === id)?.label ?? null;
}

export function quadrantShortLabel(id: string | null | undefined): string | null {
  if (!isMemoQuadrantId(id)) return null;
  return MEMO_QUADRANTS.find((q) => q.id === id)?.shortLabel ?? null;
}

/** 信息流等宽充足处：Q1 重要且紧急 */
export function quadrantFeedLabel(id: string | null | undefined): string | null {
  if (!isMemoQuadrantId(id)) return null;
  const q = MEMO_QUADRANTS.find((item) => item.id === id);
  return q ? `${q.shortLabel} ${q.label}` : null;
}

export function isBlankStickyMemo(memo: {
  title: string;
  body?: string | null;
  description?: string | null;
}): boolean {
  const hasBody = Boolean(memo.body?.trim() || memo.description?.trim());
  if (hasBody) return false;
  const title = memo.title.trim();
  return !title || title === "新便签";
}
