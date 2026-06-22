import { describe, expect, it } from "vitest";
import { feedActionPhrase, feedExcerpt } from "@/lib/feed-display";

describe("feedActionPhrase", () => {
  it("uses 便签 for memo items", () => {
    expect(feedActionPhrase("create", "memo")).toBe("新建了便签");
    expect(feedActionPhrase("complete", "plan")).toBe("完成了计划");
  });
});

describe("feedExcerpt", () => {
  it("strips markdown and truncates", () => {
    const long = "# 标题\n\n这是一段**很长**的正文内容。".repeat(10);
    const excerpt = feedExcerpt(long, 30);
    expect(excerpt).toMatch(/…$/);
    expect(excerpt).not.toContain("#");
  });
});
