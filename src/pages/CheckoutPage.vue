<!-- src/pages/CheckoutPage.vue -->
<template>
  <HeaderBar :showBack="true" />

  <div class="container">
    <div class="page-title">結帳</div>

    <!-- B) 收件信息（放上面） -->
    <div class="panel">
      <div class="panel-h">收件信息</div>

      <div class="field">
        <label class="label">姓名<span class="req">*</span></label>
        <input class="input" v-model.trim="form.name" placeholder="請輸入您的姓名" />
      </div>

      <div class="field">
        <label class="label">電話號碼<span class="req">*</span></label>
        <input
          class="input"
          v-model.trim="form.phone"
          inputmode="tel"
          placeholder="請輸入手機號碼（09xxxxxxxx）"
        />
      </div>

      <div class="field">
        <label class="label">7-11 取貨門市<span class="req">*</span></label>

        <!-- ✅ 搜尋門市 / 搜尋方式：左右 -->
        <div class="store-row">
          <!-- 左：搜尋門市 -->
          <div class="store-col">
            <div class="store-search-h">搜尋門市</div>
            <div class="store-search-box">
              <span class="store-icon">🔍</span>
              <input
                class="store-input"
                v-model.trim="storeQuery"
                placeholder="輸入門市"
                @focus="storeOpen = true"
              />
            </div>
          </div>

          <!-- 右：搜尋方式 -->
          <div class="store-col">
            <div class="store-search-h">搜尋方式</div>
            <select class="select" v-model="storeMode">
              <option value="name">門市名稱</option>
              <option value="address">地址</option>
              <option value="no">門市編號</option>
            </select>
          </div>
        </div>

        <!-- ✅ 下拉結果：只有「有輸入關鍵字」才會出現 -->
        <div v-if="storeOpen && hasStoreQuery && filteredStores.length" class="dropdown">
          <button
            v-for="s in filteredStores"
            :key="s.no"
            type="button"
            class="dd-item"
            @click="selectStore(s)"
          >
            <div class="dd-name">{{ s.name }}（{{ s.no }}）</div>
            <div class="dd-addr">{{ s.address }}</div>
          </button>
        </div>

        <!-- ✅ 只有「有輸入」且查不到才顯示 -->
        <div v-if="storeOpen && hasStoreQuery && filteredStores.length === 0" class="dropdown empty-dd">
          查無結果，請換關鍵字。
        </div>

        <!-- ✅ 小字連結式「顯示手動輸入」（固定文案，不顯示隱藏字樣） -->
        <button class="manual-toggle" type="button" @click="manualOpen = !manualOpen">
          顯示手動輸入
        </button>

        <!-- ✅ 手動輸入門市資訊（可顯示/可隱藏） -->
        <div v-if="manualOpen" class="manual-card">
          <div class="manual-title">手動輸入門市資訊</div>

          <div class="m-field">
            <div class="m-label">門市代號</div>
            <input
              class="m-input"
              v-model.trim="manual.no"
              inputmode="numeric"
              placeholder="6位數字（例：123456）"
            />
          </div>

          <div class="m-field">
            <div class="m-label">門市名稱</div>
            <input class="m-input" v-model.trim="manual.name" placeholder="門市完整名稱" />
          </div>

          <div class="m-field">
            <div class="m-label">門市地址（選填）</div>
            <input class="m-input" v-model.trim="manual.address" placeholder="地址（可不填）" />
          </div>

          <div class="m-field">
            <div class="m-label">電話（選填）</div>
            <input class="m-input" v-model.trim="manual.phone" placeholder="例：0422061723" />
          </div>

          <div class="m-actions">
            <button class="m-primary" type="button" @click="applyManualStore">套用此門市</button>
            <button class="m-ghost" type="button" @click="clearManual">清空</button>
          </div>
        </div>

        <!-- ✅ 已選門市顯示（圖1 綠色卡片樣式） -->
        <div v-if="form.store" class="picked-card">
          <div class="picked-top">
            <div class="picked-left">
              <span class="picked-pin">📍</span>
              <div class="picked-name">{{ form.store.name }}</div>
              <span class="picked-badge">{{ form.store.no }}</span>
            </div>

            <button class="picked-close" type="button" aria-label="清除已選門市" @click="clearPickedStore">
              ×
            </button>
          </div>

          <div class="picked-line">{{ form.store.address }}</div>

          <div v-if="form.store.phone" class="picked-line picked-phone">
            電話：{{ form.store.phone }}
          </div>
        </div>

        <!-- ✅ 藍色說明卡 -->
        <div class="store-info">
          <div class="store-info-title">門市選擇說明：</div>
          <ul class="store-info-list">
            <li>輸入門市名稱、地址或店號皆可搜尋並顯示下拉結果</li>
            <li>點選門市後會自動帶入相關資訊</li>
            <li>可搭配「7-11 官方查詢」或「7-11 地圖選擇」輔助找店</li>
            <li class="warn">注意：請務必填入真實可取貨的門市資料</li>
          </ul>
        </div>

        <!-- ✅ 兩個按鈕固定左右並排 -->
        <div class="btn-row">
          <button class="ghost" type="button" @click="open711Official">🔎 7-11 官方查詢</button>
          <button class="ghost" type="button" @click="open711Map">📍 7-11 地圖選擇</button>
        </div>

        <button class="submit" type="button" :disabled="cart.items.length === 0" @click="submitOrder">
          提交訂單
        </button>

        <div v-if="errorMsg" class="err">{{ errorMsg }}</div>
      </div>
    </div>

    <!-- A) 訂單摘要（移到最下方） -->
    <div class="panel">
      <div class="panel-h">訂單摘要</div>

      <div v-if="cart.items.length === 0" class="empty">購物車目前是空的，請先加入商品。</div>

      <div v-else class="summary">
        <div v-for="it in cart.items" :key="it.itemId" class="sum-item">
          <div class="sum-top">
            <div class="sum-name">{{ it.productName }}</div>
            <div class="sum-subtotal">NT$ {{ itemAmount(it) }}</div>
          </div>

          <div class="sum-meta">
            <div>數量：{{ itemQty(it) }}</div>
            <div class="sum-meta-title">規格詳情：</div>

            <div class="chips">
              <span v-for="l in it.lines" :key="l.key" class="chip">
                {{ l.name }} <b>x{{ l.qty }}</b>
              </span>
            </div>
          </div>
        </div>

        <div class="hint-card" v-if="shippingFee > 0">
          <div class="hint-title">🚚 運費提醒</div>
          <div class="hint-text">再購買 NT$ {{ freeShipNeed }} 即可享免運優惠！</div>
        </div>

        <div class="totals">
          <div class="tot-row">
            <span>商品小計：</span>
            <b>NT$ {{ itemsSubtotal }}</b>
          </div>
          <div class="tot-row">
            <span>運費：</span>
            <b>NT$ {{ shippingFee }}</b>
          </div>
          <div class="tot-row tot-final">
            <span>總計：</span>
            <b class="tot-final-num">NT$ {{ grandTotal }}</b>
          </div>
        </div>

        <div class="ship-card">
          <div class="ship-title">配送方式</div>
          <div class="ship-main">7-11 店到店取貨</div>
          <div class="ship-sub">商品將在 3-5 個工作天內送達指定門市</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import HeaderBar from '../components/HeaderBar.vue'
