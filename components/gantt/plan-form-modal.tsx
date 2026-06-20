"use client";

import { Modal } from "@/components/ui/modal";
import { PlanForm } from "@/components/forms/plan-form";

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
  const formKey = `${defaultParentPlanId ?? "new"}-${defaultStartDate ?? ""}-${defaultEndDate ?? ""}`;

  return (
    <Modal open={open} onClose={onClose} title={title} className="max-w-xl">
      <PlanForm
        key={formKey}
        defaultParentPlanId={defaultParentPlanId}
        defaultStartDate={defaultStartDate}
        defaultEndDate={defaultEndDate}
        onSuccess={() => {
          onSuccess();
          onClose();
        }}
      />
    </Modal>
  );
}
