"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

const DEFAULT_DRAWER_WIDTH = "w-80 sm:w-96";

export function DrawerPanel({
  title,
  onClose,
  children,
  className,
  onBack,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  onBack?: () => void;
}) {
  return (
    <>
      <div className="flex shrink-0 items-center gap-2 border-b border-gray-100 px-4 py-3">
        {onBack ? (
          <Button variant="ghost" size="sm" onClick={onBack} className="shrink-0 px-2">
            ← 返回
          </Button>
        ) : null}
        <h2 id="drawer-title" className="min-w-0 flex-1 truncate text-base font-semibold text-gray-900">
          {title}
        </h2>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label="关闭" className="shrink-0">
          ✕
        </Button>
      </div>
      <div className={cn("min-h-0 flex-1 overflow-y-auto p-4", className)}>{children}</div>
    </>
  );
}

export function DrawerLayout({
  open,
  onClose,
  panel,
  children,
  widthClass = DEFAULT_DRAWER_WIDTH,
  panelTopOffset = 0,
}: {
  open: boolean;
  onClose: () => void;
  panel: React.ReactNode;
  children: React.ReactNode;
  widthClass?: string;
  /** 面板顶部留白（px），用于不遮挡固定页眉，如甘特图日期行 */
  panelTopOffset?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
      <div
        className={cn(
          "relative z-10 shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out",
          open ? widthClass : "w-0",
        )}
        aria-hidden={!open}
      >
        <aside
          role="complementary"
          aria-labelledby={open ? "drawer-title" : undefined}
          style={
            panelTopOffset > 0
              ? { marginTop: panelTopOffset, height: `calc(100% - ${panelTopOffset}px)` }
              : undefined
          }
          className={cn(
            "flex flex-col border-l border-gray-200 bg-white",
            panelTopOffset === 0 && "h-full",
            widthClass,
            !open && "pointer-events-none opacity-0",
          )}
        >
          {panel}
        </aside>
      </div>
    </div>
  );
}

/** @deprecated Use DrawerLayout + DrawerPanel for push-style drawers. */
export function Drawer({
  open,
  onClose,
  title,
  children,
  className,
  onBack,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  onBack?: () => void;
}) {
  if (!open) return null;

  return (
    <DrawerLayout
      open={open}
      onClose={onClose}
      panel={
        <DrawerPanel title={title} onClose={onClose} onBack={onBack} className={className}>
          {children}
        </DrawerPanel>
      }
    >
      <div className="min-h-0 min-w-0 flex-1" aria-hidden />
    </DrawerLayout>
  );
}
