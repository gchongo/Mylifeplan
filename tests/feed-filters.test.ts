import { describe, expect, it } from "vitest";
import { parseFeedItemTypeFilter } from "@/lib/feed-filters";

describe("parseFeedItemTypeFilter", () => {
  it("returns null for all or missing", () => {
    expect(parseFeedItemTypeFilter(null)).toBeNull();
    expect(parseFeedItemTypeFilter("all")).toBeNull();
  });

  it("parses valid item types", () => {
    expect(parseFeedItemTypeFilter("plan")).toBe("plan");
    expect(parseFeedItemTypeFilter("memo")).toBe("memo");
    expect(parseFeedItemTypeFilter("contribution")).toBe("contribution");
  });

  it("rejects unknown values", () => {
    expect(parseFeedItemTypeFilter("task")).toBeNull();
    expect(parseFeedItemTypeFilter("bogus")).toBeNull();
  });
});
