import type { FeedActionType, FeedItemType } from "@prisma/client";
import type { MemoQuadrantId } from "@/lib/memo-quadrant";
import { isMemoQuadrantId } from "@/lib/memo-quadrant";
import type { LanguagePreference } from "@/lib/user-preferences";
import { createTranslator, type TranslationKey } from "@/lib/i18n/translate";

type TranslateFn = ReturnType<typeof createTranslator>;

const PLAN_CHANGE_LABEL_KEYS: Record<string, TranslationKey> = {
  title: "feed.planChange.field.title",
  description: "feed.planChange.field.description",
  startDate: "feed.planChange.field.startDate",
  endDate: "feed.planChange.field.endDate",
  actualStartDate: "feed.planChange.field.actualStartDate",
  actualEndDate: "feed.planChange.field.actualEndDate",
  status: "feed.planChange.field.status",
  type: "feed.planChange.field.type",
  priority: "feed.planChange.field.priority",
  color: "feed.planChange.field.color",
  parentPlan: "feed.planChange.field.parentPlan",
  标题: "feed.planChange.field.title",
  描述: "feed.planChange.field.description",
  开始时间: "feed.planChange.field.startDate",
  截至时间: "feed.planChange.field.endDate",
  实际开始时间: "feed.planChange.field.actualStartDate",
  实际结束时间: "feed.planChange.field.actualEndDate",
  状态: "feed.planChange.field.status",
  类型: "feed.planChange.field.type",
  优先级: "feed.planChange.field.priority",
  颜色: "feed.planChange.field.color",
  父计划: "feed.planChange.field.parentPlan",
};

const WEEKDAY_KEYS = [
  "feed.weekday.sun",
  "feed.weekday.mon",
  "feed.weekday.tue",
  "feed.weekday.wed",
  "feed.weekday.thu",
  "feed.weekday.fri",
  "feed.weekday.sat",
] as const;

export function localizeFeedTypeFilterLabel(
  t: TranslateFn,
  id: "all" | FeedItemType,
): string {
  return t(`feed.typeFilter.${id}` as TranslationKey);
}

export function localizeFeedItemTypeLabel(t: TranslateFn, itemType: FeedItemType): string {
  return t(`feed.itemType.${itemType}` as TranslationKey);
}

export function localizeFeedActionPhrase(
  t: TranslateFn,
  actionType: FeedActionType,
  itemType: FeedItemType,
  locale?: LanguagePreference,
): string {
  let type = localizeFeedItemTypeLabel(t, itemType);
  if (locale === "en-US") {
    type = type.toLowerCase();
  }
  const key =
    actionType === "create"
      ? "feed.action.create"
      : actionType === "complete"
        ? "feed.action.complete"
        : actionType === "archive"
          ? "feed.action.archive"
          : "feed.action.update";
  return t(key, { type });
}

export function localizeFeedItemMeta(
  t: TranslateFn,
  itemType: FeedItemType,
  actionType: FeedActionType,
): { label: string; completed: boolean; archived: boolean } {
  return {
    label: localizeFeedItemTypeLabel(t, itemType),
    completed: actionType === "complete",
    archived: actionType === "archive",
  };
}

export function formatFeedCardDate(
  iso: string,
  locale: LanguagePreference,
  t: TranslateFn,
): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  const weekday = t(WEEKDAY_KEYS[d.getDay()] ?? WEEKDAY_KEYS[0]);
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;

  if (locale === "en-US") {
    const month = d.getMonth() + 1;
    const day = d.getDate();
    return t("feed.dateEn", { month, day, weekday, time });
  }

  const month = d.getMonth() + 1;
  const day = d.getDate();
  return t("feed.dateZh", { month, day, weekday, time });
}

export function localizeMemoQuadrantFeed(
  t: TranslateFn,
  quadrantId: string | null | undefined,
): string | null {
  if (!isMemoQuadrantId(quadrantId)) return null;
  const short = t(`feed.memoQuadrant.${quadrantId}.short` as TranslationKey);
  const label = t(`feed.memoQuadrant.${quadrantId}.label` as TranslationKey);
  return `${short} ${label}`;
}

export function localizeMemoQuadrantOption(
  t: TranslateFn,
  quadrantId: MemoQuadrantId,
): { shortLabel: string; label: string; hint: string } {
  return {
    shortLabel: t(`feed.memoQuadrant.${quadrantId}.short` as TranslationKey),
    label: t(`feed.memoQuadrant.${quadrantId}.label` as TranslationKey),
    hint: t(`feed.memoQuadrant.${quadrantId}.hint` as TranslationKey),
  };
}

export function localizePlanChangeLabel(t: TranslateFn, label: string): string {
  const key = PLAN_CHANGE_LABEL_KEYS[label];
  return key ? t(key) : label;
}

export function localizeContributionContext(
  t: TranslateFn,
  planTitle: string | null | undefined,
): string {
  if (planTitle) {
    return t("feed.contextContributionPlan", { plan: planTitle });
  }
  return t("feed.contextContribution");
}
