"use client";

import {
  FeedComposeCard,
  type FeedComposeValues,
} from "@/components/feed/feed-compose-card";
import { todayStr } from "@/lib/dates";

export interface ContributionEditorValues {
  title: string;
  body: string;
  occurredOn: string;
  occurredEndOn: string;
  imageUrls: string[];
}

function toComposeValues(v: ContributionEditorValues): FeedComposeValues {
  return {
    title: v.title,
    body: v.body,
    startAt: v.occurredOn,
    endAt: v.occurredEndOn,
    imageUrls: v.imageUrls,
  };
}

function fromComposePatch(
  patch: Partial<FeedComposeValues>,
): Partial<ContributionEditorValues> {
  const out: Partial<ContributionEditorValues> = {};
  if (patch.title !== undefined) out.title = patch.title;
  if (patch.body !== undefined) out.body = patch.body;
  if (patch.startAt !== undefined) out.occurredOn = patch.startAt;
  if (patch.endAt !== undefined) out.occurredEndOn = patch.endAt;
  if (patch.imageUrls !== undefined) out.imageUrls = patch.imageUrls;
  return out;
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
  if (mode === "compact") {
    return (
      <FeedComposeCard
        values={toComposeValues(values)}
        onChange={(patch) => onChange(fromComposePatch(patch))}
        timeKind="date"
        startRequired
        titlePlaceholder="标题（必填）"
        bodyPlaceholder="详细记录（可选）"
        showImages
        bodyRows={bodyRows}
      />
    );
  }

  return (
    <FeedComposeCard
      values={toComposeValues(values)}
      onChange={(patch) => onChange(fromComposePatch(patch))}
      timeKind="date"
      startRequired
      titlePlaceholder="输入标题，简要说明本次贡献"
      bodyPlaceholder="在此处输入。支持 Markdown 排版，可拖入图片或点击工具栏上传。（可选）"
      showImages
      bodyRows={bodyRows}
    />
  );
}

export function emptyContributionValues(
  startDate = todayStr(),
  endDate?: string,
): ContributionEditorValues {
  return {
    title: "",
    body: "",
    occurredOn: startDate,
    occurredEndOn: endDate ?? startDate,
    imageUrls: [],
  };
}
