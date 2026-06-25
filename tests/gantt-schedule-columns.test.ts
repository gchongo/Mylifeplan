import { describe, expect, it } from "vitest";
import { getScheduleCellValue } from "@/lib/gantt-schedule-columns";
import type { GanttItem } from "@/types";

function ganttItem(partial: Partial<GanttItem> & Pick<GanttItem, "id" | "title" | "startDate">): GanttItem {
  return {
    effectiveEnd: partial.effectiveEnd ?? partial.endDate ?? "2027-06-20",
    isVirtualEnd: partial.isVirtualEnd ?? !partial.endDate,
    ...partial,
  };
}

describe("getScheduleCellValue", () => {
  it("未设置计划截止时显示横线，不展示虚拟截止日", () => {
    const item = ganttItem({
      id: "p1",
      title: "开放计划",
      startDate: "2026-06-20",
      effectiveEnd: "2027-06-20",
      isVirtualEnd: true,
    });

    expect(getScheduleCellValue("planEnd", item, []).text).toBe("—");
    expect(getScheduleCellValue("planDays", item, []).text).toBe("—");
  });

  it("有真实截止日时正常显示", () => {
    const item = ganttItem({
      id: "p2",
      title: "已定截止",
      startDate: "2026-06-20",
      endDate: "2026-06-25",
      effectiveEnd: "2026-06-25",
      isVirtualEnd: false,
    });

    expect(getScheduleCellValue("planEnd", item, []).text).toBe("2026/06/25");
    expect(getScheduleCellValue("planDays", item, []).text).toBe("7");
  });
});
