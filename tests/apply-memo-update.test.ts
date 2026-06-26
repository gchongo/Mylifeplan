import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";

let testClient: QueryClient;

vi.mock("@/lib/query/client", () => ({
  getQueryClient: () => testClient,
}));

import { applyMemoRemoveFromCache, applyMemoUpsertToCache } from "@/lib/query/apply-memo-update";
import { queryKeys } from "@/lib/query/keys";

describe("applyMemoUpdateToCache", () => {
  beforeEach(() => {
    testClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  it("inserts new memo at front of list", () => {
    testClient.setQueryData(queryKeys.memos.standalone, [{ id: "a", title: "A" }]);
    applyMemoUpsertToCache({ id: "b", title: "B" });
    const memos = testClient.getQueryData<{ id: string; title?: string }[]>(
      queryKeys.memos.standalone,
    );
    expect(memos?.map((m) => m.id)).toEqual(["b", "a"]);
  });

  it("removes memo by id", () => {
    testClient.setQueryData(queryKeys.memos.standalone, [
      { id: "a", title: "A" },
      { id: "b", title: "B" },
    ]);
    applyMemoRemoveFromCache("a");
    const memos = testClient.getQueryData<{ id: string }[]>(queryKeys.memos.standalone);
    expect(memos?.map((m) => m.id)).toEqual(["b"]);
  });
});
