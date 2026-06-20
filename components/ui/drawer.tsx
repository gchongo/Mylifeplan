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
}: {
  open: boolean;
  onClose: () => void;
  panel: React.ReactNode;
  children: React.ReactNode;
  widthClass?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">{children}</div>
      <div
        className={cn(
          "shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out",
          open ? widthClass : "w-0",
        )}
        aria-hidden={!open}
      >
        <aside
          role="complementary"
          aria-labelledby={open ? "drawer-title" : undefined}
          className={cn(
            "flex h-full flex-col border-l border-gray-200 bg-white",
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
