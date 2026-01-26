<!-- src/pages/OrderSuccessPage.vue -->
<template>
  <HeaderBar :showBack="true" />

  <!-- 🔔 下單完成提示（新增） -->
  <div class="order-tip">
    感謝您的下單，訂單待確認請回報。
  </div>

  <div class="container">
    <!-- 成功標頭 -->
    <div class="hero">
      <div class="check">✓</div>
      <div class="hero-title">訂單提交成功！</div>
      <div class="hero-sub">感謝您的訂購，我們將盡快為您處理訂單</div>
    </div>

    <!-- 訂單資訊 -->
    <div class="panel">
      <div class="panel-h">訂單資訊</div>

      <div class="info-row">
        <div class="k">訂單號</div>
        <div class="v mono">
          {{ order.orderNo }}
          <button class="copy" type="button" @click="copy(order.orderNo)">複製</button>
        </div>
      </div>

      <div class="info-row">
        <div class="k">訂單狀態</div>
        <div class="v">
          <span class="badge">待確認</span>
        </div>
      </div>

      <div class="info-row">
        <div class="k">下單時間</div>
        <div class="v">{{ order.createdAt }}</div>
      </div>

      <div class="info-row">
        <div class="k">總金額</div>
        <div class="v total">NT$ {{ order.total }}</div>
      </div>
    </div>

    <!-- 收件資訊（置中） -->
    <div class="panel">
      <div class="panel-h">收件資訊</div>
      <div class="ship-box">
        <div class="ship-row">收件人：{{ order.name }}</div>
        <div class="ship-row">電話：{{ order.phone }}</div>
        <div class="ship-row">
          取貨門市：7-11 {{ order.storeName }}（{{ order.storeNo }}）
        </div>
        <div class="ship-row" v-if="order.storeAddress">
          地址：{{ order.storeAddress }}
        </div>
      </div>
    </div>

    <!-- 訂單商品 -->
    <div class="panel">
      <div class="panel-h">訂單商品</div>

      <div v-if="order.items && order.items.length" class="items">
        <div v-for="(it, i) in order.items" :key="i" class="item-card">
          <div class="item-top">
            <div class="item-name">{{ it.productName }}</div>
            <div class="item-subtotal">NT$ {{ it.subtotal }}</div>
          </div>

          <div class="item-meta">
            <div>數量：{{ it.qty }} × NT$ {{ it.unitPrice }}</div>

            <div v-if="it.specs?.length" class="chips">
              <span v-for="(s, si) in it.specs" :key="si" class="chip">
                {{ s }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-items">（無商品資料）</div>
    </div>

    <!-- 下一步 -->
    <div class="panel">
      <div class="panel-h">接下來該做什麼？</div>

      <div class="steps">
        <div class="step">
          <div class="n">1</div>
          <div>
            <div class="st">等待確認</div>
            <div class="sd">我們將在 24 小時內確認您的訂單</div>
          </div>
        </div>

        <div class="step">
          <div class="n">2</div>
          <div>
            <div class="st">商品配送</div>
            <div class="sd">確認後 3–5 個工作天內送達指定門市</div>
          </div>
        </div>

        <div class="step">
          <div class="n">3</div>
          <div>
            <div class="st">到店取貨</div>
            <div class="sd">收到通知後請攜證件取貨</div>
          </div>
        </div>
      </div>

      <div class="remind">
        提醒：請保存您的訂單號，用於查詢訂單狀態與取貨時使用。
      </div>
    </div>

    <!-- 客服 -->
    <div class="panel">
      <div class="panel-h">需要協助？</div>
      <div class="help-sub">如有任何問題，請聯繫我們的 Telegram 客服</div>
      <button class="btn primary" @click="goTelegram">聯繫 Telegram 客服</button>
    </div>

    <div class="actions">
      <button class="btn" @click="goOrders">查詢訂單狀態</button>
      <button class="btn ghost" @click="goHome">返回首頁</button>
      <button class="btn success" @click="goContinue">繼續購物</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import HeaderBar from '../components/HeaderBar.vue'

const router = useRouter()

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
  items: OrderItemPayload[]
}

const order = computed<OrderPayload>(() => {
  const raw = sessionStorage.getItem('last_order')
  if (raw) {
    try {
      return JSON.parse(raw)
    } catch {}
  }
  return {
    orderNo: 'ORD-UNKNOWN',
    createdAt: '',
    total: 0,
    name: '',
    phone: '',
    storeNo: '',
    storeName: '',
    storeAddress: '',
    items: []
  }
})

