import { formatPlanDateTimeDisplay } from "@/lib/dates";

export interface ContributionArticleEntry {
  title: string;
  description?: string | null;
  body?: string | null;
  occurredOn: string;
  occurredEndOn?: string | null;
  planTitle?: string | null;
  imageUrls?: string[];
}

function formatContributionDate(entry: ContributionArticleEntry): string {
  if (entry.occurredEndOn && entry.occurredEndOn !== entry.occurredOn) {
    return `${formatPlanDateTimeDisplay(entry.occurredOn)} ~ ${formatPlanDateTimeDisplay(entry.occurredEndOn)}`;
  }
  return formatPlanDateTimeDisplay(entry.occurredOn);
}

function entryContent(entry: ContributionArticleEntry): string {
  const text = entry.body?.trim() || entry.description?.trim() || "";
  const images =
    entry.imageUrls?.length ?
      entry.imageUrls.map((url) => `![image](${url})`).join("\n\n")
    : "";
  if (text && images) return `${text}\n\n${images}`;
  return text || images;
}

/** 将计划下的贡献记录按时间串联为一篇 Markdown 教程文章 */
export function buildContributionArticle(
  planTitle: string,
  entries: ContributionArticleEntry[],
): string {
  const sorted = [...entries].sort((a, b) => {
    const d = a.occurredOn.localeCompare(b.occurredOn);
    if (d !== 0) return d;
    return a.title.localeCompare(b.title);
  });

  const sections = sorted.map((entry, index) => {
    const dateLabel = formatContributionDate(entry);
    const planLabel = entry.planTitle ? ` · ${entry.planTitle}` : "";
    const content = entryContent(entry);
    const header = `## ${index + 1}. ${entry.title}\n\n> ${dateLabel}${planLabel}`;
    return content ? `${header}\n\n${content}` : header;
  });

  const intro = `# ${planTitle}\n\n> 由 ${sorted.length} 条执行记录自动汇总\n`;
  if (sections.length === 0) {
    return `${intro}\n\n（暂无贡献记录）\n`;
  }
  return `${intro}\n${sections.join("\n\n---\n\n")}\n`;
}
