export const MEMO_QUADRANT_BOARD_WIDTH = 960;
export const MEMO_QUADRANT_BOARD_HEIGHT = 720;

export const MEMO_QUADRANT_IDS = [
  "urgent_important",
  "not_urgent_important",
  "urgent_not_important",
  "not_urgent_not_important",
] as const;

export type MemoQuadrantId = (typeof MEMO_QUADRANT_IDS)[number];

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
    gridClass: "col-start-1 row-start-1",
  },
  {
    id: "not_urgent_important",
    label: "重要不紧急",
    shortLabel: "Q2",
    hint: "计划安排",
    gridClass: "col-start-2 row-start-1",
  },
  {
    id: "urgent_not_important",
    label: "紧急不重要",
    shortLabel: "Q3",
    hint: "委托他人",
    gridClass: "col-start-1 row-start-2",
  },
  {
    id: "not_urgent_not_important",
    label: "不重要不紧急",
    shortLabel: "Q4",
    hint: "尽量精简",
    gridClass: "col-start-2 row-start-2",
  },
];

export const DEFAULT_STICKY_WIDTH = 240;
export const DEFAULT_STICKY_HEIGHT = 180;
export const MIN_STICKY_WIDTH = 180;
export const MIN_STICKY_HEIGHT = 120;

export function isMemoQuadrantId(value: string | null | undefined): value is MemoQuadrantId {
  return MEMO_QUADRANT_IDS.includes(value as MemoQuadrantId);
}

/** 根据便签中心点判断所在象限（左=紧急，右=不紧急；上=重要，下=不重要） */
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
  const urgent = cx < boardWidth / 2;
  const important = cy < boardHeight / 2;
  if (important && urgent) return "urgent_important";
  if (important && !urgent) return "not_urgent_important";
  if (!important && urgent) return "urgent_not_important";
  return "not_urgent_not_important";
}

export function quadrantLabel(id: string | null | undefined): string | null {
  if (!isMemoQuadrantId(id)) return null;
  return MEMO_QUADRANTS.find((q) => q.id === id)?.label ?? null;
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
