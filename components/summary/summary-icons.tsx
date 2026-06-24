import { cn } from "@/lib/utils";

type IconProps = { className?: string };

function IconBase({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      className={cn("h-5 w-5 shrink-0", className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function IconPlans({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
      <path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" />
    </IconBase>
  );
}

export function IconInProgress({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </IconBase>
  );
}

export function IconDone({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M9 12l2 2 4-4" />
      <circle cx="12" cy="12" r="9" />
    </IconBase>
  );
}

export function IconNotStarted({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8v8l6-4-6-4z" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function IconOverdue({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M12 8v5" />
      <circle cx="12" cy="16" r="0.5" fill="currentColor" />
      <path d="M10.3 4.2l-7 12.1A2 2 0 005 19h14a2 2 0 001.7-2.7l-7-12.1a2 2 0 00-3.4 0z" />
    </IconBase>
  );
}

export function IconEarly({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M4 14l4-4 4 2 6-7" />
      <path d="M4 20h16" />
    </IconBase>
  );
}

export function IconArchived({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M4 7h16v12H4z" />
      <path d="M8 7V5h8v2" />
      <path d="M10 11h4" />
    </IconBase>
  );
}

export function IconMemo({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M6 4h12v16l-3-2-3 2-3-2-3 2V4z" />
      <path d="M9 8h6M9 12h4" />
    </IconBase>
  );
}

export function IconContribution({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
    </IconBase>
  );
}

export function IconStatus({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </IconBase>
  );
}

export function IconType({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M4 6h16M4 12h10M4 18h14" />
    </IconBase>
  );
}

export function IconExecution({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M3 17l6-6 4 4 8-10" />
      <path d="M14 5h7v7" />
    </IconBase>
  );
}

export function IconRecent({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M9 12l2 2 4-4" />
      <path d="M12 3a9 9 0 100 18 9 9 0 000-18z" />
    </IconBase>
  );
}

export function IconGoal({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
    </IconBase>
  );
}

export function IconPhase({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M4 7h16M4 12h12M4 17h8" />
    </IconBase>
  );
}

export function IconWeekly({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </IconBase>
  );
}

export function IconDaily({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </IconBase>
  );
}

export function IconOnTime({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M9 12l2 2 4-4" />
      <circle cx="12" cy="12" r="9" />
    </IconBase>
  );
}

export function IconLate({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
      <path d="M16 5l3 3" />
    </IconBase>
  );
}

export function IconOnTrack({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M4 14a8 8 0 0116 0" />
      <path d="M12 14v4" />
      <circle cx="12" cy="8" r="2" />
    </IconBase>
  );
}

export function IconUnscheduled({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M16 3l-4 7M8 3l4 7" />
    </IconBase>
  );
}

export function IconScheduleOver({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M6 6l12 12M6 18L18 6" />
      <path d="M4 7h6M14 17h6" />
    </IconBase>
  );
}

const TYPE_ICON_MAP = {
  goal: IconGoal,
  phase: IconPhase,
  weekly: IconWeekly,
  daily: IconDaily,
} as const;

const STATUS_ICON_MAP = {
  not_started: IconNotStarted,
  in_progress: IconInProgress,
  done: IconDone,
  archived: IconArchived,
} as const;

const EXECUTION_ICON_MAP = {
  early: IconEarly,
  onTime: IconOnTime,
  late: IconLate,
  deadline: IconOverdue,
  schedule: IconScheduleOver,
  onTrack: IconOnTrack,
  unscheduled: IconUnscheduled,
} as const;

export type ExecutionVariant = keyof typeof EXECUTION_ICON_MAP;

export function TypeIcon({ type, className }: { type: keyof typeof TYPE_ICON_MAP; className?: string }) {
  const C = TYPE_ICON_MAP[type];
  return <C className={className} />;
}

export function StatusIcon({ status, className }: { status: keyof typeof STATUS_ICON_MAP; className?: string }) {
  const C = STATUS_ICON_MAP[status];
  return <C className={className} />;
}

export function ExecutionIcon({
  variant,
  className,
}: {
  variant: ExecutionVariant;
  className?: string;
}) {
  const C = EXECUTION_ICON_MAP[variant];
  return <C className={className} />;
}
