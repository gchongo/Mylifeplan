"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string | null;
  children: React.ReactNode;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal
        {...(title != null ? { "aria-labelledby": "modal-title" } : { "aria-label": "对话框" })}
        className={cn(
          "relative z-10 w-full max-w-lg rounded-xl bg-white shadow-xl dark:bg-gray-900",
          className,
        )}
      >
        {title != null && (
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
            <h2 id="modal-title" className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose} aria-label="关闭">
              ✕
            </Button>
          </div>
        )}
        <div className={cn("p-4", title == null && "pt-3")}>
          {title == null && (
            <div className="mb-2 flex justify-end">
              <Button variant="ghost" size="sm" onClick={onClose} aria-label="关闭">
                ✕
              </Button>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
