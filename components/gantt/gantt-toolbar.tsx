"use client";

import { useEffect, useRef, useState } from "react";
import { GANTT_SCALES, type GanttScaleId } from "@/lib/gantt-scale";
import { cn } from "@/lib/utils";

export function GanttToolbar({
  scale,
  onScaleChange,
  onPrev,
  onNext,
  onToday,
}: {
  scale: GanttScaleId;
  onScaleChange: (scale: GanttScaleId) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = GANTT_SCALES.find((s) => s.id === scale)!;

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-gray-200 bg-white px-3 py-2">
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-50"
        >
          {current.label}
          <span className="text-[10px] text-gray-400">▼</span>
        </button>
        {open && (
          <div className="absolute left-0 top-full z-50 mt-1 min-w-[120px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            {GANTT_SCALES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  onScaleChange(s.id);
                  setOpen(false);
                }}
                className={cn(
                  "block w-full px-4 py-2 text-left text-sm hover:bg-gray-50",
                  s.id === scale && "bg-gray-100 font-medium",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center rounded-lg border border-gray-200">
        <button
          type="button"
          onClick={onPrev}
          className="px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          aria-label="上一段"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={onToday}
          className="border-x border-gray-200 px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-50"
        >
          今天
        </button>
        <button
          type="button"
          onClick={onNext}
          className="px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          aria-label="下一段"
        >
          ›
        </button>
      </div>
    </div>
  );
}
