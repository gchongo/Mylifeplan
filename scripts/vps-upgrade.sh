#!/usr/bin/env bash
# One-shot VPS upgrade: migrate task data, sync schema, restart app.
set -euo pipefail

cd "$(dirname "$0")/.."
# shellcheck disable=SC1091
source scripts/lib/database.sh

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
run_psql -c "
SELECT 'feeds.task' AS metric, COUNT(*)::text AS n FROM feeds WHERE item_type::text = 'task'
UNION ALL
SELECT 'tasks.rows', CASE WHEN to_regclass('public.tasks') IS NULL THEN '0' ELSE (SELECT COUNT(*)::text FROM tasks) END
UNION ALL
SELECT 'plans.rows', COUNT(*)::text FROM plans;
"

echo
echo "== SQL migration (feeds + tasks → plans) =="
run_prisma_sql_file prisma/migrations/merge_tasks_into_plans.sql

echo
echo "== After migration =="
run_psql -c "
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
if pm2 describe mylifeplan >/dev/null 2>&1; then
  pm2 restart mylifeplan
else
  echo "Process 'mylifeplan' not found — starting fresh"
  pm2 start npm --name mylifeplan -- start
  pm2 save
fi

echo
echo "== verify auth =="
bash scripts/verify-auth.sh http://127.0.0.1:3000
