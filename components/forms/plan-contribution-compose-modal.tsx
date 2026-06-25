"use client";

import { useI18n } from "@/components/i18n/i18n-provider";
import { Modal } from "@/components/ui/modal";
import {
  PlanContributionComposeForm,
  type PlanContributionComposeMode,
  type PlanContributionComposeResult,
} from "@/components/forms/plan-contribution-compose-form";

export function PlanContributionComposeModal({
  open,
  onClose,
  onSuccess,
  title,
  defaultMode = "plan",
  fixedParentPlanId,
  fixedPlanId,
  defaultStartAt,
  defaultEndAt,
  allowModeSwitch = true,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess?: (result?: PlanContributionComposeResult) => void;
  title?: string;
  defaultMode?: PlanContributionComposeMode;
  fixedParentPlanId?: string | null;
  fixedPlanId?: string | null;
  defaultStartAt?: string | null;
  defaultEndAt?: string | null;
  allowModeSwitch?: boolean;
}) {
  const { t } = useI18n();
  const modalTitle =
    title ??
    (fixedParentPlanId ? t("gantt.addPlanOrContribution") : t("gantt.newPlanOrContribution"));

  const formKey = [
    open ? "open" : "closed",
    defaultMode,
    fixedParentPlanId ?? "",
    fixedPlanId ?? "",
    defaultStartAt ?? "",
    defaultEndAt ?? "",
  ].join("-");

  return (
    <Modal open={open} onClose={onClose} title={modalTitle} className="max-w-2xl">
      {open && (
        <PlanContributionComposeForm
          formKey={formKey}
          defaultMode={defaultMode}
          fixedParentPlanId={fixedParentPlanId}
          fixedPlanId={fixedPlanId}
          defaultStartAt={defaultStartAt}
          defaultEndAt={defaultEndAt}
          allowModeSwitch={allowModeSwitch}
          onSuccess={(result) => {
            onSuccess?.(result);
            onClose();
          }}
          onCancel={onClose}
        />
      )}
    </Modal>
  );
}
