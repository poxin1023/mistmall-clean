<!-- src/pages/ProductDetailPage.vue -->
<template>
  <HeaderBar :showBack="true" />

  <div class="container">
    <div class="panel panel-pad product-head" v-if="product">
      <div class="media">
        <button class="media-btn" type="button" :disabled="!product.image" @click="product.image && openPreview(product.image)">
          <div class="media-box">
            <span v-if="!product.image" class="media-empty">商品圖片（待補）</span>
            <img v-else :src="product.image" :alt="product.name" class="media-img" loading="lazy" />
          </div>
        </button>
      </div>

      <div class="info">
        <div class="title">{{ product.name }}</div>
        <div class="sub">請選擇您喜歡的規格</div>
        <div class="price">NT$ {{ basePrice }}</div>
      </div>
    </div>

    <div class="panel panel-pad" v-else>
      找不到此商品（id：{{ String(route.params.id ?? '') }}）
    </div>

    <div class="layout" v-if="product">
      <div class="panel panel-pad specs">
        <div class="h2">選擇規格和數量</div>

        <template v-for="spec in product.specs" :key="spec.specName">
          <div class="spec-group-title">{{ spec.specName }}</div>

          <div v-for="opt in spec.options" :key="opt.id" class="spec-row" :class="{ active: qty(opt.id) > 0 }">
            <div class="spec-info">
              <div class="spec-name">{{ opt.name }}</div>
              <div class="spec-sub">庫存：{{ opt.stock }} 件</div>
            </div>

            <div class="qty">
              <button class="qty-btn" :disabled="qty(opt.id) <= 0" @click="dec(opt.id)">-</button>
              <span class="qty-num">{{ qty(opt.id) }}</span>
              <button class="qty-btn" :disabled="opt.stock <= 0 || qty(opt.id) >= opt.stock" @click="inc(opt.id, opt.stock)">+</button>
            </div>
          </div>
        </template>
      </div>

      <div class="panel panel-pad summary">
        <div class="h2">價格摘要</div>

        <div class="row">
          <span>總數量</span>
          <b>{{ totalQty }} 件</b>
        </div>

        <div class="sub">各規格庫存獨立計算</div>

        <div class="total">
          總價：<b>NT$ {{ totalPrice }}</b>
        </div>

        <div class="promo" v-if="isPromoProduct">
          <div class="promo-title">多件優惠</div>
          <div class="promo-line">買10送1、買20送2（同商品不同規格累計）</div>

          <div class="promo-line">
            目前可送：<b>{{ giftQty }}</b> 件
            <span v-if="totalQty > 0 && nextGiftNeed > 0">｜再差 {{ nextGiftNeed }} 件可再送</span>
          </div>

          <div class="promo-line" v-if="freeDeductQty > 0">
            本次自動不計價：<b>{{ freeDeductQty }}</b> 件（達優惠門檻）
          </div>

          <div class="promo-line" v-if="totalQty > 0 && totalQty < 10">
            尚未達成優惠門檻（10 件），仍可正常下單。
          </div>
        </div>

        <button class="btn primary" :disabled="cannotCheckout" @click="addToCart">
          加入購物車
        </button>

        <div class="warn" v-if="cannotCheckout">
          請至少選擇 1 件，才能加入購物車
        </div>
      </div>
    </div>
  </div>

  <div v-if="previewUrl" class="preview" @click.self="closePreview">
    <button class="preview-close" type="button" aria-label="關閉" @click="closePreview">×</button>
    <img class="preview-img" :src="previewUrl" alt="商品圖片預覽" />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import HeaderBar from '../components/HeaderBar.vue'
import { PRODUCTS } from '../data/products'
import { useCartStore } from '../store/cart'
import { getPromotionByProductId } from '../data/promotions'

const route = useRoute()
const router = useRouter()
const cart = useCartStore()

const product = computed(() => {
  const id = String(route.params.id ?? '')
  return PRODUCTS.find(p => p.id === id)
})