async function copy(v: string) {
  await navigator.clipboard.writeText(v)
}

function goHome() { router.push('/products') }
function goContinue() { router.push('/products') }
function goOrders() { router.push('/orders') }
function goTelegram() {
  window.open('https://t.me/Zero777o', '_blank')
}
</script>

<style scoped>
.container { max-width: 980px; margin: 0 auto; padding: 12px 14px 90px; }

/* 成功標頭 */
.hero{ background:#16a34a; color:#fff; border-radius:14px; padding:18px 14px; text-align:center; }
.check{ width:56px; height:56px; border-radius:999px; margin:0 auto 10px; display:grid; place-items:center; background:rgba(255,255,255,.18); font-size:28px; font-weight:900; }
.hero-title{ font-size:22px; font-weight:900; }
.hero-sub{ margin-top:6px; opacity:.92; }

/* 面板 */
.panel{ margin-top:12px; background:#fff; border:1px solid #e5e7eb; border-radius:14px; padding:14px; box-shadow:0 10px 22px rgba(0,0,0,.05); }
.panel-h{ font-weight:900; font-size:16px; margin-bottom:10px; }

/* 訂單資訊 */
.info-row{
  display:flex;
  justify-content:space-between;
  align-items:center; /* ✅ 對齊修正 */
  gap:10px;
  padding:10px 0;
  border-top:1px solid #f3f4f6;
}
.info-row:first-of-type{ border-top:0; padding-top:0; }
.k{ opacity:.7; font-weight:900; }
.v{ font-weight:900; text-align:right; }
.mono{ font-family:ui-monospace, Menlo, Consolas, monospace; }
.copy{ margin-left:8px; height:28px; padding:0 10px; border-radius:10px; border:1px solid #e5e7eb; background:#fff; font-weight:900; }

/* 訂單狀態 badge（顏色＋置中修正） */
.badge{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  height:28px;
  padding:0 12px;
  border-radius:999px;
  background:#fde68a;
  border:1px solid #f59e0b;
  color:#92400e;
  font-weight:900;
  font-size:12px;
  line-height:1;
}

/* 金額 */
.total{ color:#16a34a; font-size:18px; }

/* 收件資訊（你要調整的都在這） */
.ship-box{ text-align:center; }
.ship-row{
  margin-top:6px;      /* 行距 */
  font-size:13px;      /* 字體大小 */
  line-height:1.55;    /* 行高 */
  font-weight:900;
  opacity:.92;
}
.ship-row:first-of-type{ margin-top:0; }

/* 訂單商品 */
.items{ display:grid; gap:10px; }
.item-card{ border:1px solid #e5e7eb; border-radius:12px; padding:12px; }
.item-top{ display:flex; justify-content:space-between; gap:10px; }
.item-name{ font-weight:900; }
.item-subtotal{ font-weight:900; }
.item-meta{ margin-top:8px; font-size:13px; opacity:.92; }
.chips{ margin-top:8px; display:flex; gap:8px; flex-wrap:wrap; }
.chip{ background:#eff6ff; border:1px solid #dbeafe; border-radius:10px; padding:6px 10px; font-size:12px; font-weight:900; }
.empty-items{ opacity:.7; font-weight:900; }

/* 步驟 */
.steps{ display:grid; gap:10px; }
.step{ display:flex; gap:10px; }
.n{ width:28px; height:28px; border-radius:999px; background:#dbeafe; display:grid; place-items:center; font-weight:900; }
.st{ font-weight:900; }
.sd{ margin-top:4px; font-size:13px; opacity:.85; font-weight:900; }

/* 提醒 */
.remind{ margin-top:12px; padding:10px 12px; border-radius:12px; background:#fefce8; border:1px solid #fde68a; font-weight:900; }

/* 按鈕 */
.actions{ margin-top:12px; display:grid; gap:10px; }
.btn{ height:48px; border-radius:12px; border:1px solid #e5e7eb; background:#fff; font-weight:900; }
.btn.primary{ background:#2563eb; color:#fff; border:0; }
.btn.success{ background:#16a34a; color:#fff; border:0; }

/* 🔔 下單完成提示（新增） */
.order-tip{
  max-width: 980px;
  margin: 10px auto 0;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid #ffe0a3;
  background: #fff7e6;
  color: #8a5a00;
  font-weight: 900;
  font-size: 14px;
  text-align: center;
}
</style>
