/** 将输入拆成标题（首行）与 Markdown 正文 */
export function splitMemoContent(text: string): { title: string; body: string } {
  const trimmed = text.trim();
  if (!trimmed) return { title: "", body: "" };
  const lines = trimmed.split(/\n/);
  const title = lines[0]!.slice(0, 200).trim();
  const body = lines.length > 1 ? lines.slice(1).join("\n").trim() : "";
  return { title: title || trimmed.slice(0, 200), body };
}

/** 展示用 Markdown：有 body 用 body，否则用 description / title */
export function memoDisplayBody(memo: {
  body?: string | null;
  description?: string | null;
  title: string;
}): string {
  if (memo.body?.trim()) return memo.body.trim();
  if (memo.description?.trim()) return memo.description.trim();
  const title = memo.title.trim();
  if (!title || title === "新便签") return "";
  return title;
}

export function formatMemoCardDate(iso: string): string {
  const d = new Date(iso);
  const weekday = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][d.getDay()]!;
  return `${d.getMonth() + 1}月${d.getDate()}日${weekday}`;
}
