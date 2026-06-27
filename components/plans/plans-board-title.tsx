"use client";

import { useI18n } from "@/components/i18n/i18n-provider";
import { panelSectionTitleClass } from "@/lib/panel-title";
import { cn } from "@/lib/utils";

export function PlansBoardTitle({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <h1 className={cn(panelSectionTitleClass, className)}>{t("plans.boardTitle")}</h1>
  );
}