import { useCartStore, PROMO_PRODUCT_ID, type CartItem, type CartVariantLine } from '../store/cart'
import { STORES_711, type Store711 } from '../data/stores711'

const router = useRouter()
const cart = useCartStore()

type Store = { no: string; name: string; address: string; phone?: string }

const STORES: Store[] = (STORES_711 as Store711[]).map(s => ({
  no: s.storeId,
  name: s.name,
  address: s.address
}))

const form = reactive<{
  name: string
  phone: string
  store: Store | null
}>({
  name: '',
  phone: '',
  store: null
})

const errorMsg = ref('')

/** 運費規則：運費 60；滿 3000 免運 */
const FREE_SHIP_THRESHOLD = 3000
const SHIPPING_FEE = 60

function itemQty(it: CartItem) {
  return it.lines.reduce((a, l) => a + l.qty, 0)
}

function itemAmount(it: CartItem) {
  if (it.productId === PROMO_PRODUCT_ID) {
    const payable = cart.getPayableLines(it.productId, it.lines as CartVariantLine[])
    return payable.reduce((a: number, l: any) => a + (l.payableQty ?? l.qty) * l.unitPrice, 0)
  }
  return it.lines.reduce((a, l) => a + l.qty * l.unitPrice, 0)
}

const itemsSubtotal = computed(() => cart.items.reduce((acc, it) => acc + itemAmount(it), 0))

