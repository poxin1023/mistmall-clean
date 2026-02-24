<!-- src/pages/OrdersPage.vue -->
<template>
  <HeaderBar :showBack="true" />

  <div class="container">
    <div class="title">訂單查詢</div>
    <div class="sub">
      請輸入購買時使用的手機號碼查詢訂單狀態
      <div class="hint">※ 顯示該手機號碼的最新三筆訂單記錄</div>
    </div>

    <!-- 重要提醒卡 -->
    <div class="warn-card">
      <div class="warn-top">
        <div class="warn-icon">⚠️</div>
        <div class="warn-title">重要提醒</div>
      </div>

      <div class="warn-text">
        此查詢頁面並非絕對皆能查詢，因商品寄出和系統非同步進行，您訂購的商品可能已經安排出貨，但是系統尚未更新狀態，
        此頁面僅供參考，如要正確貨態查詢可以與客服人員聯繫。
      </div>

      <button class="tg-btn" type="button" @click="goTelegram">
        聯繫 Telegram 客服
      </button>
    </div>

    <!-- 查詢卡 -->
    <div class="panel">
      <div class="panel-h">
        <span class="search-ico">🔍</span>
        <span>訂單查詢</span>
      </div>

      <div class="field">
        <div class="label">手機號碼</div>
        <input
          class="input"
          v-model.trim="phone"
          inputmode="tel"
          placeholder="請輸入購買時使用的手機號碼"
        />
      </div>

      <button class="submit" type="button" @click="onSearch">
        查詢訂單
      </button>

      <div v-if="err" class="err">{{ err }}</div>
    </div>

    <!-- 查詢結果（最新 3 筆） -->
    <div v-if="searched" class="results">
      <div class="r-title">查詢結果</div>

      <div v-if="list.length === 0" class="empty">
        查無此手機號碼的訂單紀錄。
      </div>

      <div v-else class="cards">
        <div v-for="o in list" :key="o.orderNo" class="order-card">
          <div class="row">
            <div class="k">訂單號</div>
            <div class="v mono">
              {{ o.orderNo }}
              <button class="copy" type="button" @click="copy(o.orderNo)">複製</button>
            </div>
          </div>

          <div class="row">
            <div class="k">訂單狀態</div>
            <div class="v">
              <span class="badge">{{ o.status || '待確認' }}</span>
            </div>
          </div>

          <div class="row">
            <div class="k">下單時間</div>
            <div class="v">{{ o.createdAt }}</div>
          </div>

          <div class="row">
            <div class="k">總金額</div>
            <div class="v total">NT$ {{ o.total }}</div>
          </div>

          <div class="mini">
            <div>取貨門市：7-11 {{ o.storeName }}（{{ o.storeNo }}）</div>
            <div v-if="o.storeAddress">地址：{{ o.storeAddress }}</div>
          </div>
        </div>
      </div>
    </div>

    <div style="height: 18px;"></div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import HeaderBar from '../components/HeaderBar.vue'

type OrderItemPayload = {
  productName: string
  qty: number
  unitPrice: number
  subtotal: number
  specs: string[]
}

type OrderPayload = {
  orderNo: string
  createdAt: string
  total: number
  name: string
  phone: string
  storeNo: string
  storeName: string
  storeAddress?: string
  status?: string
  items?: OrderItemPayload[]
}

const phone = ref('')
const err = ref('')
const searched = ref(false)
const list = ref<OrderPayload[]>([])

function validPhoneTw(v: string) {
  return /^09\d{8}$/.test(v)
}

function readAllOrders(): OrderPayload[] {
  // 主要：從 localStorage 讀所有訂單
  const raw = localStorage.getItem('orders_v1')
  if (raw) {
    try {
      const arr = JSON.parse(raw) as OrderPayload[]
      if (Array.isArray(arr)) return arr
    } catch {}
  }

  // 保底：如果你目前只有 sessionStorage last_order，也能先查到 1 筆
  const last = sessionStorage.getItem('last_order')
  if (last) {
    try {
      const one = JSON.parse(last) as OrderPayload
      return [one]
    } catch {}
  }

  return []
}

