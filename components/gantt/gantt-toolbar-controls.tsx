"use client";

import { useEffect, useRef, useState } from "react";
import { GanttLayerToggleButton } from "@/components/gantt/gantt-layer-toggle-button";
import { useSettings } from "@/components/settings/settings-provider";
import { useI18n } from "@/components/i18n/i18n-provider";
import { GANTT_SCALES, type GanttScaleId } from "@/lib/gantt-scale";
import { localizeGanttScaleLabel } from "@/lib/i18n/gantt-helpers";
import { cn } from "@/lib/utils";

export function GanttToolbarControls({
  scale,
  onScaleChange,
  onPrev,
  onNext,
  onToday,
  className,
}: {
  scale: GanttScaleId;
  onScaleChange: (scale: GanttScaleId) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  className?: string;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { preferences, setGanttActualLine, setGanttContributionMarkers } = useSettings();
  const showActualTimeline = preferences.ganttActualLine.enabled;
  const showContributionMarkers = preferences.ganttContributionMarkers.enabled;

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div className={cn("flex shrink-0 items-center gap-2", className)}>
      <GanttLayerToggleButton
        label={t("gantt.toolbar.contribution")}
        active={showContributionMarkers}
        onToggle={() =>
          setGanttContributionMarkers({ enabled: !showContributionMarkers })
        }
        title={showContributionMarkers ? t("gantt.toolbar.hideContribution") : t("gantt.toolbar.showContribution")}
      />
      <GanttLayerToggleButton
        label={t("gantt.toolbar.actual")}
        active={showActualTimeline}
        onToggle={() => setGanttActualLine({ enabled: !showActualTimeline })}
        title={showActualTimeline ? t("gantt.toolbar.hideActual") : t("gantt.toolbar.showActual")}
      />

      <div className="flex items-center rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <button
          type="button"
          onClick={onPrev}
          className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
          aria-label={t("gantt.toolbar.prev")}
        >
          ‹
        </button>
        <button
          type="button"
          onClick={onToday}
          className="border-x border-gray-200 px-2.5 py-1 text-sm text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800"
        >
          {t("gantt.toolbar.today")}
        </button>
        <button
          type="button"
          onClick={onNext}
          className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
          aria-label={t("gantt.toolbar.next")}
        >
          ›
        </button>
      </div>

      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-sm text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
        >
          {localizeGanttScaleLabel(t, scale)}
          <span className="text-[10px] text-gray-400">▼</span>
        </button>
        {open && (
          <div className="absolute right-0 top-full z-50 mt-1 min-w-[120px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
            {GANTT_SCALES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  onScaleChange(s.id);
                  setOpen(false);
                }}
                className={cn(
                  "block w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800",
                  s.id === scale && "bg-gray-100 font-medium dark:bg-gray-800",
                )}
              >
                {localizeGanttScaleLabel(t, s.id)}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
