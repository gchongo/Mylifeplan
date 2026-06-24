import type { StickyNoteColorId } from "@/lib/memo-sticky";
import { MEMO_QUADRANTS, type MemoQuadrantId } from "@/lib/memo-quadrant";
import { createTranslator, type TranslationKey } from "@/lib/i18n/translate";

type TranslateFn = ReturnType<typeof createTranslator>;

export function localizeStickyColorLabel(t: TranslateFn, colorId: StickyNoteColorId): string {
  return t(`memos.note.colors.${colorId}` as TranslationKey);
}

export function localizeMemoQuadrantShort(
  t: TranslateFn,
  quadrantId: MemoQuadrantId,
): string {
  return t(`feed.memoQuadrant.${quadrantId}.short` as TranslationKey);
}

export const MEMO_QUADRANT_IDS = MEMO_QUADRANTS.map((q) => q.id);
