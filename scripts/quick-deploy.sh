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

echo "== prisma db push =="
npx prisma db push

echo "== build =="
npm run build

echo "== pm2 restart =="
pm2 restart mylifeplan

echo "== done =="
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:3000/ || true
