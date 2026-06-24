import { cn } from "@/lib/utils";

/** Lightweight placeholder for dynamically loaded panels (no i18n). */
export function PanelSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex min-h-[12rem] animate-pulse items-center justify-center rounded-lg bg-gray-100/70 dark:bg-gray-800/40",
        className,
      )}
      aria-hidden
    >
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-brand-600 dark:border-gray-600 dark:border-t-brand-400" />
    </div>
  );
}
