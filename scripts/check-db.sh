#!/usr/bin/env bash
# Quick DB sanity check on VPS (requires .env with DATABASE_URL).
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "Missing .env"
  exit 1
fi

# shellcheck disable=SC1091
set -a
source .env
set +a

echo "== plans table columns =="
psql "$DATABASE_URL" -c "
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'plans'
ORDER BY ordinal_position;
"

echo "== row counts =="
psql "$DATABASE_URL" -c "
SELECT 'plans' AS tbl, COUNT(*)::text AS n FROM plans
UNION ALL SELECT 'feeds', COUNT(*)::text FROM feeds
UNION ALL SELECT 'memos', COUNT(*)::text FROM memos
UNION ALL SELECT 'users', COUNT(*)::text FROM users;
"

echo "== tasks table (should not exist after merge) =="
psql "$DATABASE_URL" -c "
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'tasks'
) AS tasks_table_exists;
"

echo
echo "If priority/type columns missing or tasks still exists, run:"
echo "  psql \"\$DATABASE_URL\" -f prisma/migrations/merge_tasks_into_plans.sql   # if tasks has data"
echo "  npx prisma db push"
echo "  pm2 restart mylifeplan"
