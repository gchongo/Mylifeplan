"use client";

import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n/i18n-provider";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center",
        className,
      )}
    >
      <p className="text-sm font-medium text-gray-900">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Loading({ className, label }: { className?: string; label?: string }) {
  const { t } = useI18n();
  const resolvedLabel = label ?? t("common.loading");

  return (
    <div className={cn("flex items-center justify-center gap-2 py-8 text-sm text-gray-500", className)}>
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-brand-600" />
      {resolvedLabel}
    </div>
  );
}

export function ErrorMessage({ message, className }: { message: string; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700",
        className,
      )}
      role="alert"
    >
      {message}
    </div>
  );
}
