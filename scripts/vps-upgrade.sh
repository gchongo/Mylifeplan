#!/usr/bin/env bash
# One-shot VPS upgrade: migrate task data, sync schema, restart app.
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "Missing .env in $(pwd)"
  exit 1
fi

# shellcheck disable=SC1091
set -a
source .env
set +a

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is not set in .env"
  exit 1
fi

echo "== Before =="
psql "$DATABASE_URL" -c "
SELECT 'feeds.task' AS metric, COUNT(*)::text AS n FROM feeds WHERE item_type::text = 'task'
UNION ALL
SELECT 'tasks.rows', CASE WHEN to_regclass('public.tasks') IS NULL THEN '0' ELSE (SELECT COUNT(*)::text FROM tasks) END
UNION ALL
SELECT 'plans.rows', COUNT(*)::text FROM plans;
"

echo
echo "== SQL migration (feeds + tasks → plans) =="
psql "$DATABASE_URL" -f prisma/migrations/merge_tasks_into_plans.sql

echo
echo "== After migration =="
psql "$DATABASE_URL" -c "
SELECT 'feeds.task' AS metric, COUNT(*)::text AS n FROM feeds WHERE item_type::text = 'task'
UNION ALL
SELECT 'tasks.table', CASE WHEN to_regclass('public.tasks') IS NULL THEN 'gone' ELSE 'still exists' END
UNION ALL
SELECT 'plans.rows', COUNT(*)::text FROM plans;
"

echo
echo "== prisma db push =="
npx prisma db push

echo
echo "== rebuild & restart =="
npm run build
pm2 restart mylifeplan

echo
echo "== verify auth =="
bash scripts/verify-auth.sh http://127.0.0.1:3000
