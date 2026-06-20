import { describe, expect, it } from "vitest";
import {
  isOverdue,
  normalizeStatusKey,
  resolveVisualStatus,
  statusBarClass,
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

  it("returns bar class for in_progress", () => {
    expect(statusBarClass("in_progress")).toContain("blue");
  });
});
