-- Run once BEFORE `npx prisma db push` when upgrading from task+plan to plan-only.
-- Example: psql "$DATABASE_URL" -f prisma/migrations/merge_tasks_into_plans.sql

BEGIN;

ALTER TABLE plans ADD COLUMN IF NOT EXISTS priority TEXT;

INSERT INTO plans (
  id, user_id, title, description, type, parent_plan_id,
  start_date, end_date, status, priority, created_at, updated_at
)
SELECT
  t.id,
  t.user_id,
  t.title,
  t.description,
  'daily'::"PlanType",
  COALESCE(t.parent_task_id, t.plan_id),
  t.start_date,
  t.due_date,
  CASE t.status::text
    WHEN 'todo' THEN 'not_started'::"PlanStatus"
    WHEN 'in_progress' THEN 'in_progress'::"PlanStatus"
    WHEN 'done' THEN 'done'::"PlanStatus"
    WHEN 'archived' THEN 'archived'::"PlanStatus"
    ELSE 'not_started'::"PlanStatus"
  END,
  t.priority::text,
  t.created_at,
  t.updated_at
FROM tasks t
WHERE NOT EXISTS (SELECT 1 FROM plans p WHERE p.id = t.id);

UPDATE memos
SET linked_plan_id = linked_task_id
WHERE linked_task_id IS NOT NULL
  AND (linked_plan_id IS NULL OR linked_plan_id = linked_task_id);

UPDATE feeds SET item_type = 'plan' WHERE item_type::text = 'task';

ALTER TABLE memos DROP CONSTRAINT IF EXISTS memos_linked_task_id_fkey;
ALTER TABLE memos DROP COLUMN IF EXISTS linked_task_id;

DROP TABLE IF EXISTS tasks CASCADE;

COMMIT;
