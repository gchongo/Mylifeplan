"use client";

import { useI18n } from "@/components/i18n/i18n-provider";

export function PlansBoardTitle() {
  const { t } = useI18n();
  return (
    <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t("plans.boardTitle")}</h1>
  );
}
