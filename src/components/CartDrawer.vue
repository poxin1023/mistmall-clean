<!-- src/components/CartDrawer.vue -->
<template>
  <div v-if="open" class="overlay" @click.self="emit('close')">
    <aside class="drawer" role="dialog" aria-label="購物車">
      <div class="drawer-head">
        <div class="title">購物車 ({{ cart.totalDisplayQty }})</div>
        <button class="close" type="button" aria-label="關閉" @click="emit('close')">×</button>
      </div>

      <div class="drawer-body">
        <div v-if="cart.items.length === 0" class="empty">
          <div class="empty-icon">🛍️</div>
          <div class="empty-title">購物車是空的</div>
          <div class="empty-sub">快去挑選您喜歡的商品吧！</div>
        </div>

        <div v-else class="list">
          <div v-for="it in cart.items" :key="it.itemId" class="item">
            <div class="item-top">
              <div class="item-name">{{ it.productName }}</div>
              <button class="remove" type="button" @click="removeCard(it.itemId)">×</button>
            </div>

            <div class="item-sub">規格詳情：</div>

            <div v-for="line in safeLines(it)" :key="line.key" class="line">
              <div class="line-name">{{ line.name }}</div>

              <div class="line-qty">
                <button
                  class="qty-btn"
                  type="button"
                  :disabled="line.qty <= 0"
                  @click="setLineQty(it.itemId, line.key, line.qty - 1)"
                >
                  -
                </button>
                <span class="qty-num">{{ line.qty }}</span>
                <button
                  class="qty-btn"
                  type="button"
                  @click="setLineQty(it.itemId, line.key, line.qty + 1)"
                >
                  +
                </button>
              </div>

              <div class="line-subtotal">
                NT$ {{ lineSubtotal(it.itemId, it.productId, line.key, line.qty, line.unitPrice) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="drawer-foot" v-if="cart.items.length > 0">
        <div class="total-row">
          <span>總計：</span>
          <b>NT$ {{ cart.totalAmount }}</b>
        </div>

        <button class="checkout" type="button" @click="goCheckout">前往結帳</button>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore, type CartVariantLine, type CartItem, PROMO_PRODUCT_ID } from '../store/cart'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const router = useRouter()
const cart = useCartStore()

function normalizeLine(l: any): CartVariantLine | null {
  const key = typeof l?.key === 'string' ? l.key : null
  const name = typeof l?.name === 'string' ? l.name : null
  const qty = typeof l?.qty === 'number' ? l.qty : null
  const unitPrice = typeof l?.unitPrice === 'number' ? l.unitPrice : null
  if (!key || !name || qty === null || unitPrice === null) return null
  return { key, name, qty, unitPrice }
}

function safeLines(it: CartItem): CartVariantLine[] {
  return (it.lines as any[])
    .map(normalizeLine)
    .filter((x): x is CartVariantLine => x !== null)
}

function removeCard(itemId: string) {
  cart.removeItemById(itemId)
}

function lineSubtotal(itemId: string, productId: string, key: string, qty: number, unitPrice: number) {
  if (productId !== PROMO_PRODUCT_ID) return qty * unitPrice

  const it = cart.items.find(i => i.itemId === itemId)
  if (!it) return qty * unitPrice

  const payableLines = cart.getPayableLines(productId, safeLines(it))
  const found = payableLines.find(l => l.key === key)
  const payableQty = found ? (found as any).payableQty ?? qty : qty
  return payableQty * unitPrice
}

function setLineQty(itemId: string, key: string, nextQty: number) {
  const it = cart.items.find(i => i.itemId === itemId)
  if (!it) return

  const lines: CartVariantLine[] = safeLines(it).map(l => ({ ...l }))
  const idx = lines.findIndex(l => l.key === key)
  if (idx < 0) return

  if (nextQty <= 0) {
    lines.splice(idx, 1)
  } else {
    // ✅ TS 保底：避免 lines[idx] 被推成可能 undefined
    const cur = lines[idx]
    if (!cur) return
    lines[idx] = {
      key: cur.key,
      name: cur.name,
      unitPrice: cur.unitPrice,
      qty: nextQty
    }
  }

  cart.updateItemLines({ itemId, lines })
}

function goCheckout() {
  router.push('/checkout')
  emit('close')
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
  .overlay{ position: fixed; inset: 0; background: rgba(0,0,0,.28); z-index: 9999; }
  .drawer{ position: absolute; right: 0; top: 0; height: 100%; width: min(420px, 92vw); background: #fff; display:flex; flex-direction:column; box-shadow:-12px 0 28px rgba(0,0,0,.18); }
  
  .drawer-head{
    display:flex;
    align-items:center;
    justify-content:space-between;
    padding:14px;
    border-bottom:1px solid #e5e7eb;
  }
  .title{ font-weight:900; color:#111827; }
  .close{
    width:34px;
    height:34px;
    border-radius:10px;
    border:1px solid #e5e7eb;
    background:#fff;
    font-size:18px;
    cursor:pointer;
  }
  
  .drawer-body{ padding:14px; overflow:auto; flex:1 1 auto; }
  
  .empty{
    height:100%;
    min-height:220px;
    display:grid;
    place-content:center;
    text-align:center;
    gap:8px;
    opacity:.9;
  }
  .empty-icon{ font-size:44px; }
  .empty-title{ font-weight:900; }
  .empty-sub{ opacity:.8; }
  
  .list{ display:flex; flex-direction:column; gap:14px; }
  
  /* ===== 資訊卡內（你已調整完成的版本）===== */
  
  /* 白色商品卡 */
  .item{
    border:1px solid #e5e7eb;
    border-radius:12px;
    padding:8px 12px; /* 上下已縮 */
  }
  
  .item-top{
    display:flex;
    justify-content:space-between;
    gap:10px;
    align-items:start;
  }
  .item-name{ font-weight:900; line-height:1.2; }
  
  .remove{
    width:28px;
    height:28px;
    border-radius:10px;
    border:0;
    background:transparent;
    cursor:pointer;
    font-size:18px;
    color:#ef4444;
  }
  
  /* 規格詳情文字 */
  .item-sub{
    margin-top:7px;
    font-size:13px;
    opacity:.85;
  }
  
  /* 藍色規格框（你目前的最終比例） */
  .line{
    margin-top:7px;
    background:#eef3fb;
    border:1px solid #dbe6fb;
    border-radius:10px;
    padding:3px 10px; /* 你已經調到想要的高度 */
    display:grid;
    grid-template-columns:1fr auto;
    gap:8px;
  }
  
  .line-name{
    font-weight:800;
    color:#2563eb;
  }
  
  .line-qty{
    display:flex;
    align-items:center;
    gap:10px;
    justify-self:end;
  }
  .qty-btn{
    width:28px;
    height:28px;
    border-radius:8px;
    border:1px solid #d1d5db;
    background:#fff;
    cursor:pointer;
  }
  .qty-num{
    min-width:18px;
    text-align:center;
    font-weight:900;
  }
  .line-subtotal{
    grid-column:2/3;
    justify-self:end;
    color:#ef4444;
    font-weight:900;
  }
  
  /* ===== 總計區塊（新增：你要求的樣式）===== */
  
  .drawer-foot{
    border-top:1px solid #e5e7eb;
    padding:12px 14px;
  }
  
  .total-row{
    display:flex;
    justify-content:space-between;
    align-items:center;
    font-size:16px;
  }
  
  /* 「總計」文字 */
  .total-row span{
    font-weight:900;
  }
  
  /* 金額 */
  .total-row b{
    font-weight:900;
    color:#ef4444;
  }
  
  .checkout{
    width:100%;
    margin-top:10px;
    height:44px;
    border-radius:12px;
    border:0;
    background:#2563eb;
    color:#fff;
    font-weight:900;
    cursor:pointer;
  }
  </style>
  