import { describe, expect, it } from "vitest";
import { ganttGrabCursor, ganttGrabbingCursor } from "@/lib/gantt-cursors";

describe("gantt-cursors", () => {
  it("uses the same 32px svg size for grab and grabbing", () => {
    expect(ganttGrabCursor).toContain("width%3D%2232%22");
    expect(ganttGrabbingCursor).toContain("width%3D%2232%22");
  });

  it("uses distinct fallback cursor keywords", () => {
    expect(ganttGrabCursor.endsWith(", grab")).toBe(true);
    expect(ganttGrabbingCursor.endsWith(", grabbing")).toBe(true);
  });

  it("uses the same hotspot for both cursors", () => {
    expect(ganttGrabCursor).toContain("12 12");
    expect(ganttGrabbingCursor).toContain("12 12");
  });
});
