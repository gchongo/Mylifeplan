import type { Feed, FeedActionType, FeedItemType } from "@prisma/client";
import { feedActionPhrase, feedExcerpt } from "@/lib/feed-display";
import { parsePlanFeedContent, type PlanFeedChangeItem } from "@/lib/plan-feed-change";
import { quadrantFeedLabel } from "@/lib/memo-quadrant";
import { serializeContribution } from "@/lib/services/contribution";
import { prisma } from "@/lib/db";

export type FeedContributionDetail = ReturnType<typeof serializeContribution>;

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
  planUpdateChanges: PlanFeedChangeItem[] | null;
  planUpdateSummary: string | null;
  memoQuadrant: string | null;
  contributionDetail: FeedContributionDetail | null;
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
          select: { id: true, title: true, description: true },
        })
      : [],
    memoIds.length
      ? prisma.memo.findMany({
          where: { userId, id: { in: memoIds } },
          select: { id: true, title: true, body: true, description: true, quadrant: true },
        })
      : [],
    contributionIds.length
      ? prisma.planContribution.findMany({
          where: { userId, id: { in: contributionIds } },
          include: {
            plan: { select: { title: true } },
            images: { orderBy: { createdAt: "asc" } },
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
      const { changes, legacySummary } = parsePlanFeedContent(item.content, headline);
      const hasPlanUpdateDetail =
        (changes?.length ?? 0) > 0 || Boolean(legacySummary);
      return {
        ...item,
        headline,
        excerpt: hasPlanUpdateDetail ? null : feedExcerpt(plan?.description),
        contextLabel: null,
        actionPhrase,
        planUpdateChanges: changes,
        planUpdateSummary: legacySummary,
        memoQuadrant: null,
        contributionDetail: null,
      };
    }

    if (item.itemType === "memo") {
      const memo = memoMap.get(item.itemId);
      const headline = memo?.title ?? item.content?.trim() ?? "便签";
      const body = memo?.body ?? memo?.description ?? null;
      const excerpt = feedExcerpt(body);
      const headlineTrim = headline.trim();
      const excerptTrim = excerpt?.trim() ?? "";
      return {
        ...item,
        headline,
        excerpt:
          excerptTrim && excerptTrim !== headlineTrim ? excerpt : null,
        contextLabel: null,
        actionPhrase,
        planUpdateChanges: null,
        planUpdateSummary: null,
        memoQuadrant: quadrantFeedLabel(memo?.quadrant),
        contributionDetail: null,
      };
    }

    const contribution = contributionMap.get(item.itemId);
    const contributionDetail = contribution ? serializeContribution(contribution) : null;
    const headline =
      contributionDetail?.title ?? item.content?.split(" · ")[0]?.trim() ?? "贡献";
    const planTitle =
      contributionDetail?.planTitle ??
      item.content?.split(" · ")[1]?.trim() ??
      null;
    return {
      ...item,
      headline,
      excerpt: null,
      contextLabel: planTitle ? `贡献 · ${planTitle}` : "贡献",
      actionPhrase,
      planUpdateChanges: null,
      planUpdateSummary: null,
      memoQuadrant: null,
      contributionDetail,
    };
  });
}
