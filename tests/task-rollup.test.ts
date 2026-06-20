import { describe, expect, it } from "vitest";
import { deriveParentStatus } from "@/lib/services/task-rollup";

describe("deriveParentStatus", () => {
  it("无子任务时返回自身状态", () => {
    expect(deriveParentStatus("todo", [])).toBe("todo");
    expect(deriveParentStatus("done", [])).toBe("done");
  });

  it("全部子任务 done → done", () => {
    expect(deriveParentStatus("todo", ["done", "done"])).toBe("done");
  });

  it("任一 in_progress → in_progress", () => {
    expect(deriveParentStatus("todo", ["done", "in_progress"])).toBe("in_progress");
  });

  it("部分 done 部分 todo → in_progress", () => {
    expect(deriveParentStatus("todo", ["done", "todo"])).toBe("in_progress");
  });

  it("全部 todo → todo", () => {
    expect(deriveParentStatus("done", ["todo", "todo"])).toBe("todo");
  });
});
