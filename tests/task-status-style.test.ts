import { describe, expect, it } from "vitest";
import {
  getGanttBarStyle,
  getMobilePlanHeaderStatusCellClass,
  normalizeStatusKey,
  resolveVisualStatus,
} from "@/lib/task-status-style";

describe("task-status-style", () => {
  it("maps plan not_started to todo palette", () => {
    expect(normalizeStatusKey("not_started")).toBe("todo");
  });

  it("marks overdue only when explicitly flagged", () => {
    expect(resolveVisualStatus("in_progress", "2020-01-01", undefined, false)).toBe("in_progress");
    expect(resolveVisualStatus("in_progress", "2020-01-01", undefined, true)).toBe("overdue");
  });

  it("prefers unscheduled over api status", () => {
    expect(resolveVisualStatus("not_started", null, undefined, false, true)).toBe("unscheduled");
    expect(resolveVisualStatus("in_progress", null, undefined, true, true)).toBe("unscheduled");
  });

  it("returns solid status bars for parent vs child", () => {
    const parent = getGanttBarStyle("in_progress", null, null, 0);
    const child = getGanttBarStyle("done", null, null, 1);
    expect(parent.shell).toContain("border-solid");
    expect(parent.shell).toContain("blue");
    expect(child.shell).toContain("border-solid");
    expect(child.shell).not.toContain("border-dashed");
    expect(child.shell).toContain("emerald");
  });

  it("todo uses amber palette", () => {
    const todo = getGanttBarStyle("not_started", null, null, 0);
    expect(todo.shell).toContain("amber");
  });

  it("maps mobile plan header status cell backgrounds", () => {
    expect(getMobilePlanHeaderStatusCellClass("todo")).toContain("amber-500");
    expect(getMobilePlanHeaderStatusCellClass("in_progress")).toContain("blue");
    expect(getMobilePlanHeaderStatusCellClass("done")).toContain("emerald");
    expect(getMobilePlanHeaderStatusCellClass("unscheduled")).toContain("dashed");
    expect(getMobilePlanHeaderStatusCellClass("in_progress")).toContain("rounded-md");
  });
});
