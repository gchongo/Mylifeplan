export type UserRole = "user" | "admin";

export type PlanStatus = "not_started" | "in_progress" | "done" | "archived";
export type PlanPriority = "high" | "medium" | "low";
export type PlanType = "goal" | "phase" | "weekly" | "daily";
export type FeedItemType = "plan" | "memo" | "contribution";
export type FeedActionType = "create" | "update" | "complete" | "archive";
export type SubscriptionStatus = "active" | "expired" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed";

/** @deprecated Use PlanStatus — kept for status style helpers */
export type TaskStatus = "todo" | "in_progress" | "done" | "archived";

export interface GanttItem {
  id: string;
  title: string;
  startDate: string;
  endDate?: string | null;
  effectiveEnd: string;
  isVirtualEnd: boolean;
  parentId?: string | null;
  status?: string;
  contributionOnly?: boolean;
}

export interface GanttContribution {
  id: string;
  planId: string;
  planTitle?: string;
  title: string;
  description?: string | null;
  occurredOn: string;
}

export interface CalendarItem {
  id: string;
  title: string;
  startDate: string;
  endDate?: string | null;
  status: string;
}

export interface FeedItem {
  id: string;
  itemType: FeedItemType;
  itemId: string;
  actionType: FeedActionType;
  content?: string | null;
  createdAt: string;
}

export type HomeTab = "feed" | "gantt" | "calendar";
