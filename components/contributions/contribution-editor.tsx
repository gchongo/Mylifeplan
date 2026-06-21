"use client";

import {
  FeedComposeCard,
  type FeedComposeValues,
} from "@/components/feed/feed-compose-card";
import { ContributionMarkerColorField } from "@/components/contributions/contribution-marker-color-field";
import { nowDatetimeLocal, toDatetimeLocalInput } from "@/lib/dates";

export interface ContributionEditorValues {
  title: string;
  body: string;
  occurredOn: string;
  occurredEndOn: string;
  imageUrls: string[];
  markerColor: string | null;
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

function normalizeContributionDateTime(value: string): string {
  if (!value) return "";
  return value.includes("T") ? value.slice(0, 16) : `${value}T09:00`;
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
  const shared = {
    values: toComposeValues(values),
    onChange: (patch: Partial<FeedComposeValues>) => onChange(fromComposePatch(patch)),
    timeKind: "datetime" as const,
    startRequired: true,
    showImages: true,
    bodyRows,
  };

  if (mode === "compact") {
    return (
      <div className="space-y-4">
        <FeedComposeCard
          {...shared}
          titlePlaceholder="标题"
          bodyPlaceholder="详细记录"
        />
        <ContributionMarkerColorField
          value={values.markerColor}
          onChange={(markerColor) => onChange({ markerColor })}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <FeedComposeCard
        {...shared}
        titlePlaceholder="贡献标题"
        bodyPlaceholder="详细记录"
      />
      <ContributionMarkerColorField
        value={values.markerColor}
        onChange={(markerColor) => onChange({ markerColor })}
      />
    </div>
  );
}

export function emptyContributionValues(
  startDate?: string,
  endDate?: string,
): ContributionEditorValues {
  const start = normalizeContributionDateTime(startDate ?? nowDatetimeLocal());
  const end = normalizeContributionDateTime(endDate ?? start);
  return {
    title: "",
    body: "",
    occurredOn: start,
    occurredEndOn: end,
    imageUrls: [],
    markerColor: null,
  };
}

export function contributionValuesFromApi(detail: {
  occurredOn: string;
  occurredEndOn?: string | null;
}): Pick<ContributionEditorValues, "occurredOn" | "occurredEndOn"> {
  const start = normalizeContributionDateTime(toDatetimeLocalInput(detail.occurredOn) || detail.occurredOn);
  const end = detail.occurredEndOn
    ? normalizeContributionDateTime(toDatetimeLocalInput(detail.occurredEndOn) || detail.occurredEndOn)
    : start;
  return { occurredOn: start, occurredEndOn: end };
}
