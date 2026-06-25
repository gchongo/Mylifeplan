import { describe, expect, it } from "vitest";
import { sumImageSizeBytes } from "@/lib/storage-accounting";

describe("storage accounting", () => {
  it("sums image sizeBytes", () => {
    expect(sumImageSizeBytes([{ sizeBytes: 100 }, { sizeBytes: 50 }])).toBe(150);
  });
});
