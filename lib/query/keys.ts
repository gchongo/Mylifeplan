import type { FeedTypeFilter } from "@/lib/feed-filters";

export const queryKeys = {
  plans: {
    all: ["plans"] as const,
    list: (status?: "archived") => ["plans", { status: status ?? "active" }] as const,
  },
  gantt: {
    all: ["gantt"] as const,
    range: (from: string, to: string) => ["gantt", from, to] as const,
  },
  calendar: {
    all: ["calendar"] as const,
    range: (from: string, to: string) => ["calendar", from, to] as const,
  },
  feed: {
    all: ["feed"] as const,
    list: (filter: FeedTypeFilter, limit: number) => ["feed", filter, limit] as const,
  },
  memos: {
    all: ["memos"] as const,
    standalone: ["memos", "standalone"] as const,
  },
  summary: {
    all: ["summary"] as const,
  },
};
