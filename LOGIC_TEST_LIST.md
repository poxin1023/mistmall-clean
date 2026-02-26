# MistMall 專案邏輯分析與測試清單

> 本機測試用，不含安全性測試

---

## 一、專案結構

```
mistmall-clean/
├── src/                    # Vue 3 前端
│   ├── main.ts
│   ├── App.vue
│   ├── router/index.ts
│   ├── store/cart.ts       # Pinia 購物車
│   ├── data/               # 靜態資料
│   │   ├── products.ts
│   │   ├── tags.ts
│   │   ├── promotions.ts
│   │   └── stores711.ts
│   ├── pages/
│   └── components/
├── worker/index.ts         # Cloudflare Worker 後端
├── migrations/             # D1 資料庫
├── wrangler.toml
└── vite.config.ts
```

---

## 二、資料流概況

| 資料 | 來源 | 儲存 |
|------|------|------|
| 商品 | `products.ts` | 靜態 |
| 購物車 | Pinia store | 記憶體 |
| 訂單（前台） | CheckoutPage | `localStorage.orders_v1` |
| 訂單（後台） | Worker POST /api/orders | D1 `orders` + `order_items` |
| 訂單查詢（前台） | OrdersPage | 讀 `localStorage.orders_v1` |
| 訂單管理（後台） | /admin | 讀寫 D1 |

**注意**：目前 CheckoutPage 只寫入 localStorage，未呼叫 Worker API。若需前後台同步，需在 CheckoutPage 改為呼叫 `POST /api/orders`，並在 vite 設定 `/api` proxy。

---

## 三、本機啟動指令

### 1. 後端（Worker + D1）

```bash
npx wrangler dev
```

- 預設：`http://127.0.0.1:8787`
- 需先執行：`npx wrangler d1 migrations apply mistmall-api --local`

### 2. 前端（Vite）

```bash
npm run dev
```

- 預設：`http://localhost:5173`

### 3. API Proxy（可選）

若 CheckoutPage 要打 Worker，需在 `vite.config.ts` 加上：

```ts
server: {
  proxy: {
    "/api": { target: "http://127.0.0.1:8787", changeOrigin: true },
  },
},
```

---

## 四、邏輯測試清單

### A. 商品瀏覽（ProductsPage）

| # | 邏輯 | 說明 | 驗證方式 |
|---|------|------|----------|
| A1 | 商品列表 | 從 `PRODUCTS` 顯示商品 | 進入 /products 檢查列表 |
| A2 | 標籤篩選 | 依 `TagKey` 篩選 | 點標籤，確認只顯示對應商品 |
| A3 | 關鍵字搜尋 | 依商品名稱搜尋 | 輸入關鍵字，確認結果 |
| A4 | 清除篩選 | 清空關鍵字與標籤 | 點清除，確認恢復全部 |
| A5 | 商品卡片點擊 | 進入商品詳情 | 點卡片，確認跳轉 /product/:id |
| A6 | 商品不存在 | id 無效時顯示訊息 | 造訪 /product/invalid-id |

---

### B. 商品詳情（ProductDetailPage）

| # | 邏輯 | 說明 | 驗證方式 |
|---|------|------|----------|
| B1 | 規格選擇 | 各規格 +/- 數量 | 操作 +/-，確認數量變化 |
| B2 | 庫存限制 | 不可超過 `opt.stock` | 加到上限，確認 + 被禁用 |
| B3 | 價格摘要 | 依選擇數量計算總價 | 變更數量，確認總價 |
| B4 | SP2S 促銷顯示 | 買10送1、可送件數、再差幾件 | 選 SP2S 商品，確認促銷區塊 |
| B5 | 階梯單價 | `calcTierUnitPrice` 依數量調整 | 選 1–9 / 10–19 / 20+ 件，確認單價 |
| B6 | 加入購物車（禁用） | qty=0 時按鈕禁用 | 未選數量時確認按鈕 disabled |
| B7 | 加入購物車 | `cart.addItem()` 並導回商品列表 | 選規格後加入，確認購物車與導向 |
| B8 | 圖片預覽 | 點圖開啟放大 | 點主圖，確認預覽 modal |
| B9 | 多圖切換（meme_7000） | 左右切換相簿 | 選 meme_7000，確認可左右切換 |

---

