import type { PlanStatus } from "@prisma/client";

export type PlanActualChildRow = {
  status: PlanStatus;
  actualStartDate: Date | null;
  actualEndDate: Date | null;
  startDate: Date | null;
  endDate: Date | null;
};

function isDoneOrArchived(status: PlanStatus): boolean {
  return status === "done" || status === "archived";
}

function resolveChildStart(child: PlanActualChildRow): Date | null {
  if (child.actualStartDate) return child.actualStartDate;
  if (isDoneOrArchived(child.status)) return child.startDate;
  return null;
}

function resolveChildEnd(child: PlanActualChildRow): Date | null {
  if (child.actualEndDate) return child.actualEndDate;
  if (isDoneOrArchived(child.status)) return child.endDate;
  return null;
}

/** 父计划实际起止：最早子计划开始、最晚子计划结束（仅当全部非归档子计划已完成时写入结束） */
export function aggregateParentActualDates(children: PlanActualChildRow[]): {
  actualStartDate: Date | null;
  actualEndDate: Date | null;
} {
  const active = children.filter((child) => child.status !== "archived");
  if (active.length === 0) {
    return { actualStartDate: null, actualEndDate: null };
  }

  const allDone = active.every((child) => isDoneOrArchived(child.status));

  let actualStartDate: Date | null = null;
  for (const child of active) {
    const start = resolveChildStart(child);
    if (!start) continue;
    if (!actualStartDate || start.getTime() < actualStartDate.getTime()) {
      actualStartDate = start;
    }
  }

  let actualEndDate: Date | null = null;
  if (allDone) {
    for (const child of active) {
      const end = resolveChildEnd(child);
      if (!end) continue;
      if (!actualEndDate || end.getTime() > actualEndDate.getTime()) {
        actualEndDate = end;
      }
    }
  }

  return { actualStartDate, actualEndDate };
}
