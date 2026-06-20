-- Upgrade plan start/end from DATE to TIMESTAMP (minute precision).
-- Run: psql "$PSQL_URL" -f prisma/migrations/plan_datetime.sql

BEGIN;

ALTER TABLE plans
  ALTER COLUMN start_date TYPE TIMESTAMP(3) USING start_date::timestamp,
  ALTER COLUMN end_date TYPE TIMESTAMP(3) USING end_date::timestamp;

COMMIT;
