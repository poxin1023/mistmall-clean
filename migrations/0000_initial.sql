-- MistMall D1 初始 schema
-- orders: 訂單主檔
CREATE TABLE IF NOT EXISTS orders (
  order_no TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  store_no TEXT NOT NULL,
  store_name TEXT NOT NULL,
  store_address TEXT,
  amount INTEGER NOT NULL DEFAULT 0
);

-- order_items: 訂單明細
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_no TEXT NOT NULL,
  product_name TEXT NOT NULL,
  variant_text TEXT,
  qty INTEGER NOT NULL,
  unit_price INTEGER NOT NULL,
  line_total INTEGER NOT NULL,
  FOREIGN KEY (order_no) REFERENCES orders(order_no)
);

-- abuse_logs: 限流/濫用紀錄
CREATE TABLE IF NOT EXISTS abuse_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  window_start TEXT NOT NULL
);

-- audit_logs: 稽核紀錄
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  ip TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