### C. 購物車（CartDrawer + cart store）

| # | 邏輯 | 說明 | 驗證方式 |
|---|------|------|----------|
| C1 | 購物車數量 badge | HeaderBar 顯示總件數 | 加商品後確認 badge 數字 |
| C2 | 開啟購物車抽屜 | 點購物車圖示 | 點圖示，確認抽屜開啟 |
| C3 | 購物車空狀態 | 無商品時顯示空訊息 | 清空購物車，確認空狀態 |
| C4 | 規格數量 +/- | `updateItemLines` | 在抽屜內 +/-，確認數量與小計 |
| C5 | 移除商品 | `removeItemById` | 點移除，確認該項消失 |
| C6 | SP2S 小計 | `getPayableLines` 計算可付費數量 | 加 SP2S 商品，確認小計正確 |
| C7 | 購物車總金額 | `totalAmount` | 確認總計與各項小計一致 |
| C8 | 前往結帳 | 導向 /checkout | 點結帳，確認跳轉 |
| C9 | 關閉抽屜 | 點 overlay 或按 Escape | 確認抽屜關閉 |

---

### D. 結帳（CheckoutPage）

| # | 邏輯 | 說明 | 驗證方式 |
|---|------|------|----------|
| D1 | 購物車為空 | 無法送出 | 清空購物車進結帳，確認送出 disabled |
| D2 | 姓名必填 | 未填顯示錯誤 | 不填姓名送出，確認錯誤訊息 |
| D3 | 電話格式 | `09xxxxxxxx` | 輸入錯誤格式，確認錯誤訊息 |
| D4 | 門市搜尋 | 依名稱/地址/店號篩選 | 輸入關鍵字，確認下拉結果 |
| D5 | 門市選擇 | 點選帶入門市資訊 | 選門市，確認表單帶入 |
| D6 | 手動輸入門市 | 6 位代號 + 名稱 | 填寫並套用，確認驗證與帶入 |
| D7 | 訂單摘要 | 商品、小計、運費、總計 | 確認摘要與購物車一致 |
| D8 | 運費規則 | NT$60，滿 3000 免運 | 小計 <3000 與 >=3000 各測一次 |
| D9 | 免運提示 | 顯示還差多少免運 | 小計 <3000 時確認提示 |
| D10 | 送出訂單（目前） | 寫入 localStorage + sessionStorage | 送出後確認成功頁與 orders_v1 |
| D11 | 清空購物車 | 送出後 `cart.clear()` | 送出後確認購物車為空 |

---

### E. 訂單成功（OrderSuccessPage）

| # | 邏輯 | 說明 | 驗證方式 |
|---|------|------|----------|
| E1 | 顯示訂單 | 讀 `sessionStorage.last_order` | 送出後確認成功頁內容 |
| E2 | 複製訂單號 | 寫入剪貼簿 | 點複製，確認可貼上 |
| E3 | 前往訂單查詢 | 導向 /orders | 點按鈕，確認跳轉 |
| E4 | 繼續購物 | 導向 /products | 點按鈕，確認跳轉 |
| E5 | Telegram 連結 | 開啟 t.me/Zero777o | 點連結，確認開啟 |

---

### F. 訂單查詢（OrdersPage）

| # | 邏輯 | 說明 | 驗證方式 |
|---|------|------|----------|
| F1 | 電話格式 | `09xxxxxxxx` | 錯誤格式，確認錯誤訊息 |
| F2 | 查詢訂單 | 從 `localStorage.orders_v1` 依電話篩選 | 輸入電話，確認結果 |
| F3 | 最新 3 筆 | `.slice(0, 3)` | 同電話多筆訂單，確認只顯示 3 筆 |
| F4 | 複製訂單號 | 寫入剪貼簿 | 點複製，確認可貼上 |
| F5 | 查無結果 | 無符合訂單時顯示訊息 | 輸入未下單電話，確認訊息 |
| F6 | Telegram 客服 | 開啟 t.me/Zero777o | 點按鈕，確認開啟 |

---

### G. 促銷（SP2S - sp2s_pod_bundle）

