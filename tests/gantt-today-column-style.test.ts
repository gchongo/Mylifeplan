import { describe, expect, it } from "vitest";
import { ganttTodayColumnBackground } from "@/lib/gantt-today-column-style";
import { DEFAULT_GANTT_TODAY_COLUMN } from "@/lib/user-preferences";

describe("ganttTodayColumnBackground", () => {
  it("returns undefined when disabled", () => {
    expect(
      ganttTodayColumnBackground({ ...DEFAULT_GANTT_TODAY_COLUMN, enabled: false }),
    ).toBeUndefined();
  });

  it("returns solid rgba background", () => {
    expect(
      ganttTodayColumnBackground({
        enabled: true,
        color: "#EF4444",
        opacity: 20,
        fillStyle: "solid",
      }),
    ).toEqual({ backgroundColor: "rgba(239, 68, 68, 0.2)" });
  });

  it("returns striped pattern", () => {
    const style = ganttTodayColumnBackground({
      enabled: true,
      color: "#3B82F6",
      opacity: 30,
      fillStyle: "striped",
    });
    expect(style?.backgroundImage).toContain("repeating-linear-gradient");
  });
});
