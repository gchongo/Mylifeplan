import Link from "next/link";
import { centeredPageWidthClass } from "@/components/layout/centered-layout";
import { cn } from "@/lib/utils";

export function FullPanelPage({
  title,
  children,
  centered = false,
}: {
  title: string;
  children: React.ReactNode;
  /** 内容区占屏宽 2/3 并居中（用于信息流等阅读型页面） */
  centered?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex h-[calc(100vh-5.5rem)] min-w-0 max-w-full flex-col overflow-hidden",
        centered && "bg-gray-50",
      )}
    >
      <div
        className={cn(
          "mx-auto flex h-full min-h-0 w-full max-w-full flex-col gap-3 overflow-hidden px-4 lg:px-6",
          centered && centeredPageWidthClass,
        )}
      >
        <div className="flex shrink-0 items-center gap-3 pt-0">
          <Link href="/" className="shrink-0 text-sm text-brand-600 hover:underline">
            ← 返回首页
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        </div>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
