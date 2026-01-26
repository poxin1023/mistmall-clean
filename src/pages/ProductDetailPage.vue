<!-- src/pages/ProductDetailPage.vue -->
<template>
  <HeaderBar :showBack="true" />

  <div class="container">
    <div class="panel panel-pad product-head" v-if="product">
      <div class="media">
        <!-- ✅ 點封面：一般商品單張放大；meme_7000 走相簿（從第 1 張開始） -->
        <button
          class="media-btn"
          type="button"
          :disabled="!product.image"
          @click="product.image && openPreviewByIndex(0)"
        >
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

  <!-- ✅ 放大預覽：單張 or 相簿（meme_7000） -->
  <div v-if="isPreviewOpen" class="preview" @click.self="closePreview">
    <button class="preview-close" type="button" aria-label="關閉" @click="closePreview">×</button>

    <!-- 左右切換按鈕：只有多張才出現 -->
    <button
      v-if="previewImages.length > 1"
      class="preview-nav prev"
      type="button"
      aria-label="上一張"
      @click.stop="prevImage"
    >
      ‹
    </button>

    <div
      class="preview-stage"
      @touchstart.passive="onTouchStart"
      @touchmove.prevent="onTouchMove"
      @touchend="onTouchEnd"
    >
      <img class="preview-img" :src="previewImages[previewIndex]" alt="商品圖片預覽" />
      <div v-if="previewImages.length > 1" class="preview-counter">
        {{ previewIndex + 1 }} / {{ previewImages.length }}
      </div>
    </div>

    <button
      v-if="previewImages.length > 1"
      class="preview-nav next"
      type="button"
      aria-label="下一張"
      @click.stop="nextImage"
    >
      ›
    </button>
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

  const level = Math.floor(Math.max(0, selectedQty - 1) / step)
  let price = firstPrice - level * delta
  if (minPrice !== undefined) price = Math.max(minPrice, price)
  return price
}

const totalPrice = computed(() => {
  if (!product.value) return 0

  const selectedQty = totalQty.value
  if (selectedQty <= 0) return 0

  if (isPromoProduct.value) {
    const unit = calcTierUnitPrice(product.value.id, selectedQty, basePrice.value)
    const payQty = selectedQty - freeDeductQty.value
    return payQty * unit
  }

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

/* =========================
   ✅ 圖片放大 + 只有 meme_7000 可左右滑相簿
   ========================= */

// 你要做相簿的商品 id（你目前網址是 /product/meme_7000）
const GALLERY_PRODUCT_ID = 'meme_7000'

// meme_7000 的相簿清單（請把檔案放在 public/products/）
const memeGallery = [
  '/products/meme1 (1).jpg',
  '/products/meme1 (2).jpg',
  '/products/meme1 (3).jpg',
  '/products/meme1 (4).jpg',
  '/products/meme1 (5).jpg',
  '/products/meme1 (6).jpg',
  '/products/meme1 (7).jpg',
  '/products/meme1 (8).jpg',
  '/products/meme1 (9).jpg',
  '/products/meme1 (10).jpg',
  '/products/meme1 (11).jpg',
  '/products/meme1 (12).jpg',
  '/products/meme1 (13).jpg',
  '/products/meme1 (14).jpg',
  '/products/meme1 (15).jpg',
  '/products/meme1 (16).jpg',
  '/products/meme1 (17).jpg',
  '/products/meme1 (18).jpg',
  '/products/meme1 (19).jpg',
  '/products/meme1 (20).jpg',
  '/products/meme1 (21).jpg',
  '/products/meme1 (22).jpg',
  '/products/meme1 (23).jpg',
  '/products/meme1 (24).jpg',
  '/products/meme1 (25).jpg'
]

const isPreviewOpen = ref(false)
const previewIndex = ref(0)

// ✅ 預覽圖來源：meme_7000 => 相簿；其他 => 單張（product.image）
const previewImages = computed(() => {
  if (!product.value) return []
  if (product.value.id === GALLERY_PRODUCT_ID) return memeGallery
  return product.value.image ? [product.value.image] : []
})

function openPreviewByIndex(idx: number) {
  if (previewImages.value.length === 0) return
  previewIndex.value = Math.min(Math.max(0, idx), previewImages.value.length - 1)
  isPreviewOpen.value = true
}

function closePreview() {
  isPreviewOpen.value = false
}

function nextImage() {
  const n = previewImages.value.length
  if (n <= 1) return
  previewIndex.value = (previewIndex.value + 1) % n
}

function prevImage() {
  const n = previewImages.value.length
  if (n <= 1) return
  previewIndex.value = (previewIndex.value - 1 + n) % n
}

// 鍵盤：ESC 關閉、左右切換
function onKeydown(e: KeyboardEvent) {
  if (!isPreviewOpen.value) return
  if (e.key === 'Escape') closePreview()
  if (e.key === 'ArrowRight') nextImage()
  if (e.key === 'ArrowLeft') prevImage()
}

// 手勢滑動（手機）
const touchX = ref<number | null>(null)
const touchDelta = ref(0)

function onTouchStart(e: TouchEvent) {
  if (previewImages.value.length <= 1) return
  touchX.value = e.touches[0]?.clientX ?? null
  touchDelta.value = 0
}
function onTouchMove(e: TouchEvent) {
  if (previewImages.value.length <= 1) return
  if (touchX.value === null) return
  const x = e.touches[0]?.clientX ?? 0
  touchDelta.value = x - touchX.value
}
function onTouchEnd() {
  if (previewImages.value.length <= 1) return
  // 門檻：滑動超過 40px 才算翻頁
  if (touchDelta.value > 40) prevImage()
  else if (touchDelta.value < -40) nextImage()
  touchX.value = null
  touchDelta.value = 0
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
/* ✅ 你的原樣式保留 */
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
.qty-btn { width: 48px; height: 48px; border-radius: 12px; font-size: 24px; line-height: 1; display: inline-flex; align-items: center; justify-content: center; }
.qty-num { min-width: 32px; text-align: center; font-weight: 700; font-size: 16px; }
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

/* ✅ 預覽層 */
.preview {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: grid;
  place-items: center;
  padding: 18px;
  z-index: 9999;
}
.preview-stage {
  position: relative;
  max-width: 92vw;
  max-height: 88vh;
  display: grid;
  place-items: center;
}
.preview-img {
  max-width: 92vw;
  max-height: 88vh;
  object-fit: contain;
  border-radius: 14px;
  background: #fff;
}
.preview-close {
  position: fixed;
  top: 12px;
  right: 12px;
  width: 44px;
  height: 44px;
  border-radius: 999px;
  border: 0;
  background: rgba(255, 255, 255, 0.95);
  cursor: pointer;
  font-size: 28px;
  line-height: 1;
  z-index: 10000;
}

/* 左右切換按鈕 */
.preview-nav {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  border-radius: 999px;
  border: 0;
  background: rgba(255, 255, 255, 0.95);
  cursor: pointer;
  font-size: 30px;
  line-height: 1;
  z-index: 10000;
}
.preview-nav.prev { left: 12px; }
.preview-nav.next { right: 12px; }

/* 張數提示 */
.preview-counter {
  position: absolute;
  bottom: -42px;
  left: 50%;
  transform: translateX(-50%);
  color: #fff;
  font-size: 13px;
  opacity: 0.9;
}
</style>
