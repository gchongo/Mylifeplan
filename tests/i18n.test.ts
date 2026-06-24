import { describe, expect, it } from "vitest";
import { createTranslator } from "@/lib/i18n/translate";
import { localizeSummarySegments } from "@/lib/i18n/summary-segments";
import {
  localizeFeedActionPhrase,
  localizeMemoQuadrantFeed,
} from "@/lib/i18n/feed-helpers";
import {
  localizeScheduleColumnLabel,
  localizeScheduleColumnShortLabel,
} from "@/lib/i18n/gantt-helpers";

describe("i18n", () => {
  it("translates zh-CN keys", () => {
    const t = createTranslator("zh-CN");
    expect(t("nav.plans")).toBe("看板");
    expect(t("kanban.archivedTitle", { count: 3 })).toBe("已归档 (3)");
  });

  it("translates en-US keys", () => {
    const t = createTranslator("en-US");
    expect(t("nav.plans")).toBe("Kanban");
    expect(t("summary.completionRate")).toBe("Completion");
  });

  it("localizes summary segments by key", () => {
    const t = createTranslator("en-US");
    const segments = localizeSummarySegments(
      [{ key: "in_progress", label: "进行中", value: 2, color: "#3b82f6" }],
      "status",
      t,
    );
    expect(segments[0].label).toBe("In progress");
  });

  it("localizes feed action phrases", () => {
    const t = createTranslator("en-US");
    expect(localizeFeedActionPhrase(t, "create", "memo", "en-US")).toBe("Created memo");
    expect(localizeFeedActionPhrase(t, "complete", "plan", "en-US")).toBe("Completed plan");
  });

  it("localizes gantt schedule columns", () => {
    const t = createTranslator("en-US");
    expect(localizeScheduleColumnLabel(t, "planStart")).toBe("Planned start");
    expect(localizeScheduleColumnShortLabel(t, "completion")).toBe("Done%");
  });
});
