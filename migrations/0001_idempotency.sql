-- idempotency_keys: 冪等鍵（防止重複提交）
CREATE TABLE IF NOT EXISTS idempotency_keys (
  key TEXT PRIMARY KEY,
  created_at TEXT NOT NULL
);
