import type { Feed, FeedActionType, FeedItemType } from "@prisma/client";
import { feedActionPhrase, feedExcerpt } from "@/lib/feed-display";
import { formatPlanDateTime } from "@/lib/dates";
import { prisma } from "@/lib/db";

export interface FeedPlanDetail {
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  actualStartDate: string | null;
  actualEndDate: string | null;
  status: string;
}

export interface EnrichedFeedItem {
  id: string;
  itemType: FeedItemType;
  itemId: string;
  actionType: FeedActionType;
  content: string | null;
  createdAt: Date;
  headline: string;
  excerpt: string | null;
  contextLabel: string | null;
  actionPhrase: string;
  planDetail?: FeedPlanDetail;
}

export async function enrichFeedItems(
  userId: string,
  items: Feed[],
): Promise<EnrichedFeedItem[]> {
  if (items.length === 0) return [];

  const planIds = [...new Set(items.filter((i) => i.itemType === "plan").map((i) => i.itemId))];
  const memoIds = [...new Set(items.filter((i) => i.itemType === "memo").map((i) => i.itemId))];
  const contributionIds = [
    ...new Set(items.filter((i) => i.itemType === "contribution").map((i) => i.itemId)),
  ];

  const [plans, memos, contributions] = await Promise.all([
    planIds.length
      ? prisma.plan.findMany({
          where: { userId, id: { in: planIds } },
          select: {
            id: true,
            title: true,
            description: true,
            startDate: true,
            endDate: true,
            actualStartDate: true,
            actualEndDate: true,
            status: true,
          },
        })
      : [],
    memoIds.length
      ? prisma.memo.findMany({
          where: { userId, id: { in: memoIds } },
          select: { id: true, title: true, body: true, description: true },
        })
      : [],
    contributionIds.length
      ? prisma.planContribution.findMany({
          where: { userId, id: { in: contributionIds } },
          select: {
            id: true,
            title: true,
            body: true,
            description: true,
            plan: { select: { title: true } },
          },
        })
      : [],
  ]);

  const planMap = new Map(plans.map((p) => [p.id, p]));
  const memoMap = new Map(memos.map((m) => [m.id, m]));
  const contributionMap = new Map(contributions.map((c) => [c.id, c]));

  return items.map((item) => {
    const actionPhrase = feedActionPhrase(item.actionType, item.itemType);

    if (item.itemType === "plan") {
      const plan = planMap.get(item.itemId);
      const headline = plan?.title ?? item.content?.trim() ?? "计划";
      return {
        ...item,
        headline,
        excerpt: feedExcerpt(plan?.description),
        contextLabel: null,
        actionPhrase,
        planDetail: plan
          ? {
              description: plan.description,
              startDate: formatPlanDateTime(plan.startDate),
              endDate: formatPlanDateTime(plan.endDate),
              actualStartDate: formatPlanDateTime(plan.actualStartDate),
              actualEndDate: formatPlanDateTime(plan.actualEndDate),
              status: plan.status,
            }
          : undefined,
      };
    }

    if (item.itemType === "memo") {
      const memo = memoMap.get(item.itemId);
      const headline = memo?.title ?? item.content?.trim() ?? "便签";
      const body = memo?.body ?? memo?.description ?? null;
      return {
        ...item,
        headline,
        excerpt: feedExcerpt(body),
        contextLabel: null,
        actionPhrase,
      };
    }

    const contribution = contributionMap.get(item.itemId);
    const headline = contribution?.title ?? item.content?.split(" · ")[0]?.trim() ?? "贡献";
    const body = contribution?.body ?? contribution?.description ?? null;
    const planTitle = contribution?.plan?.title ?? item.content?.split(" · ")[1]?.trim() ?? null;
    return {
      ...item,
      headline,
      excerpt: feedExcerpt(body),
      contextLabel: planTitle ? `贡献 · ${planTitle}` : "贡献",
      actionPhrase,
    };
  });
}
