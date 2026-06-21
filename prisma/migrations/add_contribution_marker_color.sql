-- Optional per-contribution Gantt marker color (null = inherit plan group color).
-- Run: source .env && psql "${DATABASE_URL%%\?*}" -f prisma/migrations/add_contribution_marker_color.sql

ALTER TABLE plan_contributions
  ADD COLUMN IF NOT EXISTS marker_color TEXT;
