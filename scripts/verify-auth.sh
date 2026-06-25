#!/usr/bin/env bash
# Run on VPS after deploy to verify auth + API work.
set -euo pipefail

BASE="${1:-http://127.0.0.1:3000}"
JAR="$(mktemp)"
trap 'rm -f "$JAR"' EXIT

echo "== Login =="
LOGIN=$(curl -sS -c "$JAR" -b "$JAR" -X POST "$BASE/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@meridian.local","password":"password123"}')
echo "$LOGIN"

echo "== Session =="
SESSION=$(curl -sS -b "$JAR" "$BASE/api/auth/session")
echo "$SESSION"
echo

if ! echo "$SESSION" | grep -q '"email"'; then
  echo "FAIL: session has no user — check AUTH_SECRET and COOKIE_SECURE in .env"
  exit 1
fi

echo "== Plans =="
PLANS_HTTP=$(curl -sS -o /tmp/plans.out -w "%{http_code}" -b "$JAR" "$BASE/api/plans")
echo "HTTP $PLANS_HTTP"
head -c 400 /tmp/plans.out
echo
echo

if [ "$PLANS_HTTP" = "401" ]; then
  echo "If Session above shows a user but Plans is 401, auth cookie is fine."
  echo "Likely causes:"
  echo "  1) DB schema out of sync — run: npx prisma db push"
  echo "  2) Old API code hides DB errors as 401 — git pull, npm run build, pm2 restart"
  echo "Then check: pm2 logs meridian --lines 50"
  exit 1
fi

if [ "$PLANS_HTTP" != "200" ]; then
  echo "FAIL: unexpected Plans status $PLANS_HTTP"
  exit 1
fi

echo "OK: auth + plans API working"
