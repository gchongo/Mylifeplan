export const MEMO_QUADRANT_BOARD_WIDTH = 960;
export const MEMO_QUADRANT_BOARD_HEIGHT = 720;

export const MEMO_QUADRANT_IDS = [
  "urgent_important",
  "not_urgent_important",
  "urgent_not_important",
  "not_urgent_not_important",
] as const;

export type MemoQuadrantId = (typeof MEMO_QUADRANT_IDS)[number];

/** 经典矩阵：右上 Q1，左上 Q2，右下 Q3，左下 Q4 */
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
    shortLabel: "Q3",
    hint: "委托他人",
    gridClass: "col-start-2 row-start-2",
  },
  {
    id: "not_urgent_not_important",
    label: "不重要不紧急",
    shortLabel: "Q4",
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
): MemoQuadrantId {
  const cx = x + width / 2;
  const cy = y + height / 2;
  const urgent = cx >= boardWidth / 2;
  const important = cy < boardHeight / 2;
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
): { x: number; y: number } {
  const halfW = boardWidth / 2;
  const halfH = boardHeight / 2;
  const pad = 28;
  const stagger = index % 6;
  const offsetX = (stagger % 3) * 32;
  const offsetY = Math.floor(stagger / 3) * 28;

  switch (quadrant) {
    case "urgent_important":
      return { x: halfW + pad + offsetX, y: pad + offsetY };
    case "not_urgent_important":
      return { x: pad + offsetX, y: pad + offsetY };
    case "urgent_not_important":
      return { x: halfW + pad + offsetX, y: halfH + pad + offsetY };
    default:
      return { x: pad + offsetX, y: halfH + pad + offsetY };
  }
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
