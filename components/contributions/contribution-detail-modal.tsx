"use client";

import { Modal } from "@/components/ui/modal";
import { GanttContributionDrawerPanel } from "@/components/gantt/gantt-contribution-drawer";

export function ContributionDetailModal({
  contributionId,
  open,
  onClose,
  onChanged,
}: {
  contributionId: string | null;
  open: boolean;
  onClose: () => void;
  onChanged?: () => void;
}) {
  if (!contributionId) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={null}
      className="max-h-[90vh] max-w-2xl overflow-y-auto p-0"
    >
      <GanttContributionDrawerPanel
        contributionId={contributionId}
        onClose={onClose}
        onUpdated={onChanged}
        onDeleted={onChanged}
      />
    </Modal>
  );
}
