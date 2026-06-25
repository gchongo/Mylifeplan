"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/components/i18n/i18n-provider";
import { computeFloatingMenuPosition } from "@/lib/floating-menu-position";
import { cn } from "@/lib/utils";

export interface PlanDetailMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

export function PlanDetailActionsMenu({
  items,
  disabled = false,
  menuClassName,
}: {
  items: PlanDetailMenuItem[];
  disabled?: boolean;
  menuClassName?: string;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updateMenuPos = useCallback(() => {
    const el = buttonRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const menuHeight =
      menuRef.current?.offsetHeight ?? items.length * 40 + 8;
    setMenuPos(
      computeFloatingMenuPosition(rect, menuHeight, 176, { gap: 4, viewportPadding: 8 }),
    );
  }, [items.length]);

  useLayoutEffect(() => {
    if (!open) return;
    updateMenuPos();
    const frame = requestAnimationFrame(updateMenuPos);
    return () => cancelAnimationFrame(frame);
  }, [open, updateMenuPos]);

  useEffect(() => {
    if (!open) return;

    function onDocPointer(e: MouseEvent) {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    }

    function onScroll() {
      updateMenuPos();
    }

    document.addEventListener("mousedown", onDocPointer);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", updateMenuPos);
    return () => {
      document.removeEventListener("mousedown", onDocPointer);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", updateMenuPos);
    };
  }, [open, updateMenuPos]);

  function run(item: PlanDetailMenuItem) {
    if (item.disabled) return;
    setOpen(false);
    item.onClick();
  }

  const menu =
    open && menuPos && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={menuRef}
            data-no-pan
            className={cn(
              "fixed z-[200] w-44 py-1",
              menuClassName ??
                "rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900",
            )}
            style={{ top: menuPos.top, left: menuPos.left }}
          >
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                data-no-pan
                disabled={item.disabled || disabled}
                onClick={() => run(item)}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800",
                  item.destructive
                    ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                    : "text-gray-700 dark:text-gray-200",
                  (item.disabled || disabled) && "opacity-50",
                )}
              >
                <span className="flex h-4 w-4 shrink-0 items-center justify-center text-gray-500 dark:text-gray-400">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        data-no-pan
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800",
          disabled && "opacity-50",
        )}
        title={t("common.moreActions")}
        aria-label={t("common.moreActions")}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MoreIcon />
      </button>
      {menu}
    </>
  );
}

function MoreIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="1.75" />
      <circle cx="12" cy="12" r="1.75" />
      <circle cx="12" cy="19" r="1.75" />
    </svg>
  );
}

export function MenuIconEdit() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MenuIconSubPlan() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

export function MenuIconContribution() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" strokeLinecap="round" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" strokeLinejoin="round" />
    </svg>
  );
}

export function MenuIconArchive() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path d="M3 7h18v3H3V7Z" strokeLinejoin="round" />
      <path d="M5 10v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8" strokeLinejoin="round" />
      <path d="M10 7V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2" strokeLinecap="round" />
    </svg>
  );
}

export function MenuIconDelete() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MenuIconRestore() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path d="M3 7h18v3H3V7Z" strokeLinejoin="round" />
      <path d="M5 10v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8" strokeLinejoin="round" />
      <path d="M12 14v4M9 16h6" strokeLinecap="round" />
    </svg>
  );
}
