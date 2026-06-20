"use client";

import { Modal } from "@/components/ui/modal";
import { ContributionForm } from "@/components/forms/contribution-form";

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
    <Modal open={open} onClose={onClose} title="添加贡献" className="max-w-lg">
      <ContributionForm
        key={`${planId}-${defaultStartDate}`}
        planId={planId}
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
