import { describe, expect, it, beforeEach } from "vitest";
import { computeFloatingMenuPosition } from "@/lib/floating-menu-position";

describe("computeFloatingMenuPosition", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "window", {
      value: { innerHeight: 800 },
      configurable: true,
    });
  });

  it("opens downward when there is enough space below", () => {
    const rect = {
      top: 100,
      bottom: 120,
      right: 200,
    } as DOMRect;
    const pos = computeFloatingMenuPosition(rect, 120, 144, {
      gap: 4,
      viewportPadding: 8,
    });
    expect(pos.top).toBe(124);
    expect(pos.left).toBe(56);
  });

  it("opens upward when bottom space is tight", () => {
    const innerHeight = window.innerHeight;
    const rect = {
      top: innerHeight - 40,
      bottom: innerHeight - 20,
      right: 200,
    } as DOMRect;
    const pos = computeFloatingMenuPosition(rect, 160, 144, {
      gap: 4,
      viewportPadding: 8,
    });
    expect(pos.top).toBeLessThan(rect.top);
  });
});
