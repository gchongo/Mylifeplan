import { describe, expect, it } from "vitest";
import {
  defaultStickyPosition,
  effectiveStickyPosition,
  nextStickyColor,
  stickyNoteColor,
} from "@/lib/memo-sticky";

describe("memo-sticky", () => {
  it("assigns default grid positions", () => {
    expect(defaultStickyPosition(0)).toEqual({ x: 32, y: 32 });
    expect(defaultStickyPosition(4)).toEqual({ x: 32, y: 252 });
  });

  it("uses saved position when present", () => {
    expect(effectiveStickyPosition(100, 200, 0)).toEqual({ x: 100, y: 200 });
    expect(effectiveStickyPosition(null, null, 2)).toEqual(defaultStickyPosition(2));
  });

  it("cycles colors", () => {
    expect(nextStickyColor(0)).toBe("yellow");
    expect(nextStickyColor(6)).toBe("yellow");
  });

  it("falls back for unknown color", () => {
    expect(stickyNoteColor("unknown").bg).toBe(stickyNoteColor("yellow").bg);
  });
});
