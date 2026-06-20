"use client";

import { cn } from "@/lib/utils";

export function PanelResizeHandle({
  orientation,
  onMouseDown,
  className,
}: {
  /** horizontal = 上下拖拽改高度；vertical = 左右拖拽改宽度 */
  orientation: "horizontal" | "vertical";
  onMouseDown: (e: React.MouseEvent) => void;
  className?: string;
}) {
  const isHorizontal = orientation === "horizontal";

  return (
    <div
      role="separator"
      aria-orientation={isHorizontal ? "horizontal" : "vertical"}
      onMouseDown={onMouseDown}
      className={cn(
        "group z-10 shrink-0 select-none",
        isHorizontal
          ? "flex h-3 cursor-row-resize items-center justify-center py-0.5"
          : "flex w-3 cursor-col-resize items-center justify-center px-0.5",
        className,
      )}
    >
      <div
        className={cn(
          "rounded-full bg-gray-200 transition-colors group-hover:bg-brand-300 group-active:bg-brand-400",
          isHorizontal ? "h-1 w-12" : "h-12 w-1",
        )}
      />
    </div>
  );
}
