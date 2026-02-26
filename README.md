# MistMall

Vue 3 + TypeScript + Vite 電商前台，後端為 Cloudflare Worker + D1。

## 本機重建（建議先看）

- 請先閱讀：`docs/LOCAL_DEV.md`
- 固定啟動順序：`npm run dev:api` → `npm run dev:web`

## 專案結構

```
mistmall-clean/
├── src/                    # Vue 3 前端
│   ├── main.ts
│   ├── App.vue
│   ├── router/
│   ├── store/              # Pinia 購物車
│   ├── data/               # 靜態資料（商品、門市等）
│   ├── pages/
│   └── components/
├── worker/                # Cloudflare Worker 後端 API
│   └── index.ts
├── migrations/             # D1 資料庫 schema
│   ├── 0000_initial.sql   # orders, order_items, abuse_logs, audit_logs
│   └── 0001_idempotency.sql
├── seeds/                  # 可選測試資料
│   └── seed.sql
├── wrangler.toml           # Worker 設定
├── vite.config.ts         # 前端 + /api proxy
└── package.json
```

## 本地測試環境

### 1. 安裝依賴

```bash
npm install
```

### 2. 啟動後端 API（Worker + D1）

**首次或 schema 變更時，先執行 migrations：**

```powershell
npx wrangler d1 migrations apply mistmall-api --local
```

**（可選）載入測試資料：**

```powershell
npx wrangler d1 execute mistmall-api --local --file=./seeds/seed.sql
```

**啟動 Worker：**

```bash
npm run dev:api
```

後端 API 會在 `http://127.0.0.1:8787`。

### 3. 啟動前端

```bash
npm run dev:web
```

前端會在 `http://localhost:5173`，`/api` 會自動 proxy 到 Worker。

### 4. 測試流程

1. 開兩個終端：一個跑 `npm run dev:api`，一個跑 `npm run dev:web`
2. 瀏覽 `http://localhost:5173` → 商品 → 加入購物車 → 結帳 → 提交訂單
3. 訂單會寫入 D1，可在 `http://127.0.0.1:8787/admin` 查看（本機 bypass Access）

### 5. 快速 API 驗證（PowerShell）

```powershell
# 健康檢查
Invoke-RestMethod -Uri "http://127.0.0.1:8787/api/health" -Method GET

# 下單測試（需先啟動 Worker）
$body = @{
  name = "測試"
  phone = "0912345678"
  storeNo = "123456"
  storeName = "7-11 測試門市"
  storeAddress = "台北市"
  amount = 260
  items = @(
    @{ productName = "測試商品"; specs = @(); qty = 1; unitPrice = 200; subtotal = 200 },
    @{ productName = "運費"; specs = @(); qty = 1; unitPrice = 60; subtotal = 60 }
  )
  turnstileToken = ""
} | ConvertTo-Json -Depth 5
Invoke-RestMethod -Uri "http://127.0.0.1:8787/api/orders" -Method POST -Body $body -ContentType "application/json" -Headers @{ "Idempotency-Key" = [guid]::NewGuid().ToString() }
```

### 腳本說明

| 腳本 | 說明 |
|------|------|
| `npm run dev` / `npm run dev:web` | 啟動 Vite 前端 |
| `npm run dev:api` | 啟動 Wrangler Worker 後端 |
| `npm run build` | 建置前端 |

## 後台密碼設定（禁止明文）

- 不要在任何檔案放明文密碼（包含 `wrangler.toml`、repo、log）
- Worker 使用 `ADMIN_PASSWORD_HASH`，格式：
  - `pbkdf2$sha256$<iterations>$<salt_base64>$<hash_base64>`
- 產生 hash：

```bash
node ./tools/gen-admin-password-hash.mjs
```

- 將輸出值設定到環境變數 `ADMIN_PASSWORD_HASH`（不要提交真值）

## 後端打不開時

若出現 `entry-point file not found` 或類似錯誤：

1. **確認在專案根目錄執行**：`cd` 到 `mistmall-clean` 再跑 `npm run dev:api`
2. **確認 worker/index.ts 存在**：入口檔為 `worker/index.ts`
3. **路徑含中文時**：專案若在「桌面」等含中文的路徑，Wrangler 可能無法解析。建議複製到純英文路徑，例如：
   ```bash
   # 複製到 D:\dev\mistmall-clean 或 C:\projects\mistmall-clean
   xcopy "D:\我的桌面\mistmall-clean" "D:\dev\mistmall-clean" /E /I
   cd D:\dev\mistmall-clean
   npm run dev:api
   ```
