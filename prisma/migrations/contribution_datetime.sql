-- Upgrade contribution occurred_on / occurred_end_on from DATE to TIMESTAMP (minute precision).
-- Run: psql "$PSQL_URL" -f prisma/migrations/contribution_datetime.sql

BEGIN;

ALTER TABLE plan_contributions
  ALTER COLUMN occurred_on TYPE TIMESTAMP(3) USING occurred_on::timestamp,
  ALTER COLUMN occurred_end_on TYPE TIMESTAMP(3) USING occurred_end_on::timestamp;

COMMIT;
