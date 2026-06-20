import { describe, expect, it } from "vitest";
import {
  getEffectiveEndDate,
  shouldShowInCalendar,
  shouldShowInGantt,
  shouldShowInMemo,
  validateDateFields,
} from "@/lib/content-router";

describe("content-router", () => {
  it("无日期 → 备忘录，不进日历/甘特图", () => {
    const item = {};
    expect(shouldShowInMemo(item)).toBe(true);
    expect(shouldShowInCalendar(item)).toBe(false);
    expect(shouldShowInGantt(item)).toBe(false);
  });

  it("仅有 start → 日历 + 甘特图（虚拟截止）", () => {
    const item = { startDate: "2025-01-01" };
    expect(shouldShowInCalendar(item)).toBe(true);
    expect(shouldShowInGantt(item)).toBe(true);
    const { effectiveEnd, isVirtualEnd } = getEffectiveEndDate(item, new Date("2025-06-01"));
    expect(isVirtualEnd).toBe(true);
    expect(effectiveEnd).toBe("2026-01-01");
  });

  it("虚拟截止随 today 动态延长", () => {
    const item = { startDate: "2024-01-01" };
    const { effectiveEnd, isVirtualEnd } = getEffectiveEndDate(item, new Date("2026-06-01"));
    expect(isVirtualEnd).toBe(true);
    expect(effectiveEnd).toBe("2026-06-01");
  });

  it("有真实 due → 使用真实截止", () => {
    const item = { startDate: "2025-01-01", dueDate: "2025-03-01" };
    const { effectiveEnd, isVirtualEnd } = getEffectiveEndDate(item);
    expect(isVirtualEnd).toBe(false);
    expect(effectiveEnd).toBe("2025-03-01");
  });

  it("禁止 due without start", () => {
    expect(validateDateFields({ dueDate: "2025-03-01" })).toMatch(/开始日期/);
  });
});
