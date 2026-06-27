"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { MemoMarkdown } from "@/components/memos/memo-markdown";
import type { StickyNoteData } from "@/components/memos/sticky-note";
import {
  MenuIconDelete,
  PlanDetailActionsMenu,
  type PlanDetailMenuItem,
} from "@/components/plans/plan-detail-actions-menu";
import { localizeStickyColorLabel } from "@/lib/i18n/memo-helpers";
import { memoDisplayBody } from "@/lib/memo-content";
import { STICKY_NOTE_COLORS, stickyNoteColor } from "@/lib/memo-sticky";
import { cn } from "@/lib/utils";

export function MemoMobileCard({
  note,
  isEditing,
  onStartEdit,
  onEndEdit,
  onUpdate,
  onDelete,
  onAssign,
}: {
  note: StickyNoteData;
  isEditing: boolean;
  onStartEdit: () => void;
  onEndEdit: () => void;
  onUpdate: (id: string, patch: Partial<StickyNoteData & { content: string }>) => void;
  onDelete: (id: string) => void;
  onAssign?: (id: string) => void;
}) {
  const { t, locale } = useI18n();
  const palette = stickyNoteColor(note.color);
  const displayBody = memoDisplayBody(note);
  const [draft, setDraft] = useState(displayBody);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing) {
      setDraft(displayBody);
      textareaRef.current?.focus();
    }
  }, [isEditing, displayBody]);

  const saveEdit = useCallback(() => {
    const text = draft.trim();
    onEndEdit();
    if (text !== displayBody) {
      onUpdate(note.id, { content: text });
    }
  }, [draft, displayBody, note.id, onUpdate, onEndEdit]);

  const menuItems = useMemo((): PlanDetailMenuItem[] => {
    const colorItems: PlanDetailMenuItem[] = STICKY_NOTE_COLORS.map((color) => ({
      id: `color-${color.id}`,
      label: localizeStickyColorLabel(t, color.id),
      icon: (
        <span
          className="h-3.5 w-3.5 rounded border border-black/10"
          style={{ backgroundColor: color.bg }}
        />
      ),
      onClick: () => onUpdate(note.id, { color: color.id }),
    }));

    const items: PlanDetailMenuItem[] = [...colorItems];

    if (onAssign) {
      items.push({
        id: "assign",
        label: t("memos.note.assignPlan"),
        icon: <span className="text-xs">↗</span>,
        onClick: () => onAssign(note.id),
      });
    }

    items.push({
      id: "delete",
      label: t("common.delete"),
      icon: <MenuIconDelete />,
      destructive: true,
      onClick: () => onDelete(note.id),
    });

    return items;
  }, [note.id, onAssign, onDelete, onUpdate, t]);

  return (
    <div
      className={cn(
        "w-full shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900",
        isEditing && "ring-2 ring-brand-400 ring-offset-1 dark:ring-offset-gray-950",
      )}
    >
      <div
        className="flex items-center justify-end gap-1 px-2 py-0.5"
        style={{ backgroundColor: palette.bg, borderTop: `3px solid ${palette.border}` }}
      >
        <span className="text-[9px] leading-none opacity-60" style={{ color: palette.text }}>
          {new Date(note.updatedAt).toLocaleDateString(locale === "en-US" ? "en-US" : "zh-CN", {
            month: "numeric",
            day: "numeric",
          })}
        </span>
        {!isEditing && (
          <PlanDetailActionsMenu
            items={menuItems}
            menuClassName="rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900"
          />
        )}
      </div>

      <div className="px-3 pb-3 pt-2">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={saveEdit}
            rows={5}
            className="w-full resize-none rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm text-gray-800 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            placeholder={t("memos.note.placeholder")}
          />
        ) : (
          <button type="button" className="block w-full text-left" onClick={onStartEdit}>
            {displayBody ? (
              <div className="line-clamp-4 text-sm text-gray-600 dark:text-gray-300">
                <MemoMarkdown content={displayBody} />
              </div>
            ) : (
              <p className="text-sm text-gray-400">{t("memos.note.clickToEdit")}</p>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
