import { describe, expect, it } from "vitest";
import {
  deriveParentStatus,
  deriveStatusFromDirectChildren,
  validateManualStatusChange,
} from "@/lib/services/task-rollup";

describe("deriveStatusFromDirectChildren", () => {
  it("无子任务时返回 null", () => {
    expect(deriveStatusFromDirectChildren([])).toBeNull();
  });

  it("全部子任务 done → done", () => {
    expect(deriveStatusFromDirectChildren(["done", "done"])).toBe("done");
  });

  it("已归档子任务不参与汇总", () => {
    expect(deriveStatusFromDirectChildren(["done", "archived"])).toBe("done");
    expect(deriveStatusFromDirectChildren(["todo", "archived"])).toBe("todo");
  });

  it("部分 done 部分 todo → in_progress", () => {
    expect(deriveStatusFromDirectChildren(["done", "todo"])).toBe("in_progress");
  });
});

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

describe("validateManualStatusChange", () => {
  it("无子任务时允许修改", () => {
    expect(validateManualStatusChange("done", [])).toBeNull();
  });

  it("有子任务时禁止手动完成", () => {
    expect(validateManualStatusChange("done", ["todo", "todo"])).toMatch(/子任务/);
  });

  it("有子任务时禁止归档", () => {
    expect(validateManualStatusChange("archived", ["todo"])).toMatch(/归档/);
  });

  it("子任务全部完成时允许设为 done", () => {
    expect(validateManualStatusChange("done", ["done", "done"])).toBeNull();
  });

  it("任一子任务进行中时允许设为 in_progress", () => {
    expect(validateManualStatusChange("in_progress", ["in_progress", "todo"])).toBeNull();
  });
});
