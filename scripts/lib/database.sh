#!/usr/bin/env bash
# Shared helpers for shell scripts that talk to Postgres.
# Prisma DATABASE_URL often ends with ?schema=public — native psql rejects that.

psql_database_url() {
  if [ -z "${DATABASE_URL:-}" ]; then
    echo "DATABASE_URL is not set" >&2
    return 1
  fi
  # Strip Prisma-only query string (?schema=public, etc.)
  echo "${DATABASE_URL%%\?*}"
}

run_psql() {
  psql "$(psql_database_url)" "$@"
}

run_prisma_sql_file() {
  local file="$1"
  if command -v npx >/dev/null 2>&1 && [ -f prisma/schema.prisma ]; then
    npx prisma db execute --file "$file" --schema prisma/schema.prisma
  else
    run_psql -f "$file"
  fi
}
