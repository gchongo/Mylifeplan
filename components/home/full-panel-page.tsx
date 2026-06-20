import Link from "next/link";

export function FullPanelPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-[calc(100vh-5.5rem)] min-w-0 max-w-full flex-col gap-3 overflow-hidden">
      <div className="flex items-center gap-3">
        <Link href="/" className="shrink-0 text-sm text-brand-600 hover:underline">
          ← 返回首页
        </Link>
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      </div>
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