const shippingFee = computed(() => {
  if (cart.items.length === 0) return 0
  return itemsSubtotal.value >= FREE_SHIP_THRESHOLD ? 0 : SHIPPING_FEE
})

const grandTotal = computed(() => itemsSubtotal.value + shippingFee.value)

const freeShipNeed = computed(() => {
  const need = FREE_SHIP_THRESHOLD - itemsSubtotal.value
  return need > 0 ? need : 0
})

/** 門市搜尋：只有輸入關鍵字才顯示下拉 */
const storeOpen = ref(false)
const storeQuery = ref('')
const storeMode = ref<'name' | 'address' | 'no'>('name')

const hasStoreQuery = computed(() => storeQuery.value.trim().length > 0)

const filteredStores = computed(() => {
  const q = storeQuery.value.trim()
  if (!q) return []
  const key = storeMode.value
  const norm = q.toLowerCase()

  return STORES.filter(s => {
    const target = key === 'name' ? s.name : key === 'address' ? s.address : s.no
    return String(target).toLowerCase().includes(norm)
  }).slice(0, 12)
})

function selectStore(s: Store) {
  form.store = s
  storeOpen.value = false
  storeQuery.value = `${s.name}（${s.no}）`
}

watch(storeQuery, () => {
  if (form.store && storeQuery.value !== `${form.store.name}（${form.store.no}）`) {
    form.store = null
  }
})

function onDocClick(e: MouseEvent) {
  const el = e.target as HTMLElement | null
  if (!el) return
  if (el.closest('.store-search-box') || el.closest('.dropdown')) return
  storeOpen.value = false
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))

function clearPickedStore() {
  form.store = null
  storeQuery.value = ''
  storeOpen.value = false
}

/** 手動輸入（可顯示/隱藏） */
const manualOpen = ref(false)
const manual = reactive<{ no: string; name: string; address: string; phone: string }>({
  no: '',
  name: '',
  address: '',
  phone: ''
})

function clearManual() {
  manual.no = ''
  manual.name = ''
  manual.address = ''
  manual.phone = ''
}

function applyManualStore() {
  errorMsg.value = ''

  const no = manual.no.trim()
  const name = manual.name.trim()
  const address = manual.address.trim()
  const phone = manual.phone.trim()

  if (!/^\d{6}$/.test(no)) {
    errorMsg.value = '門市代號需為 6 位數字。'
    return
  }
  if (!name) {
    errorMsg.value = '請填寫門市名稱。'
    return
  }

  const s: Store = {
    no,
    name,
    address: address || '（未提供地址）',
    phone: phone || undefined
  }

  form.store = s
  storeOpen.value = false
  storeQuery.value = `${s.name}（${s.no}）`
  manualOpen.value = false
}

function open711Official() {
  window.open('https://www.ibon.com.tw/mobile/retail_inquiry.aspx#gsc.tab=0', '_blank')
}
function open711Map() {
  window.open('https://emap.pcsc.com.tw/mobilemap/default.aspx', '_blank')
}

function validPhoneTw(v: string) {
  return /^09\d{8}$/.test(v)
}

