import type { GanttActualLinePreferences } from "@/lib/user-preferences";

export function ganttActualLineStrokeDasharray(
  style: GanttActualLinePreferences["style"],
): string | undefined {
  switch (style) {
    case "dashed":
      return "6 4";
    case "dotted":
      return "2 3";
    default:
      return undefined;
  }
}
