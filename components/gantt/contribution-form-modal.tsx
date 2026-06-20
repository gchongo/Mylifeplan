"use client";

import { Modal } from "@/components/ui/modal";
import { ContributionForm } from "@/components/forms/contribution-form";

export function ContributionFormModal({
  open,
  onClose,
  planId,
  occurredOn,
  title = "添加贡献",
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  planId: string;
  occurredOn: string;
  title?: string;
  onSuccess: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} className="max-w-lg">
      <ContributionForm
        key={`${planId}-${occurredOn}`}
        planId={planId}
        occurredOn={occurredOn}
        onSuccess={() => {
          onSuccess();
          onClose();
        }}
      />
    </Modal>
  );
}
