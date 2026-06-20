import { describe, expect, it } from "vitest";
import {
  deriveParentStatus,
  deriveStatusFromDirectChildren,
  validateManualStatusChange,
} from "@/lib/services/plan-rollup";

describe("deriveStatusFromDirectChildren", () => {
  it("无子计划时返回 null", () => {
    expect(deriveStatusFromDirectChildren([])).toBeNull();
  });

  it("全部子计划 done → done", () => {
    expect(deriveStatusFromDirectChildren(["done", "done"])).toBe("done");
  });

  it("已归档子计划不参与汇总", () => {
    expect(deriveStatusFromDirectChildren(["done", "archived"])).toBe("done");
    expect(deriveStatusFromDirectChildren(["not_started", "archived"])).toBe("not_started");
  });

  it("部分 done 部分 not_started → in_progress", () => {
    expect(deriveStatusFromDirectChildren(["done", "not_started"])).toBe("in_progress");
  });
});

describe("deriveParentStatus", () => {
  it("无子计划时返回自身状态", () => {
    expect(deriveParentStatus("not_started", [])).toBe("not_started");
    expect(deriveParentStatus("done", [])).toBe("done");
  });

  it("全部子计划 done → done", () => {
    expect(deriveParentStatus("not_started", ["done", "done"])).toBe("done");
  });

  it("任一 in_progress → in_progress", () => {
    expect(deriveParentStatus("not_started", ["done", "in_progress"])).toBe("in_progress");
  });
});

describe("validateManualStatusChange", () => {
  it("无子计划时允许修改", () => {
    expect(validateManualStatusChange("done", [])).toBeNull();
  });

  it("有子计划时禁止手动完成", () => {
    expect(validateManualStatusChange("done", ["not_started", "not_started"])).toMatch(/子计划/);
  });

  it("有子计划时禁止归档", () => {
    expect(validateManualStatusChange("archived", ["not_started"])).toMatch(/归档/);
  });
});
