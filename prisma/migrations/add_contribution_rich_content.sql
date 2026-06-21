-- 贡献记录：Markdown 正文、图片
ALTER TABLE plan_contributions ADD COLUMN IF NOT EXISTS body TEXT;

CREATE TABLE IF NOT EXISTS contribution_images (
  id TEXT PRIMARY KEY,
  contribution_id TEXT NOT NULL REFERENCES plan_contributions(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS contribution_images_contribution_id_idx ON contribution_images(contribution_id);
