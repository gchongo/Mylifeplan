import { StickyNoteBoard } from "@/components/memos/sticky-note-board";

export default function MemosPage() {
  return (
    <div className="flex h-full flex-col px-4 py-4">
      <div className="mb-3">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">便签</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          在板上随意贴便签、拖动位置、换颜色。与信息流不同，这里适合快速记录碎片想法。
        </p>
      </div>
      <StickyNoteBoard />
    </div>
  );
}
