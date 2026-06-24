import { describe, expect, it } from "vitest";
import { formatMemoCardDate, memoDisplayBody, splitMemoContent } from "@/lib/memo-content";

describe("memo-content", () => {
  it("splits first line as title", () => {
    expect(splitMemoContent("标题行\n正文 **bold**")).toEqual({
      title: "标题行",
      body: "正文 **bold**",
    });
  });

  it("keeps single-line memo body empty", () => {
    expect(splitMemoContent("咯")).toEqual({
      title: "咯",
      body: "",
    });
  });

  it("uses body for display when present", () => {
    expect(
      memoDisplayBody({ title: "T", body: "# hi", description: "old" }),
    ).toBe("# hi");
  });

  it("formats card date in Chinese", () => {
    const s = formatMemoCardDate("2026-04-22T10:00:00.000Z");
    expect(s).toMatch(/4月22日/);
  });
});
