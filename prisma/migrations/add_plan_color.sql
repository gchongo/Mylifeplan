-- Add custom plan color for Gantt bars (status shown via dot on title)
ALTER TABLE plans ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#6366F1';