/** ✅ 這裡是你要的：提交後產生訂單號 + 導到成功頁 */
function submitOrder() {
  errorMsg.value = ''

  if (cart.items.length === 0) {
    errorMsg.value = '購物車為空，無法提交訂單。'
    return
  }
  if (!form.name) {
    errorMsg.value = '請填寫姓名。'
    return
  }
  if (!validPhoneTw(form.phone)) {
    errorMsg.value = '請填寫正確手機號碼（09xxxxxxxx）。'
    return
  }
  if (!form.store) {
    errorMsg.value = '請選擇 7-11 取貨門市。'
    return
  }

  // ✅ 產生訂單號：ORD + YYYYMMDDHHmmss
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  const orderNo = `ORD${y}${m}${day}${hh}${mm}${ss}`
  const createdAt = `${y}/${m}/${day} ${hh}:${mm}`

  // ✅ 把購物車商品整理成成功頁要用的 items
  const items = cart.items.map(it => {
    // 這筆商品的總數量（依 lines 加總）
    const qty = it.lines.reduce((a, l) => a + l.qty, 0)

    // 單價：用加權平均（避免不同規格不同價時顯示錯）
    const subtotalRaw = itemAmount(it) // ✅ 你此檔案已經有 itemAmount()
    const unitPrice = qty > 0 ? Math.round(subtotalRaw / qty) : 0

    // 規格文字（例如：葡萄 x2）
    const specs = it.lines.map(l => `${l.name} ×${l.qty}`)

    return {
      productName: it.productName,
      qty,
      unitPrice,
      subtotal: subtotalRaw,
      specs
    }
  })

  // ✅ 成功頁會讀 sessionStorage.last_order
  const payload = {
    orderNo,
    createdAt,
    total: grandTotal.value,
    name: form.name,
    phone: form.phone,
    storeNo: form.store.no,
    storeName: form.store.name,
    storeAddress: form.store.address,
    items // ✅ 關鍵：把商品一起存進去
  }

  sessionStorage.setItem('last_order', JSON.stringify(payload))
  
// ✅ 把訂單存進 localStorage，提供「訂單查詢頁」使用
const raw = localStorage.getItem('orders_v1')
let arr: any[] = []

if (raw) {
  try {
    arr = JSON.parse(raw)
  } catch {
    arr = []
  }
  if (!Array.isArray(arr)) arr = []
}

arr.push({
  ...payload,
  status: '待確認'
})

localStorage.setItem('orders_v1', JSON.stringify(arr))

  // ✅ 清空購物車（示範流程）
  cart.clear()

  // ✅ 導到成功頁
  router.push('/order-success')
}


</script>

<style scoped>
.container { max-width: 980px; margin: 0 auto; padding: 0 14px 90px; }
.page-title { font-size: 22px; font-weight: 900; margin: 14px 0; }

.panel { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 14px; box-shadow: 0 10px 22px rgba(0,0,0,.05); margin-bottom: 14px; }
.panel-h { font-weight: 900; font-size: 16px; margin-bottom: 12px; }

.empty { opacity: .8; padding: 10px 0; }

.sum-item { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; margin-bottom: 12px; }
.sum-top { display: flex; justify-content: space-between; gap: 10px; align-items: start; }
.sum-name { font-weight: 900; line-height: 1.2; }
.sum-subtotal { font-weight: 900; }
.sum-meta { margin-top: 10px; font-size: 13px; opacity: .9; }
.sum-meta-title { margin-top: 6px; font-weight: 800; opacity: .9; }

.chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
.chip { background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 10px; padding: 6px 10px; }
.chip b { margin-left: 6px; }

