"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ContributionInlinePanel,
  type ContributionInlineData,
} from "@/components/contributions/contribution-inline-panel";

export type PlanContributionItem = ContributionInlineData;

function TimelineContributionEntry({
  entry,
  currentPlanId,
  onChanged,
}: {
  entry: PlanContributionItem;
  currentPlanId: string;
  onChanged?: () => void;
}) {
  return (
    <li className="relative pb-6 last:pb-0">
      <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand-500 ring-4 ring-white dark:ring-gray-900" />
      <ContributionInlinePanel
        entry={entry}
        currentPlanId={currentPlanId}
        showSubPlanHint
        onChanged={onChanged}
      />
    </li>
  );
}

export function PlanContributionTimeline({
  contributions,
  currentPlanId,
  onChanged,
}: {
  contributions: PlanContributionItem[];
  currentPlanId: string;
  onChanged?: () => void;
}) {
  if (contributions.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">执行时间线</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="relative space-y-0 border-l border-gray-200 pl-4 dark:border-gray-700">
          {contributions.map((entry) => (
            <TimelineContributionEntry
              key={entry.id}
              entry={entry}
              currentPlanId={currentPlanId}
              onChanged={onChanged}
            />
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
