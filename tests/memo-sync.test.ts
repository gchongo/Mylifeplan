import { describe, expect, it, beforeEach } from "vitest";
import { syncMemoForTask } from "@/lib/services/memo-sync";

interface MemoRow {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  linkedTaskId: string | null;
  linkedPlanId: string | null;
}

function createMockDb() {
  const memos: MemoRow[] = [];
  let seq = 1;

  return {
    memos,
    db: {
      memo: {
        findUnique: async ({
          where,
        }: {
          where: { linkedTaskId?: string; id?: string };
        }) => {
          if (where.linkedTaskId) {
            return memos.find((m) => m.linkedTaskId === where.linkedTaskId) ?? null;
          }
          if (where.id) {
            return memos.find((m) => m.id === where.id) ?? null;
          }
          return null;
        },
        create: async ({
          data,
        }: {
          data: Omit<MemoRow, "id">;
        }) => {
          const row: MemoRow = { id: `memo-${seq++}`, ...data };
          memos.push(row);
          return row;
        },
        update: async ({
          where,
          data,
        }: {
          where: { id: string };
          data: Partial<Pick<MemoRow, "title" | "description">>;
        }) => {
          const row = memos.find((m) => m.id === where.id);
          if (!row) throw new Error("not found");
          Object.assign(row, data);
          return row;
        },
        delete: async ({ where }: { where: { id: string } }) => {
          const idx = memos.findIndex((m) => m.id === where.id);
          if (idx >= 0) memos.splice(idx, 1);
        },
      },
    },
  };
}

describe("memo-sync integration", () => {
  let store: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    store = createMockDb();
  });

  const baseTask = {
    id: "task-1",
    userId: "user-1",
    title: "测试任务",
    description: "说明",
    startDate: null as Date | null,
    dueDate: null as Date | null,
    status: "todo" as const,
  };

  it("无日期任务自动创建 Memo", async () => {
    await syncMemoForTask(baseTask, store.db as never);
    expect(store.memos).toHaveLength(1);
    expect(store.memos[0].title).toBe("测试任务");
    expect(store.memos[0].linkedTaskId).toBe("task-1");
  });

  it("补 start 日期后硬删除 Memo", async () => {
    await syncMemoForTask(baseTask, store.db as never);
    expect(store.memos).toHaveLength(1);

    await syncMemoForTask(
      { ...baseTask, startDate: new Date("2025-01-01") },
      store.db as never,
    );
    expect(store.memos).toHaveLength(0);
  });

  it("改 title 同步 Memo", async () => {
    await syncMemoForTask(baseTask, store.db as never);
    await syncMemoForTask({ ...baseTask, title: "新标题" }, store.db as never);
    expect(store.memos[0].title).toBe("新标题");
  });

  it("清空日期后 Memo 重建", async () => {
    await syncMemoForTask(
      { ...baseTask, startDate: new Date("2025-01-01") },
      store.db as never,
    );
    expect(store.memos).toHaveLength(0);

    await syncMemoForTask(baseTask, store.db as never);
    expect(store.memos).toHaveLength(1);
  });

  it("归档任务时删除 Memo", async () => {
    await syncMemoForTask(baseTask, store.db as never);
    expect(store.memos).toHaveLength(1);

    await syncMemoForTask({ ...baseTask, status: "archived" }, store.db as never);
    expect(store.memos).toHaveLength(0);
  });
});