.hint-card { margin: 12px 0; border: 1px solid #bfdbfe; background: #eff6ff; border-radius: 12px; padding: 10px 12px; }
.hint-title { font-weight: 900; }
.hint-text { margin-top: 6px; opacity: .9; }

.totals { margin-top: 12px; }
.tot-row { display: flex; justify-content: space-between; margin-top: 8px; }
.tot-final { margin-top: 12px; font-size: 16px; }
.tot-final-num { color: #2563eb; font-size: 20px; }

.ship-card { margin-top: 12px; border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; background: #fafafa; }
.ship-title { font-weight: 900; }
.ship-main { margin-top: 6px; font-weight: 900; color: #1d4ed8; }
.ship-sub { margin-top: 6px; font-size: 13px; opacity: .85; }

.field { margin-top: 12px; }
.label { font-weight: 900; display: block; margin-bottom: 6px; }
.req { color: #ef4444; margin-left: 4px; }
.input { width: 100%; height: 44px; border-radius: 12px; border: 1px solid #e5e7eb; padding: 0 12px; outline: none; }
.input:focus { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,.15); }

/* 搜尋門市 / 搜尋方式：左右 */
.store-row { display: grid; grid-template-columns: 1fr 160px; gap: 10px; }
.store-col { display: flex; flex-direction: column; }
.store-search-h { font-size: 12px; font-weight: 900; opacity: .8; margin-bottom: 6px; }
.store-search-box { display: flex; align-items: center; gap: 8px; border: 1px solid #e5e7eb; border-radius: 12px; padding: 0 10px; height: 44px; }
.store-icon { opacity: .8; }
.store-input { border: 0; outline: none; width: 100%; height: 42px; background: transparent; }
.select { width: 100%; height: 44px; border-radius: 12px; border: 1px solid #e5e7eb; padding: 0 10px; background: #fff; }

.dropdown { margin-top: 10px; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
.dd-item { width: 100%; text-align: left; background: #fff; border: 0; padding: 10px 12px; cursor: pointer; border-bottom: 1px solid #f3f4f6; }
.dd-item:last-child { border-bottom: 0; }
.dd-item:hover { background: #f9fafb; }
.dd-name { font-weight: 900; }
.dd-addr { margin-top: 4px; font-size: 12.5px; opacity: .8; }
.empty-dd { padding: 10px 12px; opacity: .8; }

.manual-toggle{
  margin-top: 8px;
  border: 0;
  background: transparent;
  padding: 0;
  color: #2563eb;
  font-weight: 900;
  font-size: 13px;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.manual-toggle:hover{ filter: brightness(0.95); }

.manual-card{
  margin-top: 10px;
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 12px;
  padding: 12px;
}
.manual-title{
  font-weight: 900;
  margin-bottom: 10px;
}
.m-field{ margin-top: 10px; }
.m-field:first-of-type{ margin-top: 0; }
.m-label{ font-size: 12px; font-weight: 900; opacity: .75; margin-bottom: 6px; }
.m-input{
  width: 100%;
  height: 44px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 0 12px;
  outline: none;
}
.m-input:focus{ border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,.15); }

.m-actions{
  margin-top: 12px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.m-primary{
  height: 44px;
  border-radius: 12px;
  border: 0;
  background: #2563eb;
  color: #fff;
  font-weight: 900;
  cursor: pointer;
}
.m-ghost{
  height: 44px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #fff;
  font-weight: 900;
  cursor: pointer;
}

/* ✅ 已選門市（綠色卡片樣式） */
.picked-card{
  margin-top: 10px;
  border: 1px solid #86efac;
  background: #ecfdf5;
  border-radius: 12px;
  padding: 6px 8px;
}
.picked-top{
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}
.picked-left{
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.picked-pin{ font-size: 15px; }

.picked-name{
  font-weight: 900;
  font-size: 12px;     /* ✅ 華太字體大小 */
  color: #065f46;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.picked-badge{
  flex: 0 0 auto;
  font-weight: 900;
  font-size: 11px;
  color: #065f46;
  border: 1px solid #a7f3d0;
  background: #d1fae5;
  padding: 2px 8px;    /* ✅ 修正你原本的 padding: 1px px (錯字) */
  border-radius: 999px;
}

.picked-close{
  width: 26px;          /* ✅ X 寬度 */
  height: 26px;         /* ✅ X 高度 */
  border-radius: 8px;
  border: 1px solid #a7f3d0;
  background: rgba(255,255,255,.9);
  cursor: pointer;
  font-size: 15px;      /* ✅ X 字體大小 */
  line-height: 1;
  color: #ef4444;
}

.picked-line{
  margin-top: 2px;
  font-size: 11px;      /* ✅ 地址字體大小 */
  line-height: 1.3;
  color: #065f46;
  font-weight: 600;
  opacity: .9;
}
.picked-phone{ font-weight: 900; }

/* 藍色說明卡：變更內距/字體/間距讓更緊湊 */
.store-info {
  margin-top: 10px;
  border: 1px solid #bfdbfe;
  background: #eff6ff;
  border-radius: 12px;
  padding: 8px 10px;
}
.store-info-title {
  font-weight: 900;
  font-size: 13px;
  margin-bottom: 4px;
  color: #1d4ed8;
}
.store-info-list {
  margin: 0;
  padding-left: 16px;
  font-size: 12px;
  line-height: 1.4;
  color: #1f2937;
}
.store-info-list li { margin-top: 3px; }
.store-info-list .warn { color: #dc2626; font-weight: 800; margin-top: 4px; }

.btn-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
.ghost { height: 44px; border-radius: 12px; border: 1px solid #e5e7eb; background: #fff; font-weight: 900; cursor: pointer; }

.submit { width: 100%; height: 48px; border-radius: 12px; border: 0; background: #2563eb; color: #fff; font-weight: 900; cursor: pointer; margin-top: 14px; }
.submit:disabled { opacity: .5; cursor: not-allowed; }

.err { margin-top: 10px; color: #ef4444; font-weight: 900; }

@media (max-width: 520px) {
  .store-row { grid-template-columns: 1fr 140px; }
}
</style>
