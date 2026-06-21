-- 备忘录：Markdown 正文、图片、评论
ALTER TABLE memos ADD COLUMN IF NOT EXISTS body TEXT;

CREATE TABLE IF NOT EXISTS memo_images (
  id TEXT PRIMARY KEY,
  memo_id TEXT NOT NULL REFERENCES memos(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS memo_images_memo_id_idx ON memo_images(memo_id);

CREATE TABLE IF NOT EXISTS memo_comments (
  id TEXT PRIMARY KEY,
  memo_id TEXT NOT NULL REFERENCES memos(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS memo_comments_memo_id_created_at_idx ON memo_comments(memo_id, created_at);