const basePrice = computed(() => product.value?.price ?? 0)
const isPromoProduct = computed(() => product.value?.id === 'sp2s_pod_bundle')

const qtyMap = reactive<Record<string, number>>({})

function qty(optionId: string) {
  return qtyMap[optionId] ?? 0
}

function inc(optionId: string, stock: number) {
  const cur = qty(optionId)
  if (stock <= 0) return
  if (cur >= stock) return
  qtyMap[optionId] = cur + 1
}

function dec(optionId: string) {
  const cur = qty(optionId)
  if (cur <= 0) return
  const next = cur - 1
  if (next === 0) delete qtyMap[optionId]
  else qtyMap[optionId] = next
}

const totalQty = computed(() => {
  let sum = 0
  for (const k of Object.keys(qtyMap)) sum += qtyMap[k] ?? 0
  return sum
})

/** 買10送1：顯示用 */
const giftQty = computed(() => {
  if (!isPromoProduct.value) return 0
  return Math.floor(totalQty.value / 10)
})

/** 你現有規則：非整10才折抵 */
const freeDeductQty = computed(() => {
  if (!isPromoProduct.value) return 0
  const q = totalQty.value
  if (q < 10) return 0
  if (q % 10 === 0) return 0
  return Math.floor(q / 10)
})

const nextGiftNeed = computed(() => {
  if (!isPromoProduct.value) return 0
  const q = totalQty.value
  if (q <= 0) return 0
  const mod = q % 10
  return mod === 0 ? 10 : 10 - mod
})

/** ✅ 依 promotions.ts 計算「促銷階梯單價」 */
function calcTierUnitPrice(productId: string, selectedQty: number, fallback: number) {
  const promo = getPromotionByProductId(productId)
  if (!promo) return fallback

  const tier = promo.rules.find(r => r.type === 'TIER_PRICING') as any | undefined
  if (!tier) return fallback

  const step = Number(tier.step ?? 0)
  const firstPrice = Number(tier.firstPrice ?? fallback)
  const delta = Number(tier.deltaPerStep ?? 0)
  const minPrice = tier.minPrice !== undefined ? Number(tier.minPrice) : undefined

  if (!step || selectedQty <= 0) return firstPrice

  // 1~step => level 0；step+1~2step => level 1 ...
  const level = Math.floor(Math.max(0, selectedQty - 1) / step)
  let price = firstPrice - level * delta
  if (minPrice !== undefined) price = Math.max(minPrice, price)
  return price
}

const totalPrice = computed(() => {
  if (!product.value) return 0

  const selectedQty = totalQty.value
  if (selectedQty <= 0) return 0

  // ✅ 促銷商品：用「階梯單價」*「應計價數量」
  if (isPromoProduct.value) {
    const unit = calcTierUnitPrice(product.value.id, selectedQty, basePrice.value)
    const payQty = selectedQty - freeDeductQty.value
    return payQty * unit
  }

  // ✅ 一般商品：仍用 basePrice（你目前 spec 沒有 priceDelta，因此先保持）
  return selectedQty * basePrice.value
})

const cannotCheckout = computed(() => {
  if (!product.value) return true
  return totalQty.value === 0
})

function addToCart() {
  if (cannotCheckout.value) return
  if (!product.value) return

  const idToName: Record<string, string> = {}
  for (const spec of product.value.specs) {
    for (const opt of spec.options) {
      idToName[opt.id] = opt.name
    }
  }

  const selectedQty = totalQty.value

  // ✅ 單價：促銷商品走階梯單價；一般商品走 basePrice
  const unit = isPromoProduct.value
    ? calcTierUnitPrice(product.value.id, selectedQty, basePrice.value)
    : basePrice.value

  const lines = Object.keys(qtyMap)
    .map(optionId => ({
      key: optionId,
      name: idToName[optionId] ?? optionId,
      qty: qtyMap[optionId] ?? 0,
      unitPrice: unit
    }))
    .filter(l => l.qty > 0)

  cart.addItem({
    productId: product.value.id,
    productName: product.value.name,
    lines
  })

  router.push('/products')
}

