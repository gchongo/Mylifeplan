"use client";

import dynamic from "next/dynamic";
import { PanelSkeleton } from "@/components/ui/panel-skeleton";

const StickyNoteBoard = dynamic(
  () => import("@/components/memos/sticky-note-board").then((m) => m.StickyNoteBoard),
  { loading: () => <PanelSkeleton className="h-[70vh] min-h-[24rem]" />, ssr: false },
);

export default function MemosPage() {
  return (
    <div className="flex h-full min-h-0 flex-col px-3 py-2">
      <StickyNoteBoard />
    </div>
  );
}
