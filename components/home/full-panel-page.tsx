import { centeredPageWidthClass } from "@/components/layout/centered-layout";
import { cn } from "@/lib/utils";

export function FullPanelPage({
  title,
  children,
  centered = false,
  scrollable = false,
}: {
  title: string;
  children: React.ReactNode;
  /** 内容区占屏宽 2/3 并居中（用于信息流等阅读型页面） */
  centered?: boolean;
  /** 整页随主区域滚动（信息流全页）；默认 false 时子面板内部滚动 */
  scrollable?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col",
        scrollable ? "w-full" : "min-h-0 flex-1 overflow-hidden",
        centered && "bg-gray-50 dark:bg-gray-950",
      )}
    >
      <div
        className={cn(
          "mx-auto flex w-full max-w-full flex-col gap-3 px-4 lg:px-6",
          scrollable ? "py-0" : "h-full min-h-0 overflow-hidden",
          centered && centeredPageWidthClass,
        )}
      >
        <h1 className="shrink-0 text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h1>
        <div
          className={cn(
            scrollable
              ? "flex min-w-0 flex-col"
              : "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