const previewUrl = ref<string | null>(null)
function openPreview(url: string) { previewUrl.value = url }
function closePreview() { previewUrl.value = null }

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closePreview()
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
/* ✅ 你的原樣式保留不動（你貼的那段 그대로） */
.container { width: 100%; max-width: 980px; margin: 0 auto; box-sizing: border-box; }
.product-head { display: flex; gap: 14px; align-items: stretch; }
.media { flex: 0 0 25%; max-width: 25%; display: flex; }
.media-btn { width: 100%; border: 0; background: transparent; padding: 0; cursor: pointer; text-align: left; }
.media-btn:disabled { cursor: default; }
.media-box { width: 100%; aspect-ratio: 1 / 1; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; display: grid; place-items: center; background: #fff; }
.media-empty { font-size: 12px; opacity: 0.75; text-align: center; padding: 10px; }
.media-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.info { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; justify-content: center; }
.title { font-size: 20px; font-weight: 700; line-height: 1.25; word-break: break-word; overflow-wrap: anywhere; }
.sub { margin-top: 6px; opacity: 0.85; line-height: 1.3; word-break: break-word; overflow-wrap: anywhere; }
.price { margin-top: 10px; color: #2563eb; font-size: 22px; font-weight: 700; line-height: 1.1; white-space: nowrap; }
.layout { display: grid; grid-template-columns: 1fr 320px; gap: 20px; margin-top: 16px; }
.spec-group-title { margin-top: 10px; font-weight: 700; opacity: 0.9; }
.spec-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 10px; margin-top: 10px; box-sizing: border-box; }
.spec-row.active { background: #eff6ff; border-color: #2563eb; }
.spec-info { min-width: 0; }
.spec-name { font-weight: 700; line-height: 1.2; word-break: break-word; overflow-wrap: anywhere; }
.spec-sub { margin-top: 4px; opacity: 0.85; line-height: 1.2; word-break: break-word; overflow-wrap: anywhere; }
.qty { display: flex; align-items: center; gap: 10px; flex: 0 0 auto; }
.qty-btn { width: 28px; height: 28px; border-radius: 6px; }
.qty-num { min-width: 18px; text-align: center; font-weight: 700; }
.summary .row { display: flex; justify-content: space-between; gap: 12px; margin-top: 10px; }
.summary .total { margin-top: 16px; font-size: 18px; line-height: 1.2; word-break: break-word; overflow-wrap: anywhere; }
.btn.primary { width: 100%; margin-top: 12px; }
.warn { color: #ef4444; font-size: 13px; margin-top: 10px; line-height: 1.25; word-break: break-word; overflow-wrap: anywhere; }
.promo { margin-top: 14px; padding-top: 12px; border-top: 1px dashed #e5e7eb; }
.promo-title { font-weight: 700; }
.promo-line { margin-top: 6px; opacity: 0.9; line-height: 1.25; }
@media (max-width: 520px) {
  .product-head { flex-direction: column; gap: 10px; }
  .media { flex: 0 0 auto; max-width: 100%; }
  .media-box { aspect-ratio: 16 / 9; }
  .price { white-space: normal; }
  .layout { grid-template-columns: 1fr; }
}
.preview { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); display: grid; place-items: center; padding: 18px; z-index: 9999; }
.preview-img { max-width: 92vw; max-height: 88vh; object-fit: contain; border-radius: 14px; background: #fff; }
.preview-close { position: fixed; top: 12px; right: 12px; width: 44px; height: 44px; border-radius: 999px; border: 0; background: rgba(255, 255, 255, 0.95); cursor: pointer; font-size: 28px; line-height: 1; z-index: 10000; }
</style>
