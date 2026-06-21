"use client";

import { PlanContributionComposeModal } from "@/components/forms/plan-contribution-compose-modal";

export function PlanFormModal({
  open,
  onClose,
  title,
  defaultParentPlanId,
  defaultStartDate,
  defaultEndDate,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  defaultParentPlanId?: string | null;
  defaultStartDate?: string | null;
  defaultEndDate?: string | null;
  onSuccess: () => void;
}) {
  return (
    <PlanContributionComposeModal
      open={open}
      onClose={onClose}
      onSuccess={onSuccess}
      title={title}
      defaultMode="plan"
      fixedParentPlanId={defaultParentPlanId}
      fixedPlanId={defaultParentPlanId}
      defaultStartAt={defaultStartDate}
      defaultEndAt={defaultEndDate}
    />
  );
}
