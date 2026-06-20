import { describe, expect, it } from "vitest";
import {
  getGanttBarStyle,
  isOverdue,
  normalizeStatusKey,
  resolveVisualStatus,
} from "@/lib/task-status-style";

describe("task-status-style", () => {
  it("maps plan not_started to todo palette", () => {
    expect(normalizeStatusKey("not_started")).toBe("todo");
  });

  it("marks overdue when due date passed and not done", () => {
    expect(isOverdue("2020-01-01", "todo")).toBe(true);
    expect(isOverdue("2020-01-01", "done")).toBe(false);
    expect(resolveVisualStatus("in_progress", "2020-01-01")).toBe("overdue");
  });

  it("returns outline bar styles for parent vs child", () => {
    const parent = getGanttBarStyle("in_progress", null, null, 0);
    const child = getGanttBarStyle("in_progress", null, null, 1);
    expect(parent.shell).toContain("border-solid");
    expect(parent.text).toContain("blue");
    expect(child.shell).toContain("border-dashed");
    expect(child.text).toContain("blue");
  });
});
