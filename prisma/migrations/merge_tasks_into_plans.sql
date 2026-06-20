-- Run once BEFORE `npx prisma db push` when upgrading from task+plan to plan-only.
-- Example: psql "$DATABASE_URL" -f prisma/migrations/merge_tasks_into_plans.sql
--
-- Order matters: fix feeds while "task" is still a valid enum value, migrate rows,
-- drop tasks, then run `npx prisma db push`.

BEGIN;

-- Leftover from a failed `prisma db push` (enum alter mid-flight)
DROP TYPE IF EXISTS "FeedItemType_new";
DROP TYPE IF EXISTS "PlanStatus_new";
DROP TYPE IF EXISTS "PlanPriority_new";

-- 1) Feeds must not reference item_type = task before enum is narrowed
UPDATE feeds
SET item_type = 'plan'
WHERE item_type::text = 'task';

-- 2) Plans columns used by merged tasks
ALTER TABLE plans ADD COLUMN IF NOT EXISTS priority TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'plans' AND column_name = 'type'
  ) THEN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PlanType') THEN
      ALTER TABLE plans ADD COLUMN type "PlanType" NOT NULL DEFAULT 'goal';
    ELSE
      ALTER TABLE plans ADD COLUMN type TEXT NOT NULL DEFAULT 'goal';
    END IF;
  END IF;
END $$;

-- 3) Copy tasks → plans (skip ids already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'tasks'
  ) THEN
    RAISE NOTICE 'tasks table already removed, skipping data copy';
  ELSIF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PlanType') THEN
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
  ELSE
    INSERT INTO plans (
      id, user_id, title, description, type, parent_plan_id,
      start_date, end_date, status, priority, created_at, updated_at
    )
    SELECT
      t.id,
      t.user_id,
      t.title,
      t.description,
      'daily',
      COALESCE(t.parent_task_id, t.plan_id),
      t.start_date,
      t.due_date,
      CASE t.status::text
        WHEN 'todo' THEN 'not_started'
        WHEN 'in_progress' THEN 'in_progress'
        WHEN 'done' THEN 'done'
        WHEN 'archived' THEN 'archived'
        ELSE 'not_started'
      END,
      t.priority::text,
      t.created_at,
      t.updated_at
    FROM tasks t
    WHERE NOT EXISTS (SELECT 1 FROM plans p WHERE p.id = t.id);
  END IF;
END $$;

-- 4) Memos: task link → plan link
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'memos' AND column_name = 'linked_task_id'
  ) THEN
    UPDATE memos
    SET linked_plan_id = linked_task_id
    WHERE linked_task_id IS NOT NULL
      AND (linked_plan_id IS NULL OR linked_plan_id = linked_task_id);

    ALTER TABLE memos DROP CONSTRAINT IF EXISTS memos_linked_task_id_fkey;
    ALTER TABLE memos DROP COLUMN IF EXISTS linked_task_id;
  END IF;
END $$;

-- 5) Drop tasks table (after copy)
DROP TABLE IF EXISTS tasks CASCADE;

COMMIT;
