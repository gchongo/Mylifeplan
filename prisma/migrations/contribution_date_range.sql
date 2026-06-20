-- Add optional end date for contribution time ranges.
-- Run: psql "$PSQL_URL" -f prisma/migrations/contribution_date_range.sql

BEGIN;

ALTER TABLE plan_contributions
  ADD COLUMN IF NOT EXISTS occurred_end_on DATE;

COMMIT;
