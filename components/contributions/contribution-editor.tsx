"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ContributionEditorValues {
  title: string;
  body: string;
  occurredOn: string;
  occurredEndOn: string;
  imageUrls: string[];
}

function insertAroundSelection(
  textarea: HTMLTextAreaElement,
  before: string,
  after: string,
  placeholder: string,
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.slice(start, end) || placeholder;
  const next =
    textarea.value.slice(0, start) + before + selected + after + textarea.value.slice(end);
  const cursor = start + before.length + selected.length + after.length;
  return { next, cursor };
}

export function ContributionEditor({
  values,
  onChange,
  mode = "compose",
  bodyRows = 12,
}: {
  values: ContributionEditorValues;
  onChange: (patch: Partial<ContributionEditorValues>) => void;
  mode?: "compose" | "compact";
  bodyRows?: number;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  async function uploadFile(file: File) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/contributions/upload", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "上传失败");
    return data.url as string;
  }

  async function handlePickImages(files: FileList | null) {
    if (!files?.length) return;
    setUploadError("");
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        urls.push(await uploadFile(file));
      }
      onChange({ imageUrls: [...values.imageUrls, ...urls] });
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "上传失败");
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
    const { next, cursor } = insertAroundSelection(el, before, after, placeholder);
    applyBodyEdit(next, cursor);
  }

  function insertLine(prefix: string) {
    const el = bodyRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const value = el.value;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const next = value.slice(0, lineStart) + prefix + value.slice(lineStart);
    applyBodyEdit(next, lineStart + prefix.length);
  }

  const toolbar = (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-100 px-2 py-1.5 dark:border-gray-800">
      <ToolbarBtn title="粗体" onClick={() => wrapMarkdown("**", "**", "粗体")}>
        <strong className="text-xs">B</strong>
      </ToolbarBtn>
      <ToolbarBtn title="斜体" onClick={() => wrapMarkdown("*", "*", "斜体")}>
        <em className="text-xs">I</em>
      </ToolbarBtn>
      <ToolbarBtn title="链接" onClick={() => wrapMarkdown("[", "](url)", "链接文字")}>
        <LinkIcon />
      </ToolbarBtn>
      <ToolbarBtn title="引用" onClick={() => insertLine("> ")}>
        <QuoteIcon />
      </ToolbarBtn>
      <ToolbarBtn title="列表" onClick={() => insertLine("- ")}>
        <ListIcon />
      </ToolbarBtn>
      <ToolbarBtn title="代码" onClick={() => wrapMarkdown("`", "`", "code")}>
        <CodeIcon />
      </ToolbarBtn>
      <span className="mx-1 h-4 w-px bg-gray-200 dark:bg-gray-700" />
      <ToolbarBtn title="插入图片" disabled={uploading} onClick={() => fileRef.current?.click()}>
        <ImageIcon />
      </ToolbarBtn>
      <span className="ml-auto text-[10px] text-gray-400">Markdown</span>
    </div>
  );

  const bodyArea = (
    <>
      {mode === "compose" && toolbar}
      <textarea
        ref={bodyRef}
        value={values.body}
        onChange={(e) => onChange({ body: e.target.value })}
        placeholder="在此处输入。支持 Markdown 排版，可拖入图片或点击工具栏上传。（可选）"
        rows={bodyRows}
        className={cn(
          "w-full resize-y bg-transparent px-4 py-3 text-sm leading-relaxed text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-gray-100",
          mode === "compose" ? "min-h-[180px]" : "rounded-lg border border-gray-200 dark:border-gray-700",
        )}
      />
    </>
  );

  const imageStrip =
    values.imageUrls.length > 0 ? (
      <div className="flex flex-wrap gap-2 border-t border-gray-100 px-4 py-2 dark:border-gray-800">
        {values.imageUrls.map((url) => (
          <div key={url} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-16 w-16 rounded object-cover" />
            <button
              type="button"
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gray-900 text-[10px] text-white"
              onClick={() => onChange({ imageUrls: values.imageUrls.filter((u) => u !== url) })}
              aria-label="移除图片"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    ) : null;

  const fileInput = (
    <input
      ref={fileRef}
      type="file"
      accept="image/jpeg,image/png,image/gif,image/webp"
      multiple
      className="hidden"
      onChange={(e) => void handlePickImages(e.target.files)}
    />
  );

  if (mode === "compact") {
    return (
      <div className="space-y-4">
        <input
          type="text"
          value={values.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="标题（必填）"
          required
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-gray-600">开始日期 *</span>
            <input
              type="date"
              value={values.occurredOn}
              onChange={(e) => onChange({ occurredOn: e.target.value })}
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-gray-600">结束日期</span>
            <input
              type="date"
              value={values.occurredEndOn}
              onChange={(e) => onChange({ occurredEndOn: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            />
          </label>
        </div>
        <div>
          <p className="mb-1 text-sm text-gray-600">正文（可选）</p>
          {bodyArea}
        </div>
        {imageStrip}
        {fileInput}
        {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <input
        type="text"
        value={values.title}
        onChange={(e) => onChange({ title: e.target.value })}
        placeholder="输入标题，简要说明本次贡献"
        required
        className="w-full border-b border-gray-100 bg-transparent px-4 py-3 text-base font-medium text-gray-900 placeholder:font-normal placeholder:text-gray-400 focus:outline-none dark:border-gray-800 dark:text-gray-100"
      />

      <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-4 py-2 dark:border-gray-800">
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <CalendarIcon />
          <span className="sr-only">贡献日期</span>
          <input
            type="date"
            value={values.occurredOn}
            onChange={(e) => onChange({ occurredOn: e.target.value })}
            required
            className="rounded border border-gray-200 bg-white px-2 py-1 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
          />
          <span className="text-red-500">*</span>
        </label>
        <span className="text-xs text-gray-400">至</span>
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <input
            type="date"
            value={values.occurredEndOn}
            onChange={(e) => onChange({ occurredEndOn: e.target.value })}
            className="rounded border border-gray-200 bg-white px-2 py-1 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
          />
          <span className="text-xs text-gray-400">（可选）</span>
        </label>
      </div>

      {bodyArea}
      {imageStrip}
      {fileInput}
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

function CalendarIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
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
