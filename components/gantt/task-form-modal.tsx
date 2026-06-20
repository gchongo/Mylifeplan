"use client";

import { Modal } from "@/components/ui/modal";
import { TaskForm, type TaskFormValues } from "@/components/forms/task-form";

export function TaskFormModal({
  open,
  onClose,
  title,
  task,
  defaultParentTaskId,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  task?: TaskFormValues & { id: string };
  defaultParentTaskId?: string | null;
  onSuccess: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} className="max-w-xl">
      <TaskForm
        key={task?.id ?? defaultParentTaskId ?? "new"}
        task={task}
        defaultParentTaskId={defaultParentTaskId}
        onSuccess={() => {
          onSuccess();
          onClose();
        }}
      />
    </Modal>
  );
}
