import { describe, expect, it } from "vitest";
import { syncMemoForPlan } from "@/lib/services/memo-sync";

type MemoRow = { id: string; linkedPlanId: string | null };

describe("memo-sync (B model)", () => {
  it("does not create linked memos for unscheduled plans", async () => {
    const memos: MemoRow[] = [];
    const db = {
      memo: {
        deleteMany: async ({ where }: { where: { linkedPlanId: string } }) => {
          for (let i = memos.length - 1; i >= 0; i--) {
            if (memos[i].linkedPlanId === where.linkedPlanId) memos.splice(i, 1);
          }
        },
      },
    };

    await syncMemoForPlan({ id: "plan-1" }, db as never);
    expect(memos).toHaveLength(0);
  });

  it("removes legacy linked memos when plan is touched", async () => {
    const memos: MemoRow[] = [{ id: "m1", linkedPlanId: "plan-1" }];
    const db = {
      memo: {
        deleteMany: async ({ where }: { where: { linkedPlanId: string } }) => {
          for (let i = memos.length - 1; i >= 0; i--) {
            if (memos[i].linkedPlanId === where.linkedPlanId) memos.splice(i, 1);
          }
        },
      },
    };

    await syncMemoForPlan({ id: "plan-1" }, db as never);
    expect(memos).toHaveLength(0);
  });
});
