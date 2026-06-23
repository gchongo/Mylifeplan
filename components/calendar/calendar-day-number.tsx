import { cn } from "@/lib/utils";

export function CalendarDayNumber({
  day,
  isToday,
  isSelected,
}: {
  day: number;
  isToday: boolean;
  isSelected: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full text-xs font-semibold",
        isToday && "bg-red-500 text-white",
        !isToday && isSelected && "bg-gray-900 text-white",
        !isToday && !isSelected && "text-gray-800",
      )}
    >
      {day}
    </span>
  );
}
