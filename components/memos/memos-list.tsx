"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { MemoCard, type MemoCardData } from "@/components/memos/memo-card";
import { MemoComposer } from "@/components/memos/memo-composer";
import { EmptyState, ErrorMessage, Loading } from "@/components/ui/feedback";

export function MemosList() {
  const { t } = useI18n();
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
          title={t("memos.list.emptyTitle")}
          description={t("memos.list.emptyDescription")}
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