| # | 邏輯 | 說明 | 驗證方式 |
|---|------|------|----------|
| G1 | 免費件數 | 買10送1、買20送2 | 選 11 件，確認可送 1 件 |
| G2 | 顯示件數 | `calcDisplayQty` 含贈品 | 選 11 件，確認 badge 為 12 |
| G3 | 付費分配 | 單價高者先折抵 | 混搭規格，確認小計正確 |
| G4 | 階梯單價 | 1–9 / 10–19 / 20+ 不同單價 | 變更數量，確認單價變化 |
| G5 | 未達門檻 | <10 件無贈送 | 選 9 件，確認無贈送 |

---

### H. Worker API（後端）

| # | 邏輯 | 端點 | 說明 | 驗證方式 |
|---|------|------|------|----------|
| H1 | 健康檢查 | GET /api/health | 回傳 `{ ok: true }` | `curl http://127.0.0.1:8787/api/health` |
| H2 | 建立訂單 | POST /api/orders | 驗證 body、寫入 D1 | 用正確 body 送 POST，確認回傳 orderNo |
| H3 | 訂單列表 | GET /api/admin/orders | 回傳所有訂單 | 造訪 /admin 或直接打 API |
| H4 | 訂單詳情 | GET /api/admin/orders/:orderNo | 回傳單筆訂單與明細 | 打 API 或從 /admin 點選 |
| H5 | 更新狀態 | PATCH /api/admin/orders/:id/status | 更新 status | 從 /admin 操作 |
| H6 | 刪除訂單 | DELETE /api/admin/orders/:id | 設為 deleted | 從 /admin 操作 |

---

### I. 後台 /admin（Worker 內嵌 HTML）

| # | 邏輯 | 說明 | 驗證方式 |
|---|------|------|----------|
| I1 | 訂單列表 | 顯示所有訂單 | 造訪 http://127.0.0.1:8787/admin |
| I2 | 搜尋 | 依訂單號/姓名/電話篩選 | 輸入關鍵字，確認列表變化 |
| I3 | 顯示模式 | 只看待處理 / 全部 | 切換選項，確認列表變化 |
| I4 | 訂單詳情 | 點選顯示右側詳情 | 點一筆，確認右側內容 |
| I5 | 標記已寄件 | 更新 status 為 shipped | 點按鈕，確認狀態變化 |
| I6 | 改回待確認 | 更新 status 為 pending | 點按鈕，確認狀態變化 |
| I7 | 刪除訂單 | 更新 status 為 deleted | 點按鈕，確認訂單消失 |
| I8 | 複製寄件資訊 | 寫入剪貼簿 | 點按鈕，確認可貼上 |
| I9 | 複製訂單號 | 寫入剪貼簿 | 點按鈕，確認可貼上 |

---

### J. 導航與 UI

| # | 邏輯 | 說明 | 驗證方式 |
|---|------|------|----------|
| J1 | 回首頁 | HeaderBar 品牌點擊 | 點品牌，確認到 /products |
| J2 | 返回 | HeaderBar 返回按鈕 | 點返回，確認回到上一頁 |
| J3 | 購物須知 | NoticePage | 進入 /notice，確認 3 秒後導向 |
| J4 | 7-11 官方查詢 | 開啟 ibon 連結 | 結帳頁點按鈕，確認開啟 |
| J5 | 7-11 地圖 | 開啟 emap 連結 | 結帳頁點按鈕，確認開啟 |
| J6 | LINE / Telegram | FloatingLineButton | 點按鈕，確認開啟對應連結 |
| J7 | Toast | 加入購物車後顯示 | 加入購物車，確認 toast 出現 |

---

## 五、本機測試前置

1. **D1  migrations**
   ```bash
   npx wrangler d1 migrations apply mistmall-api --local
   ```

2. **Turnstile（本機 bypass）**  
   wrangler.toml 已設 `DEV_BYPASS_TURNSTILE = "true"`，localhost 可略過驗證。

3. **Access（本機 bypass）**  
   wrangler.toml 已設 `DEV_BYPASS_ACCESS = "true"`，localhost 可略過 Access。

4. **idempotency_keys 表**  
   若 Worker 有使用 idempotency，需執行 `0002_idempotency.sql`。

---

## 六、測試流程建議

1. **純前台**：`npm run dev` → 商品 → 加入購物車 → 結帳 → 訂單查詢  
2. **含後台**：`npx wrangler dev` + `npm run dev`（含 proxy）→ 結帳打 API → /admin 查看訂單
