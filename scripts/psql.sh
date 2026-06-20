#!/usr/bin/env bash
# psql wrapper: uses DATABASE_URL from .env but strips ?schema=public for psql.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck disable=SC1091
source "$ROOT/scripts/lib/database.sh"

if [ ! -f "$ROOT/.env" ]; then
  echo "Missing $ROOT/.env" >&2
  exit 1
fi

# shellcheck disable=SC1091
set -a
source "$ROOT/.env"
set +a

run_psql "$@"
