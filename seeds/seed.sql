-- 測試用 seed（可選執行）
-- 執行：npx wrangler d1 execute mistmall-api --local --file=./seeds/seed.sql

INSERT OR IGNORE INTO orders (order_no, created_at, status, name, phone, store_no, store_name, store_address, amount)
VALUES
  ('ORD-TEST-001', datetime('now', '-2 days'), 'pending', '測試用戶A', '0912345678', '123456', '7-11 測試門市', '台北市測試區測試路1號', 260),
  ('ORD-TEST-002', datetime('now', '-1 day'), 'shipped', '測試用戶B', '0987654321', '654321', '7-11 另一門市', '新北市測試區測試路2號', 520);

INSERT OR IGNORE INTO order_items (order_no, product_name, variant_text, qty, unit_price, line_total)
VALUES
  ('ORD-TEST-001', '測試商品A', '規格1 ×1', 1, 200, 200),
  ('ORD-TEST-001', '運費', '', 1, 60, 60),
  ('ORD-TEST-002', '測試商品B', '規格2 ×2', 2, 230, 460),
  ('ORD-TEST-002', '運費', '', 1, 60, 60);
