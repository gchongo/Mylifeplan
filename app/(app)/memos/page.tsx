import { MemosList } from "@/components/memos/memos-list";

export default function MemosPage() {
  return (
    <div className="min-h-full bg-gray-50/80 px-4 py-6 dark:bg-gray-950">
      <div className="mx-auto max-w-xl">
        <h1 className="mb-1 text-xl font-semibold text-gray-900 dark:text-gray-100">备忘录</h1>
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
          记录灵感与片段；补充日期后可回流到日历与甘特图。
        </p>
        <MemosList />
      </div>
    </div>
  );
}
