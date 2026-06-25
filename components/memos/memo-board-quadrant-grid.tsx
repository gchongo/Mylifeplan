"use client";

import { useI18n } from "@/components/i18n/i18n-provider";
import { localizeMemoQuadrantOption } from "@/lib/i18n/feed-helpers";
import {
  DEFAULT_MEMO_BOARD_AXIS,
  MEMO_QUADRANTS,
  resolveMemoBoardAxisPixels,
} from "@/lib/memo-quadrant";
import { cn } from "@/lib/utils";

function AxisIconImportant({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" />
    </svg>
  );
}

function AxisIconNotImportant({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <circle cx="12" cy="12" r="8" />
      <path strokeLinecap="round" d="M8 12h8" />
    </svg>
  );
}

function AxisIconUrgent({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
    </svg>
  );
}

function AxisIconNotUrgent({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <circle cx="12" cy="12" r="8" />
      <path strokeLinecap="round" d="M12 8v4l2.5 2.5" />
    </svg>
  );
}

export function MemoBoardAxisEdgeIcons() {
  const { t } = useI18n();
  const iconClass = "h-4 w-4 text-gray-500/80 dark:text-gray-400/80";
  return (
    <>
      <span
        className="pointer-events-none absolute left-1/2 top-1.5 z-20 -translate-x-1/2"
        title={t("memos.axis.important")}
        aria-label={t("memos.axis.important")}
      >
        <AxisIconImportant className={iconClass} />
      </span>
      <span
        className="pointer-events-none absolute bottom-1.5 left-1/2 z-20 -translate-x-1/2"
        title={t("memos.axis.notImportant")}
        aria-label={t("memos.axis.notImportant")}
      >
        <AxisIconNotImportant className={iconClass} />
      </span>
      <span
        className="pointer-events-none absolute left-2 top-1/2 z-20 -translate-y-1/2"
        title={t("memos.axis.notUrgent")}
        aria-label={t("memos.axis.notUrgent")}
      >
        <AxisIconNotUrgent className={iconClass} />
      </span>
      <span
        className="pointer-events-none absolute right-2 top-1/2 z-20 -translate-y-1/2"
        title={t("memos.axis.urgent")}
        aria-label={t("memos.axis.urgent")}
      >
        <AxisIconUrgent className={iconClass} />
      </span>
    </>
  );
}

export function MemoBoardQuadrantGrid({
  boardWidth,
  boardHeight,
}: {
  boardWidth: number;
  boardHeight: number;
}) {
  const { t } = useI18n();
  const { axisX, axisY } = resolveMemoBoardAxisPixels(
    boardWidth,
    boardHeight,
    DEFAULT_MEMO_BOARD_AXIS,
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-[5]" aria-hidden>
      {MEMO_QUADRANTS.map((q) => {
        const bounds = (() => {
          switch (q.id) {
            case "urgent_important":
              return { left: axisX, top: 0, width: boardWidth - axisX, height: axisY };
            case "not_urgent_important":
              return { left: 0, top: 0, width: axisX, height: axisY };
            case "urgent_not_important":
              return { left: axisX, top: axisY, width: boardWidth - axisX, height: boardHeight - axisY };
            default:
              return { left: 0, top: axisY, width: axisX, height: boardHeight - axisY };
          }
        })();
        return (
          <div
            key={q.id}
            className="absolute border border-dashed border-black/10 dark:border-white/10"
            style={{
              left: bounds.left,
              top: bounds.top,
              width: bounds.width,
              height: bounds.height,
            }}
          >
            <span
              className={cn(
                "pointer-events-none absolute inline-flex gap-1 text-[10px] font-bold text-gray-500/70 dark:text-gray-400/70",
                q.id === "urgent_important" && "right-0 top-0 p-1.5",
                q.id === "not_urgent_important" && "left-0 top-0 p-1.5",
                q.id === "not_urgent_not_important" && "bottom-0 left-0 p-1.5",
                q.id === "urgent_not_important" && "bottom-0 right-0 p-1.5",
              )}
            >
              <span>{localizeMemoQuadrantOption(t, q.id).shortLabel}</span>
              <span className="font-normal opacity-90">{localizeMemoQuadrantOption(t, q.id).label}</span>
            </span>
          </div>
        );
      })}

      <div
        className="absolute top-0 w-px bg-black/20 dark:bg-white/20"
        style={{ left: axisX, height: boardHeight }}
      />
      <div
        className="absolute left-0 h-px bg-black/20 dark:bg-white/20"
        style={{ top: axisY, width: boardWidth }}
      />
    </div>
  );
}
