"use client";

import { PlanContributionComposeModal } from "@/components/forms/plan-contribution-compose-modal";

export function ContributionFormModal({
  open,
  onClose,
  planId,
  defaultStartDate,
  defaultEndDate,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  planId: string;
  defaultStartDate: string;
  defaultEndDate?: string;
  onSuccess: () => void;
}) {
  return (
    <PlanContributionComposeModal
      open={open}
      onClose={onClose}
      onSuccess={onSuccess}
      defaultMode="contribution"
      fixedPlanId={planId}
      fixedParentPlanId={planId}
      defaultStartAt={defaultStartDate}
      defaultEndAt={defaultEndDate}
    />
  );
}
