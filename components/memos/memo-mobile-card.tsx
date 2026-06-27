"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { MemoMarkdown } from "@/components/memos/memo-markdown";
import type { StickyNoteData } from "@/components/memos/sticky-note";
import { localizeStickyColorLabel } from "@/lib/i18n/memo-helpers";
import { memoDisplayBody } from "@/lib/memo-content";
import { STICKY_NOTE_COLORS, stickyNoteColor, type StickyNoteColorId } from "@/lib/memo-sticky";
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
  const [showColors, setShowColors] = useState(false);
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

  const title = note.title.trim() || displayBody.split("\n")[0]?.slice(0, 80) || t("memos.note.defaultTitle");

  return (
    <div
      className={cn(
        "w-full shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900",
        isEditing && "ring-2 ring-brand-400 ring-offset-1 dark:ring-offset-gray-950",
      )}
    >
      <div className="px-3 py-2" style={{ backgroundColor: palette.bg, borderTop: `3px solid ${palette.border}` }}>
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            className="min-w-0 flex-1 text-left text-sm font-semibold"
            style={{ color: palette.text }}
            onClick={() => (isEditing ? saveEdit() : onStartEdit())}
          >
            {title}
          </button>
          <span className="shrink-0 text-[10px] opacity-60" style={{ color: palette.text }}>
            {new Date(note.updatedAt).toLocaleDateString(locale === "en-US" ? "en-US" : "zh-CN", {
              month: "numeric",
              day: "numeric",
            })}
          </span>
        </div>
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
          <button
            type="button"
            className="block w-full text-left"
            onClick={onStartEdit}
          >
            {displayBody ? (
              <div className="line-clamp-4 text-sm text-gray-600 dark:text-gray-300">
                <MemoMarkdown content={displayBody} />
              </div>
            ) : (
              <p className="text-sm text-gray-400">{t("memos.note.clickToEdit")}</p>
            )}
          </button>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-1">
          <div className="relative">
            <button
              type="button"
              className="rounded-lg px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setShowColors((v) => !v)}
            >
              {localizeStickyColorLabel(t, note.color as StickyNoteColorId)}
            </button>
            {showColors && (
              <div className="absolute left-0 top-full z-10 mt-1 flex gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
                {STICKY_NOTE_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    title={localizeStickyColorLabel(t, c.id)}
                    className="h-6 w-6 rounded-md border border-black/10"
                    style={{ backgroundColor: c.bg }}
                    onClick={() => {
                      onUpdate(note.id, { color: c.id });
                      setShowColors(false);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
          {onAssign && (
            <button
              type="button"
              className="rounded-lg px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => onAssign(note.id)}
            >
              {t("memos.note.assignPlan")}
            </button>
          )}
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
            onClick={() => onDelete(note.id)}
          >
            {t("common.delete")}
          </button>
        </div>
      </div>
    </div>
  );
}
