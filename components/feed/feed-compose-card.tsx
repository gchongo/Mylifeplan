"use client";

import { useRef, useState } from "react";
import { PlanDateTimeField } from "@/components/forms/plan-datetime-field";
import { useI18n } from "@/components/i18n/i18n-provider";
import { cn } from "@/lib/utils";

export interface FeedComposeValues {
  title: string;
  body: string;
  startAt: string;
  endAt: string;
  imageUrls: string[];
}

export function FeedComposeCard({
  values,
  onChange,
  timeKind = "date",
  startRequired = false,
  titleRequired = true,
  titlePlaceholder,
  bodyPlaceholder,
  showImages = false,
  imageUploadUrl = "/api/contributions/upload",
  relatedPlan,
  bodyRows = 8,
}: {
  values: FeedComposeValues;
  onChange: (patch: Partial<FeedComposeValues>) => void;
  timeKind?: "date" | "datetime";
  startRequired?: boolean;
  titleRequired?: boolean;
  titlePlaceholder?: string;
  bodyPlaceholder?: string;
  showImages?: boolean;
  imageUploadUrl?: string;
  relatedPlan?: React.ReactNode;
  bodyRows?: number;
}) {
  const { t } = useI18n();
  const resolvedTitlePlaceholder = titlePlaceholder ?? t("feed.composeCard.titlePlaceholder");
  const resolvedBodyPlaceholder = bodyPlaceholder ?? t("feed.composeCard.bodyPlaceholder");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  async function uploadFile(file: File) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(imageUploadUrl, { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? t("feed.composeCard.uploadFailed"));
    return data.url as string;
  }

  async function handlePickImages(files: FileList | null) {
    if (!files?.length || !showImages) return;
    setUploadError("");
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        urls.push(await uploadFile(file));
      }
      onChange({ imageUrls: [...values.imageUrls, ...urls] });
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : t("feed.composeCard.uploadFailed"));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function applyBodyEdit(next: string, cursor?: number) {
    onChange({ body: next });
    requestAnimationFrame(() => {
      if (bodyRef.current && cursor != null) {
        bodyRef.current.focus();
        bodyRef.current.setSelectionRange(cursor, cursor);
      }
    });
  }

  function wrapMarkdown(before: string, after: string, placeholder: string) {
    const el = bodyRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = el.value.slice(start, end) || placeholder;
    const next =
      el.value.slice(0, start) + before + selected + after + el.value.slice(end);
    const cursor = start + before.length + selected.length + after.length;
    applyBodyEdit(next, cursor);
  }

  function insertLine(prefix: string) {
    const el = bodyRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const lineStart = el.value.lastIndexOf("\n", start - 1) + 1;
    const next = el.value.slice(0, lineStart) + prefix + el.value.slice(lineStart);
    applyBodyEdit(next, lineStart + prefix.length);
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      {/* 1. 标题 */}
      <div className="relative border-b border-gray-100 dark:border-gray-800">
        <input
          type="text"
          value={values.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder={resolvedTitlePlaceholder}
          required
          className="w-full bg-transparent px-4 py-3 pr-8 text-base font-medium text-gray-900 placeholder:font-normal placeholder:text-gray-400 focus:outline-none dark:text-gray-100"
        />
        {titleRequired && (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-red-500">
            *
          </span>
        )}
      </div>

      {/* 2. 时间 */}
      <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-4 py-2 dark:border-gray-800">
        <PlanDateTimeField
          value={values.startAt}
          onConfirm={(next) => onChange({ startAt: next })}
          mode={timeKind}
          edge="start"
          placeholder={timeKind === "datetime" ? t("feed.composeCard.startTime") : t("feed.composeCard.startDate")}
          size="sm"
          className="w-auto min-w-[9rem]"
          triggerClassName="w-auto min-w-[9rem]"
        />
        {startRequired && <span className="text-red-500">*</span>}
        <span className="text-xs text-gray-400">{t("feed.composeCard.to")}</span>
        <PlanDateTimeField
          value={values.endAt}
          onConfirm={(next) => onChange({ endAt: next })}
          mode={timeKind}
          edge="end"
          placeholder={timeKind === "datetime" ? t("feed.composeCard.endTime") : t("feed.composeCard.endDate")}
          size="sm"
          className="w-auto min-w-[9rem]"
          triggerClassName="w-auto min-w-[9rem]"
        />
      </div>

      {/* 3. 内容 / 描述 */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-100 px-2 py-1.5 dark:border-gray-800">
        <ToolbarBtn title={t("feed.composeCard.toolbarBold")} onClick={() => wrapMarkdown("**", "**", t("feed.composeCard.placeholderBold"))}>
          <strong className="text-xs">B</strong>
        </ToolbarBtn>
        <ToolbarBtn title={t("feed.composeCard.toolbarItalic")} onClick={() => wrapMarkdown("*", "*", t("feed.composeCard.placeholderItalic"))}>
          <em className="text-xs">I</em>
        </ToolbarBtn>
        <ToolbarBtn title={t("feed.composeCard.toolbarLink")} onClick={() => wrapMarkdown("[", "](url)", t("feed.composeCard.placeholderLink"))}>
          <LinkIcon />
        </ToolbarBtn>
        <ToolbarBtn title={t("feed.composeCard.toolbarQuote")} onClick={() => insertLine("> ")}>
          <QuoteIcon />
        </ToolbarBtn>
        <ToolbarBtn title={t("feed.composeCard.toolbarList")} onClick={() => insertLine("- ")}>
          <ListIcon />
        </ToolbarBtn>
        <ToolbarBtn title={t("feed.composeCard.toolbarCode")} onClick={() => wrapMarkdown("`", "`", "code")}>
          <CodeIcon />
        </ToolbarBtn>
        {showImages && (
          <>
            <span className="mx-1 h-4 w-px bg-gray-200 dark:bg-gray-700" />
            <ToolbarBtn
              title={t("feed.composeCard.toolbarInsertImage")}
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              <ImageIcon />
            </ToolbarBtn>
          </>
        )}
        <span className="ml-auto text-[10px] text-gray-400">Markdown</span>
      </div>

      <textarea
        ref={bodyRef}
        value={values.body}
        onChange={(e) => onChange({ body: e.target.value })}
        placeholder={resolvedBodyPlaceholder}
        rows={bodyRows}
        className="min-h-[140px] w-full resize-y bg-transparent px-4 py-3 text-sm leading-relaxed text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-gray-100"
      />

      {showImages && values.imageUrls.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-gray-100 px-4 py-2 dark:border-gray-800">
          {values.imageUrls.map((url) => (
            <div key={url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-16 w-16 rounded object-cover" />
              <button
                type="button"
                className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gray-900 text-[10px] text-white"
                onClick={() =>
                  onChange({ imageUrls: values.imageUrls.filter((u) => u !== url) })
                }
                aria-label={t("feed.composeCard.removeImage")}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {showImages && (
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          multiple
          className="hidden"
          onChange={(e) => void handlePickImages(e.target.files)}
        />
      )}

      {/* 4. 关联计划 */}
      {relatedPlan && (
        <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-800">{relatedPlan}</div>
      )}

      {uploadError && <p className="px-4 pb-2 text-xs text-red-600">{uploadError}</p>}
    </div>
  );
}

function ToolbarBtn({
  children,
  title,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded text-gray-500 hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-gray-800"
    >
      {children}
    </button>
  );
}

function LinkIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path strokeLinecap="round" d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function QuoteIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.016 3.016 0 0 1-2.748 2.991 2.779 2.779 0 0 1-1.501-.319zm9.007 0C12.553 16.227 12 15 12 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.016 3.016 0 0 1-2.748 2.991 2.779 2.779 0 0 1-1.501-.319z" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" d="m16 18 6-6-6-6M8 6l-6 6 6 6" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
    </svg>
  );
}
