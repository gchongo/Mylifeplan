"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

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
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden />
      <aside
        role="dialog"
        aria-modal
        aria-labelledby="drawer-title"
        className={cn(
          "relative z-10 flex h-full w-full max-w-md flex-col border-l border-gray-200 bg-white shadow-xl",
          className,
        )}
      >
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
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      </aside>
    </div>
  );
}
