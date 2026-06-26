"use client";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/i18n-provider";
import { PanelResizeHandle } from "@/components/home/panel-resize-handle";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const DEFAULT_DRAWER_WIDTH = "w-80 sm:w-96";

export type DrawerPlacement = "end" | "bottom";

export function DrawerPanel({
  title,
  onClose,
  children,
  className,
  onBack,
}: {
  title?: string | null;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  onBack?: () => void;
}) {
  const { t } = useI18n();
  const showHeader = Boolean(title || onBack);

  return (
    <>
      {showHeader && (
        <div className="flex shrink-0 items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          {onBack ? (
            <Button variant="ghost" size="sm" onClick={onBack} className="shrink-0 px-2">
              {t("common.back")}
            </Button>
          ) : null}
          {title ? (
            <h2 id="drawer-title" className="min-w-0 flex-1 truncate text-base font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h2>
          ) : (
            <div className="min-w-0 flex-1" />
          )}
          <Button variant="ghost" size="sm" onClick={onClose} aria-label={t("common.close")} className="shrink-0">
            ✕
          </Button>
        </div>
      )}
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
  placement = "end",
  panelTopOffset = 0,
  panelWidthPx,
  onPanelWidthPxChange,
  panelMinWidthPx = 184,
  panelMaxWidthPx,
  resizable = false,
}: {
  open: boolean;
  onClose: () => void;
  panel: React.ReactNode;
  children: React.ReactNode;
  widthClass?: string;
  placement?: DrawerPlacement;
  panelTopOffset?: number;
  panelWidthPx?: number;
  onPanelWidthPxChange?: (width: number) => void;
  panelMinWidthPx?: number;
  panelMaxWidthPx?: number;
  resizable?: boolean;
}) {
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (placement === "bottom") {
    return (
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {children}
        {open && (
          <>
            <button
              type="button"
              className="absolute inset-0 z-40 bg-black/40"
              aria-label="close"
              onClick={onClose}
            />
            <aside
              role="complementary"
              aria-labelledby="drawer-title"
              className="absolute bottom-0 left-0 right-0 z-50 flex max-h-[min(85dvh,640px)] flex-col rounded-t-2xl border-t border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-950"
            >
              {panel}
            </aside>
          </>
        )}
      </div>
    );
  }

  const usePixelWidth = panelWidthPx != null;
  const openWidthPx = usePixelWidth ? (open ? panelWidthPx : 0) : 0;
  const widthTransition = isResizing ? "none" : "width 300ms ease-in-out";

  function startResize(clientX: number) {
    if (!onPanelWidthPxChange || panelWidthPx == null) return;
    setIsResizing(true);
    const applyWidth = onPanelWidthPxChange;
    const startX = clientX;
    const startWidth = panelWidthPx;
    const maxWidth =
      panelMaxWidthPx != null ? panelMaxWidthPx : Number.POSITIVE_INFINITY;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    function onMove(e: MouseEvent) {
      const delta = startX - e.clientX;
      const next = Math.min(maxWidth, Math.max(panelMinWidthPx, startWidth + delta));
      applyWidth(next);
    }

    function onUp(e: MouseEvent) {
      const delta = startX - e.clientX;
      const next = Math.min(maxWidth, Math.max(panelMinWidthPx, startWidth + delta));
      applyWidth(next);
      setIsResizing(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
      {open && resizable && onPanelWidthPxChange && (
        <PanelResizeHandle
          orientation="vertical"
          onMouseDown={(e) => {
            e.preventDefault();
            startResize(e.clientX);
          }}
          className="self-stretch"
        />
      )}
      <div
        className={cn(
          "relative z-10 shrink-0 overflow-hidden",
          !usePixelWidth && !isResizing && "transition-[width] duration-300 ease-in-out",
          !usePixelWidth && (open ? widthClass : "w-0"),
        )}
        style={
          usePixelWidth
            ? { width: openWidthPx, transition: widthTransition }
            : undefined
        }
        aria-hidden={!open}
      >
        <aside
          role="complementary"
          aria-labelledby={open ? "drawer-title" : undefined}
          style={{
            ...(panelTopOffset > 0
              ? { marginTop: panelTopOffset, height: `calc(100% - ${panelTopOffset}px)` }
              : {}),
            ...(usePixelWidth ? { width: panelWidthPx } : {}),
          }}
          className={cn(
            "flex h-full flex-col border-l border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950",
            !usePixelWidth && widthClass,
            !open && "pointer-events-none",
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
