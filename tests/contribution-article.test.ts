import { describe, expect, it } from "vitest";
import { buildContributionArticle } from "@/lib/contribution-article";

describe("buildContributionArticle", () => {
  it("sorts entries by date and builds markdown sections", () => {
    const md = buildContributionArticle("学 Next.js", [
      {
        title: "完成路由",
        body: "用了 App Router",
        occurredOn: "2026-06-15",
        planTitle: "路由模块",
      },
      {
        title: "搭环境",
        description: "安装 Node",
        occurredOn: "2026-06-01",
      },
    ]);

    expect(md).toContain("# 学 Next.js");
    expect(md).toContain("由 2 条执行记录自动汇总");
    expect(md.indexOf("搭环境")).toBeLessThan(md.indexOf("完成路由"));
    expect(md).toContain("## 1. 搭环境");
    expect(md).toContain("## 2. 完成路由");
    expect(md).toContain("用了 App Router");
    expect(md).toContain("路由模块");
  });

  it("returns empty hint when no entries", () => {
    const md = buildContributionArticle("空计划", []);
    expect(md).toContain("暂无贡献记录");
  });
});
