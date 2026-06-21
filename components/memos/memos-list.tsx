"use client";

import { useCallback, useEffect, useState } from "react";
import { MemoCard, type MemoCardData } from "@/components/memos/memo-card";
import { MemoComposer } from "@/components/memos/memo-composer";
import { EmptyState, ErrorMessage, Loading } from "@/components/ui/feedback";

export function MemosList() {
  const [memos, setMemos] = useState<MemoCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/memos");
    const data = await res.json();
    setMemos(data.memos ?? []);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  if (loading) return <Loading />;

  return (
    <div className="mx-auto w-full max-w-xl space-y-4">
      <MemoComposer onCreated={() => void load()} />
      {error && <ErrorMessage message={error} />}
      {memos.length === 0 ? (
        <EmptyState
          title="还没有备忘录"
          description="在上方输入框记录此刻的想法，支持 Markdown 与图片。"
        />
      ) : (
        <ul className="space-y-4">
          {memos.map((memo) => (
            <li key={memo.id}>
              <MemoCard
                memo={memo}
                onChanged={() => void load()}
                onError={setError}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
