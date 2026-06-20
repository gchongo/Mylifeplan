export type UserRole = "user" | "admin";

export type TaskStatus = "todo" | "in_progress" | "done" | "archived";
export type TaskPriority = "high" | "medium" | "low";
export type PlanType = "goal" | "phase" | "weekly" | "daily";
export type PlanStatus = "not_started" | "in_progress" | "done" | "archived";
export type FeedItemType = "task" | "plan" | "memo";
export type FeedActionType = "create" | "update" | "complete" | "archive";
export type SubscriptionStatus = "active" | "expired" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed";

export interface GanttItem {
  id: string;
  title: string;
  startDate: string;
  effectiveEnd: string;
  isVirtualEnd: boolean;
  type: "task" | "plan";
  parentId?: string | null;
  status?: string;
}

export interface CalendarItem {
  id: string;
  title: string;
  startDate: string;
  dueDate?: string | null;
  type: "task" | "plan";
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
