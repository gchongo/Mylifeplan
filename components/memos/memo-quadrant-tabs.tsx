"use client";

import { useI18n } from "@/components/i18n/i18n-provider";
import { MOBILE_MEMO_QUADRANT_TAB_ORDER, type MemoQuadrantId } from "@/lib/memo-quadrant";
import { localizeMemoQuadrantOption } from "@/lib/i18n/feed-helpers";
import { cn } from "@/lib/utils";

export function MemoQuadrantTabs({
  value,
  onChange,
}: {
  value: MemoQuadrantId;
  onChange: (quadrant: MemoQuadrantId) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="mb-2 grid grid-cols-4 gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-900">
      {MOBILE_MEMO_QUADRANT_TAB_ORDER.map((quadrantId) => {
        const option = localizeMemoQuadrantOption(t, quadrantId);
        const active = value === quadrantId;
        return (
          <button
            key={quadrantId}
            type="button"
            onClick={() => onChange(quadrantId)}
            title={option.hint}
            className={cn(
              "rounded-md px-1 py-1.5 text-[10px] font-medium leading-tight transition-colors",
              active
                ? "bg-white text-brand-700 shadow-sm dark:bg-gray-800 dark:text-brand-300"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200",
            )}
          >
            {option.shortLabel}
          </button>
        );
      })}
    </div>
  );
}
