import { describe, expect, it, beforeEach } from "vitest";
import { syncMemoForPlan } from "@/lib/services/memo-sync";

interface MemoRow {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  linkedPlanId: string | null;
}

function createMockDb() {
  const memos: MemoRow[] = [];
  let seq = 1;

  return {
    memos,
    db: {
      memo: {
        findUnique: async ({ where }: { where: { linkedPlanId?: string; id?: string } }) => {
          if (where.linkedPlanId) {
            return memos.find((m) => m.linkedPlanId === where.linkedPlanId) ?? null;
          }
          if (where.id) {
            return memos.find((m) => m.id === where.id) ?? null;
          }
          return null;
        },
        create: async ({ data }: { data: Omit<MemoRow, "id"> }) => {
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

  const basePlan = {
    id: "plan-1",
    userId: "user-1",
    title: "测试计划",
    description: "说明",
    startDate: null as Date | null,
    endDate: null as Date | null,
    status: "not_started" as const,
  };

  it("无日期计划自动创建 Memo", async () => {
    await syncMemoForPlan(basePlan, store.db as never);
    expect(store.memos).toHaveLength(1);
    expect(store.memos[0].title).toBe("测试计划");
    expect(store.memos[0].linkedPlanId).toBe("plan-1");
  });

  it("补 start 日期后硬删除 Memo", async () => {
    await syncMemoForPlan(basePlan, store.db as never);
    expect(store.memos).toHaveLength(1);

    await syncMemoForPlan(
      { ...basePlan, startDate: new Date("2025-01-01") },
      store.db as never,
    );
    expect(store.memos).toHaveLength(0);
  });

  it("改 title 同步 Memo", async () => {
    await syncMemoForPlan(basePlan, store.db as never);
    await syncMemoForPlan({ ...basePlan, title: "新标题" }, store.db as never);
    expect(store.memos[0].title).toBe("新标题");
  });

  it("归档计划时删除 Memo", async () => {
    await syncMemoForPlan(basePlan, store.db as never);
    expect(store.memos).toHaveLength(1);

    await syncMemoForPlan({ ...basePlan, status: "archived" }, store.db as never);
    expect(store.memos).toHaveLength(0);
  });
});
