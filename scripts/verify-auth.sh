#!/usr/bin/env bash
# Run on VPS after deploy to verify auth + API work.
set -euo pipefail

BASE="${1:-http://127.0.0.1:3000}"
JAR="$(mktemp)"
trap 'rm -f "$JAR"' EXIT

echo "== Login =="
LOGIN=$(curl -sS -c "$JAR" -b "$JAR" -X POST "$BASE/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@mylifeplan.local","password":"password123"}')
echo "$LOGIN"

echo "== Session =="
curl -sS -b "$JAR" "$BASE/api/auth/session"
echo

echo "== Plans =="
curl -sS -o /tmp/plans.out -w "HTTP %{http_code}\n" -b "$JAR" "$BASE/api/plans"
head -c 200 /tmp/plans.out
echo
