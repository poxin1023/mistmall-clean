<!-- src/pages/OrderSuccessPage.vue -->
<template>
    <HeaderBar :showBack="true" />
  
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

    <!-- 複製成功通知（手機/桌機共用） -->
    <div v-if="copyToastShow" class="copy-toast" role="status" aria-live="polite">
      {{ copyToastMsg }}
    </div>

    <!-- 下單成功後立即顯示圖片彈窗 -->
    <div v-if="promoModalOpen" class="promo-modal" @click.self="closePromoModal">
      <div class="promo-frame">
        <button class="promo-close" type="button" aria-label="關閉圖片彈窗" @click="closePromoModal">×</button>
        <img class="promo-img" :src="promoImageUrl" alt="下單完成提醒圖片" />
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
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
  
  const copyToastShow = ref(false)
  const copyToastMsg = ref('')
  let copyToastTimer: number | null = null

  const promoModalOpen = ref(false)
  const promoImageUrl = '/products/127.png'

  onMounted(() => {
    promoModalOpen.value = true
  })

  onBeforeUnmount(() => {
    if (copyToastTimer !== null) {
      window.clearTimeout(copyToastTimer)
      copyToastTimer = null
    }
  })

  function closePromoModal() {
    promoModalOpen.value = false
  }

  function showCopyToast(message: string) {
    copyToastMsg.value = message
    copyToastShow.value = true
    if (copyToastTimer !== null) window.clearTimeout(copyToastTimer)
    copyToastTimer = window.setTimeout(() => {
      copyToastShow.value = false
      copyToastTimer = null
    }, 1800)
  }

  async function copy(v: string) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(v)
      } else {
        const el = document.createElement('textarea')
        el.value = v
        el.setAttribute('readonly', '')
        el.style.position = 'fixed'
        el.style.top = '-9999px'
        document.body.appendChild(el)
        el.focus()
        el.select()
        document.execCommand('copy')
        document.body.removeChild(el)
      }
      showCopyToast('複製完成，請回報訂單')
    } catch {
      showCopyToast('複製失敗，請手動記下訂單號')
    }
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
  .copy{
    margin-left:8px;
    height:32px;
    min-width:56px;
    padding:0 10px;
    border-radius:10px;
    border:1px solid #d1d5db;
    background:#fff;
    font-weight:900;
    cursor:pointer;
    touch-action: manipulation;
  }
  
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

  .copy-toast{
    position: fixed;
    left: 50%;
    bottom: 20px;
    transform: translateX(-50%);
    z-index: 10020;
    max-width: calc(100vw - 28px);
    padding: 12px 16px;
    border-radius: 12px;
    color: #fff;
    font-weight: 900;
    font-size: 14px;
    line-height: 1.35;
    text-align: center;
    background: rgba(17, 24, 39, 0.68);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    box-shadow: 0 10px 24px rgba(0, 0, 0, .2);
  }

  .promo-modal{
    position: fixed;
    inset: 0;
    z-index: 10010;
    background: rgba(0,0,0,.62);
    display: grid;
    place-items: center;
    padding: 16px;
  }
  .promo-img{
    max-width: 92vw;
    max-height: 88vh;
    object-fit: contain;
    border-radius: 14px;
    background: #fff;
    display: block;
  }
  .promo-frame{
    position: relative;
    max-width: 92vw;
    max-height: 88vh;
    display: grid;
    place-items: center;
  }
  .promo-close{
    position: absolute;
    top: 8px;
    right: 8px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    aspect-ratio: 1 / 1;
    box-sizing: border-box;
    padding: 0;
    border: 1px solid rgba(255, 255, 255, 0.5);
    background: rgba(255, 255, 255, 0.24);
    backdrop-filter: blur(10px) saturate(160%);
    -webkit-backdrop-filter: blur(10px) saturate(160%);
    color: #ffffff;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
    display: grid;
    place-items: center;
    font-size: 24px;
    line-height: 1;
    cursor: pointer;
    z-index: 10011;
  }
  </style>
  