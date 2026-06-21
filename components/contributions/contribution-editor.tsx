"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui";

export interface ContributionEditorValues {
  title: string;
  body: string;
  occurredOn: string;
  occurredEndOn: string;
  imageUrls: string[];
}

export function ContributionEditor({
  values,
  onChange,
  showDates = true,
  bodyRows = 10,
  bodyPlaceholder = "详细记录执行过程（支持 **Markdown**、代码块、列表…）",
}: {
  values: ContributionEditorValues;
  onChange: (patch: Partial<ContributionEditorValues>) => void;
  showDates?: boolean;
  bodyRows?: number;
  bodyPlaceholder?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="space-y-4">
      <Input
        label="标题"
        value={values.title}
        onChange={(e) => onChange({ title: e.target.value })}
        placeholder="做了什么（必填）"
        required
      />
      {showDates && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="开始日期"
            type="date"
            value={values.occurredOn}
            onChange={(e) => onChange({ occurredOn: e.target.value })}
            required
          />
          <Input
            label="结束日期"
            type="date"
            value={values.occurredEndOn}
            onChange={(e) => onChange({ occurredEndOn: e.target.value })}
          />
        </div>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          详细记录
        </label>
        <textarea
          value={values.body}
          onChange={(e) => onChange({ body: e.target.value })}
          placeholder={bodyPlaceholder}
          rows={bodyRows}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />
      </div>
      {values.imageUrls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.imageUrls.map((url) => (
            <div key={url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-20 w-20 rounded-lg object-cover" />
              <button
                type="button"
                className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gray-900 text-[10px] text-white"
                onClick={() =>
                  onChange({ imageUrls: values.imageUrls.filter((u) => u !== url) })
                }
                aria-label="移除图片"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          multiple
          className="hidden"
          onChange={(e) => void handlePickImages(e.target.files)}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? "上传中…" : "插入图片"}
        </Button>
        <span className="text-xs text-gray-400">支持 Markdown 格式</span>
      </div>
      {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
    </div>
  );
}
