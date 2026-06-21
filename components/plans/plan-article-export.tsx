"use client";

import { useMemo, useState } from "react";
import { buildContributionArticle } from "@/lib/contribution-article";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContributionMarkdown } from "@/components/contributions/contribution-markdown";
import type { PlanContributionItem } from "@/components/plans/plan-contribution-timeline";

export function PlanArticleExport({
  planTitle,
  contributions,
}: {
  planTitle: string;
  contributions: PlanContributionItem[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const article = useMemo(
    () =>
      buildContributionArticle(
        planTitle,
        contributions.map((c) => ({
          title: c.title,
          description: c.description,
          body: c.body,
          occurredOn: c.occurredOn,
          occurredEndOn: c.occurredEndOn,
          planTitle: c.planTitle,
          imageUrls: c.imageUrls,
        })),
      ),
    [planTitle, contributions],
  );

  if (contributions.length === 0) return null;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(article);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  function handleDownload() {
    const blob = new Blob([article], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${planTitle.replace(/[^\w\u4e00-\u9fff-]+/g, "-")}-tutorial.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle className="text-base">教程预览</CardTitle>
          <p className="mt-1 text-xs text-gray-500">
            将 {contributions.length} 条执行记录串联为一篇 Markdown 文章
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={() => setExpanded((v) => !v)}>
            {expanded ? "收起" : "预览"}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => void handleCopy()}>
            {copied ? "已复制" : "复制"}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={handleDownload}>
            下载 .md
          </Button>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent>
          <div className="max-h-[480px] overflow-y-auto rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
            <ContributionMarkdown content={article} />
          </div>
        </CardContent>
      )}
    </Card>
  );
}