function onSearch() {
  err.value = ''
  searched.value = true

  const p = phone.value.trim()
  if (!validPhoneTw(p)) {
    err.value = '請輸入正確手機號碼（09xxxxxxxx）。'
    list.value = []
    return
  }

  const all = readAllOrders()
  const filtered = all
    .filter(o => (o.phone || '').trim() === p)
    // createdAt 是字串，這裡用 orderNo（含時間）或 fallback 直接 reverse
    .slice()
    .reverse()
    .slice(0, 3)

  list.value = filtered
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {}
}

function goTelegram() {
  window.open('https://t.me/Zero777o', '_blank')
}
</script>

<style scoped>
.container { max-width: 520px; margin: 0 auto; padding: 16px 14px 90px; }
.title { text-align: center; font-size: 22px; font-weight: 900; margin-top: 6px; }
.sub { text-align: center; margin-top: 8px; font-weight: 900; opacity: .75; line-height: 1.35; }
.hint { margin-top: 6px; font-size: 12px; opacity: .75; font-weight: 900; }

.warn-card{
  margin-top: 14px;
  border: 1px solid #f5d58a;
  background: #fff7db;
  border-radius: 14px;
  padding: 14px;
}
.warn-top{ display: flex; align-items: center; gap: 10px; }
.warn-icon{ font-size: 18px; }
.warn-title{ font-weight: 900; color: #9a5a00; }
/* ✅ 黃色提醒框：中間提醒文字（就是你要改的那段） */
.warn-text{
  margin-top: 10px;

  font-size: 13px;      /* 文字大小：改這 */
  line-height: 1.6;     /* 行距：改這 */
  color: #92400e;       /* 字色：改這（深橘更清楚） */

  font-weight: 700;     /* 粗細：改這（原本900太粗） */
  opacity: 1;           /* 透明度：改這（原本.85會淡） */
}


.tg-btn{
  margin-top: 12px;
  width: 100%;
  height: 44px;
  border-radius: 12px;
  border: 0;
  background: #2563eb;
  color: #fff;
  font-weight: 900;
  cursor: pointer;
}

.panel{
  margin-top: 14px;
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 10px 22px rgba(0,0,0,.05);
}
.panel-h{
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 900;
  font-size: 18px;
}
.search-ico{ font-size: 18px; opacity: .9; }

.field{ margin-top: 12px; }
.label{ font-weight: 900; margin-bottom: 8px; opacity: .85; }
.input{
  width: 100%;
  height: 44px;
  border-radius: 12px;
  border: 2px solid #111827;
  padding: 0 12px;
  outline: none;
  font-weight: 900;
}
.input:focus{ border-color: #2563eb; }

.submit{
  margin-top: 12px;
  width: 100%;
  height: 46px;
  border-radius: 10px;
  border: 0;
  background: #111827;
  color: #fff;
  font-weight: 900;
  cursor: pointer;
}

.err{ margin-top: 10px; color: #ef4444; font-weight: 900; }

.results{ margin-top: 14px; }
.r-title{ font-weight: 900; opacity: .85; margin-bottom: 8px; }
.empty{ opacity: .75; font-weight: 900; padding: 8px 2px; }

.cards{ display: grid; gap: 10px; }
.order-card{
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 12px;
  background: #fff;
  box-shadow: 0 10px 22px rgba(0,0,0,.04);
}
.row{
  display:flex;
  justify-content: space-between;
  align-items:center;
  gap: 10px;
  padding: 8px 0;
  border-top: 1px solid #f3f4f6;
}
.row:first-child{ border-top: 0; padding-top: 0; }
.k{ font-weight: 900; opacity: .7; }
.v{ font-weight: 900; text-align: right; }
.mono{ font-family: ui-monospace, Menlo, Consolas, monospace; }

.copy{
  margin-left: 8px;
  height: 28px;
  padding: 0 10px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #fff;
  font-weight: 900;
  cursor: pointer;
}

.badge{
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  background: #fde68a;
  border: 1px solid #f59e0b;
  color: #92400e;
  font-size: 12px;
  font-weight: 900;
  line-height: 1;
}

.total{ color: #16a34a; font-size: 16px; }

.mini{
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #e5e7eb;
  font-weight: 900;
  opacity: .85;
  line-height: 1.55;
  font-size: 13px;
}
</style>

</style>
</style>
</style>
</style>
</style>