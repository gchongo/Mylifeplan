"use client";

import { Modal } from "@/components/ui/modal";
import { PlanForm } from "@/components/forms/plan-form";

export function PlanFormModal({
  open,
  onClose,
  title,
  defaultParentPlanId,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  defaultParentPlanId?: string | null;
  onSuccess: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} className="max-w-xl">
      <PlanForm
        key={defaultParentPlanId ?? "new"}
        defaultParentPlanId={defaultParentPlanId}
        onSuccess={() => {
          onSuccess();
          onClose();
        }}
      />
    </Modal>
  );
}
