"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

export function GanttBarActionModal({
  open,
  onClose,
  planTitle,
  canAddSubPlan,
  onAddContribution,
  onAddSubPlan,
  onViewDetail,
}: {
  open: boolean;
  onClose: () => void;
  planTitle: string;
  canAddSubPlan: boolean;
  onAddContribution: () => void;
  onAddSubPlan: () => void;
  onViewDetail: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title={planTitle} className="max-w-sm">
      <div className="flex flex-col gap-2">
        <Button type="button" variant="secondary" onClick={onAddContribution}>
          添加贡献记录
        </Button>
        {canAddSubPlan && (
          <Button type="button" variant="secondary" onClick={onAddSubPlan}>
            添加子计划
          </Button>
        )}
        <Button type="button" variant="ghost" onClick={onViewDetail}>
          查看计划详情
        </Button>
      </div>
    </Modal>
  );
}
