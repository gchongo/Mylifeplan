#!/usr/bin/env bash
# Pull latest, migrate DB, rebuild, restart.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "== git pull =="
git pull origin main
git log -1 --oneline

# shellcheck disable=SC1091
source scripts/lib/database.sh 2>/dev/null || true

if [ -f prisma/migrations/contribution_date_range.sql ] && command -v run_psql >/dev/null 2>&1; then
  echo "== contribution date range migration =="
  run_psql -f prisma/migrations/contribution_date_range.sql || true
fi

if [ -f prisma/migrations/plan_datetime.sql ] && command -v run_psql >/dev/null 2>&1; then
  echo "== plan datetime migration =="
  run_psql -f prisma/migrations/plan_datetime.sql || true
fi

if [ -f prisma/migrations/add_memo_rich_content.sql ] && command -v run_psql >/dev/null 2>&1; then
  echo "== memo rich content migration =="
  run_psql -f prisma/migrations/add_memo_rich_content.sql || true
fi

if [ -f prisma/migrations/add_memo_sticky_board.sql ] && command -v run_psql >/dev/null 2>&1; then
  echo "== memo sticky board migration =="
  run_psql -f prisma/migrations/add_memo_sticky_board.sql || true
fi

if [ -f prisma/migrations/add_memo_quadrant_size.sql ] && command -v run_psql >/dev/null 2>&1; then
  echo "== memo quadrant size migration =="
  run_psql -f prisma/migrations/add_memo_quadrant_size.sql || true
fi

if [ -f prisma/migrations/add_contribution_rich_content.sql ] && command -v run_psql >/dev/null 2>&1; then
  echo "== contribution rich content migration =="
  run_psql -f prisma/migrations/add_contribution_rich_content.sql || true
fi

echo "== prisma db push =="
npx prisma db push

echo "== build =="
npm run build

echo "== pm2 restart =="
if pm2 describe mylifeplan >/dev/null 2>&1; then
  pm2 restart mylifeplan
else
  echo "Process 'mylifeplan' not found — starting fresh"
  pm2 start npm --name mylifeplan -- start
  pm2 save
fi

echo "== done =="
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:3000/ || true
