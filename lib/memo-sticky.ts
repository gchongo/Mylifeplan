export const STICKY_NOTE_COLORS = [
  { id: "yellow", label: "黄", bg: "#FEF9C3", border: "#FDE047", text: "#713F12" },
  { id: "pink", label: "粉", bg: "#FCE7F3", border: "#F9A8D4", text: "#831843" },
  { id: "blue", label: "蓝", bg: "#DBEAFE", border: "#93C5FD", text: "#1E3A8A" },
  { id: "green", label: "绿", bg: "#DCFCE7", border: "#86EFAC", text: "#14532D" },
  { id: "purple", label: "紫", bg: "#F3E8FF", border: "#D8B4FE", text: "#581C87" },
  { id: "orange", label: "橙", bg: "#FFEDD5", border: "#FDBA74", text: "#7C2D12" },
] as const;

export type StickyNoteColorId = (typeof STICKY_NOTE_COLORS)[number]["id"];

const COLOR_BY_ID = new Map(STICKY_NOTE_COLORS.map((c) => [c.id, c]));

export function stickyNoteColor(id: string | null | undefined) {
  return COLOR_BY_ID.get(id as StickyNoteColorId) ?? STICKY_NOTE_COLORS[0]!;
}

export function nextStickyColor(index: number): StickyNoteColorId {
  return STICKY_NOTE_COLORS[index % STICKY_NOTE_COLORS.length]!.id;
}

/** 未保存位置时，按序号在板上铺开 */
export function defaultStickyPosition(index: number): { x: number; y: number } {
  const col = index % 4;
  const row = Math.floor(index / 4);
  return { x: 32 + col * 260, y: 32 + row * 220 };
}

export function effectiveStickyPosition(
  posX: number | null | undefined,
  posY: number | null | undefined,
  index: number,
): { x: number; y: number } {
  if (posX != null && posY != null) return { x: posX, y: posY };
  return defaultStickyPosition(index);
}
