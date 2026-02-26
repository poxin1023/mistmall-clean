<!-- src/pages/ProductDetailPage.vue -->
<template>
  <HeaderBar :showBack="true" />

  <div class="container">
    <div class="panel panel-pad product-head" v-if="product">
      <div class="media">
        <div class="media-carousel">
          <button class="media-btn" type="button" :disabled="!currentImage" @click="openCurrentImagePreview">
            <div class="media-box">
              <span v-if="!currentImage" class="media-empty">商品圖片（待補）</span>
              <img v-else :src="currentImage" :alt="product.name" class="media-img" loading="lazy" />
            </div>
          </button>
        </div>
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
          <div class="promo-head">
            <div class="promo-title">多件優惠｜買 10 送 1</div>
            <span class="promo-pill">同商品不同規格可累計</span>
          </div>

          <div class="promo-line promo-rule">
            每滿 11 件，只需付 10 件（22 件付 20、33 件付 30，以此類推）
          </div>

          <div class="promo-metrics">
            <div class="promo-metric">
              <span class="promo-k">本次可送</span>
              <b>{{ giftQty }}</b>
              <span class="promo-u">件</span>
            </div>
            <div class="promo-metric" v-if="freeDeductQty > 0">
              <span class="promo-k">現省</span>
              <b>NT$ {{ promoSavedAmount }}</b>
            </div>
          </div>

          <div class="promo-line promo-success" v-if="freeDeductQty > 0">
            已自動折抵 <b>{{ freeDeductQty }}</b> 件金額（本次計價 <b>{{ payableQty }}</b> 件）
          </div>

          <div class="promo-line promo-cta" v-if="totalQty > 0 && nextGiftNeed > 0">
            再加 <b>{{ nextGiftNeed }}</b> 件，立刻多送 <b>1</b> 件（下個門檻 {{ nextGiftTarget }} 件）
          </div>

          <div class="promo-line promo-hint" v-if="totalQty === 0">
            先選 1 件開始湊單，滿 11 件就自動送 1 件。
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

  <div
    v-if="isPreviewOpen"
    class="preview"
    @click.self="closePreview"
    @touchstart.passive="onPreviewTouchStart"
    @touchend.passive="onPreviewTouchEnd"
  >
    <div class="preview-frame">
      <button class="preview-close" type="button" aria-label="關閉預覽" @click="closePreview">×</button>
      <img class="preview-img" :src="previewCurrentImage" alt="商品圖片預覽" />
    </div>
    <button
      v-if="canNavigateImages"
      class="preview-nav prev"
      type="button"
      aria-label="上一張預覽圖片"
      @click.stop="prevPreviewImage"
    >
      ‹
    </button>
    <button
      v-if="canNavigateImages"
      class="preview-nav next"
      type="button"
      aria-label="下一張預覽圖片"
      @click.stop="nextPreviewImage"
    >
      ›
    </button>
    <div v-if="canNavigateImages" class="preview-dots">
      <button
        v-for="(img, idx) in galleryImages"
        :key="`preview_${img}_${idx}`"
        class="preview-dot"
        :class="{ active: idx === previewImageIndex }"
        type="button"
        :aria-label="`預覽第 ${idx + 1} 張`"
        @click.stop="goToPreviewImage(idx)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import HeaderBar from '../components/HeaderBar.vue'
import { PRODUCTS } from '../data/products'
import { useCartStore } from '../store/cart'

const route = useRoute()
const router = useRouter()
const cart = useCartStore()

const product = computed(() => {
  const id = String(route.params.id ?? '')
  return PRODUCTS.find(p => p.id === id)
})

const galleryImages = computed(() => {
  if (!product.value) return [] as string[]
  const fromArray = (product.value.images ?? []).filter(Boolean)
  if (fromArray.length > 0) return fromArray
  if (product.value.image) return [product.value.image]
  return [] as string[]
})

const currentImage = computed(() => {
  if (galleryImages.value.length === 0) return ''
  return galleryImages.value[0] ?? ''
})

const canNavigateImages = computed(() => galleryImages.value.length > 1)

function wrapImageIndex(index: number) {
  const len = galleryImages.value.length
  if (len <= 0) return 0
  return (index + len) % len
}

const SWIPE_THRESHOLD_PX = 36

const basePrice = computed(() => product.value?.price ?? 0)
const isPromoProduct = computed(() => product.value?.id === 'sp2s_pod_bundle')
const PROMO_STEP = 11

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

/** 每滿 11 件折 1 件：顯示用 */
const giftQty = computed(() => {
  if (!isPromoProduct.value) return 0
  return Math.floor(totalQty.value / PROMO_STEP)
})

/** 每滿 11 件折 1 件（11 件收 10 件） */
const freeDeductQty = computed(() => {
  if (!isPromoProduct.value) return 0
  const q = totalQty.value
  if (q <= 0) return 0
  return Math.floor(q / PROMO_STEP)
})

const payableQty = computed(() => {
  if (!isPromoProduct.value) return totalQty.value
  return Math.max(totalQty.value - freeDeductQty.value, 0)
})

const promoSavedAmount = computed(() => {
  if (!isPromoProduct.value) return 0
  return freeDeductQty.value * basePrice.value
})

const nextGiftNeed = computed(() => {
  if (!isPromoProduct.value) return 0
  const q = totalQty.value
  if (q <= 0) return PROMO_STEP
  const mod = q % PROMO_STEP
  return mod === 0 ? PROMO_STEP : PROMO_STEP - mod
})

const nextGiftTarget = computed(() => {
  if (!isPromoProduct.value) return 0
  return totalQty.value + nextGiftNeed.value
})

const totalPrice = computed(() => {
  if (!product.value) return 0

  const selectedQty = totalQty.value
  if (selectedQty <= 0) return 0

  // ✅ 促銷商品：每滿 11 件折 1 件，單價維持 basePrice
  if (isPromoProduct.value) {
    const unit = basePrice.value
    return payableQty.value * unit
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

  // ✅ 單價維持商品原價，折抵由每 11 件折 1 件規則處理
  const unit = basePrice.value

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

const isPreviewOpen = ref(false)
const previewImageIndex = ref(0)
const previewCurrentImage = computed(() => {
  if (galleryImages.value.length === 0) return ''
  return galleryImages.value[previewImageIndex.value] ?? galleryImages.value[0] ?? ''
})

function openPreview(index: number) {
  if (galleryImages.value.length <= 0) return
  previewImageIndex.value = wrapImageIndex(index)
  isPreviewOpen.value = true
}

function openCurrentImagePreview() {
  openPreview(0)
}
function closePreview() { isPreviewOpen.value = false }

function goToPreviewImage(index: number) {
  if (galleryImages.value.length <= 0) return
  previewImageIndex.value = wrapImageIndex(index)
}

function prevPreviewImage() {
  goToPreviewImage(previewImageIndex.value - 1)
}

function nextPreviewImage() {
  goToPreviewImage(previewImageIndex.value + 1)
}

const previewTouchStartX = ref<number | null>(null)
const previewTouchStartY = ref<number | null>(null)

function onPreviewTouchStart(e: TouchEvent) {
  const t = e.touches[0]
  if (!t) return
  previewTouchStartX.value = t.clientX
  previewTouchStartY.value = t.clientY
}

function onPreviewTouchEnd(e: TouchEvent) {
  if (!canNavigateImages.value) return
  const t = e.changedTouches[0]
  if (!t || previewTouchStartX.value === null || previewTouchStartY.value === null) return

  const dx = t.clientX - previewTouchStartX.value
  const dy = t.clientY - previewTouchStartY.value
  previewTouchStartX.value = null
  previewTouchStartY.value = null

  if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return
  if (Math.abs(dx) <= Math.abs(dy)) return

  if (dx < 0) nextPreviewImage()
  else prevPreviewImage()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isPreviewOpen.value) {
    closePreview()
    return
  }
  if (!isPreviewOpen.value) return
  if (e.key === 'ArrowLeft') prevPreviewImage()
  if (e.key === 'ArrowRight') nextPreviewImage()
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
/* ✅ 你的原樣式保留不動（你貼的那段 그대로） */
.container { width: 100%; max-width: 980px; margin: 0 auto; box-sizing: border-box; }
.product-head { display: flex; gap: 14px; align-items: stretch; }
.media { flex: 0 0 25%; max-width: 25%; display: flex; }
.media-carousel { position: relative; width: 100%; }
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
.h2 { font-size: 17px; font-weight: 800; line-height: 1.25; margin-bottom: 6px; }
.spec-group-title { margin-top: 12px; font-weight: 700; opacity: 0.9; font-size: 14px; }
.spec-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 13px 12px; border: 1px solid #e5e7eb; border-radius: 12px; margin-top: 10px; box-sizing: border-box; background: #fff; }
.spec-row.active { background: #eff6ff; border-color: #2563eb; }
.spec-info { min-width: 0; }
.spec-name { font-weight: 700; line-height: 1.25; font-size: 15px; word-break: break-word; overflow-wrap: anywhere; }
.spec-sub { margin-top: 4px; opacity: 0.85; line-height: 1.2; font-size: 13px; word-break: break-word; overflow-wrap: anywhere; }
.qty { display: flex; align-items: center; gap: 8px; flex: 0 0 auto; }
.qty-btn { width: 40px; height: 40px; border-radius: 10px; border: 1px solid #d1d5db; background: #fff; font-size: 19px; line-height: 1; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; padding: 0; touch-action: manipulation; }
.qty-btn:disabled { opacity: 0.5; }
.qty-num { min-width: 24px; text-align: center; font-weight: 700; font-size: 17px; line-height: 1; }
.summary .row { display: flex; justify-content: space-between; gap: 12px; margin-top: 10px; }
.summary .total { margin-top: 16px; font-size: 18px; line-height: 1.2; word-break: break-word; overflow-wrap: anywhere; }
.btn.primary { width: 100%; margin-top: 12px; min-height: 46px; font-size: 16px; font-weight: 700; border-radius: 12px; touch-action: manipulation; }
.warn { color: #ef4444; font-size: 13px; margin-top: 10px; line-height: 1.25; word-break: break-word; overflow-wrap: anywhere; }
.promo {
  margin-top: 14px;
  padding: 12px;
  border: 1px solid #bfdbfe;
  border-radius: 12px;
  background: linear-gradient(180deg, #f8fbff 0%, #eff6ff 100%);
}
.promo-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.promo-title { font-weight: 900; color: #1d4ed8; }
.promo-pill {
  flex: 0 0 auto;
  font-size: 12px;
  font-weight: 800;
  color: #4c1d95;
  background: #ede9fe;
  border: 1px solid #ddd6fe;
  border-radius: 999px;
  padding: 3px 8px;
}
.promo-line { margin-top: 8px; line-height: 1.3; color: #1f2937; }
.promo-rule { font-weight: 700; color: #0f172a; }
.promo-metrics { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
.promo-metric {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  background: #ffffff;
  border: 1px solid #dbeafe;
  border-radius: 10px;
  padding: 6px 10px;
}
.promo-k { font-size: 12px; color: #475569; font-weight: 700; }
.promo-u { font-size: 12px; color: #475569; }
.promo-metric b { color: #dc2626; font-size: 16px; line-height: 1; }
.promo-success {
  color: #166534;
  background: #ecfdf5;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  padding: 8px 10px;
}
.promo-cta {
  color: #b45309;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 10px;
  padding: 8px 10px;
  font-weight: 700;
}
.promo-hint {
  color: #1e3a8a;
  background: #dbeafe;
  border: 1px dashed #93c5fd;
  border-radius: 10px;
  padding: 8px 10px;
}

:deep(.topbar .btn) {
  min-height: 40px;
  padding: 8px 12px;
}

@media (max-width: 520px) {
  .container { padding-left: 10px; padding-right: 10px; }
  .product-head { flex-direction: column; gap: 10px; }
  .media { flex: 0 0 auto; max-width: 100%; }
  .media-carousel,
  .media-btn { display: block; }
  .media-box { aspect-ratio: 4 / 3; }
  .info {
    flex: 0 0 auto;
    justify-content: flex-start;
    margin-top: 4px;
  }
  .panel-pad { padding: 12px; }
  .title { font-size: 22px; line-height: 1.28; }
  .sub { font-size: 13px; }
  .price { white-space: normal; font-size: 28px; margin-top: 8px; }
  .layout { grid-template-columns: 1fr; gap: 12px; }
  .h2 { font-size: 17px; margin-bottom: 8px; }
  .spec-group-title { margin-top: 10px; font-size: 14px; }
  .spec-row { padding: 12px 10px; border-radius: 11px; }
  .spec-name { font-size: 15px; }
  .spec-sub { font-size: 13px; }
  .qty { gap: 7px; }
  .qty-btn { width: 42px; height: 42px; border-radius: 11px; font-size: 20px; }
  .qty-num { min-width: 24px; font-size: 18px; }
  .summary .row { font-size: 14px; }
  .summary .total { font-size: 20px; margin-top: 14px; }
  .btn.primary { min-height: 48px; font-size: 16px; }
  .promo-line { font-size: 13px; line-height: 1.3; }
  .warn { font-size: 13px; line-height: 1.3; }

  :deep(.topbar-inner) { padding: 10px; }
  :deep(.topbar .btn) {
    min-height: 42px;
    font-size: 14px;
    padding: 8px 11px;
    border-radius: 10px;
  }
}
.preview { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); display: grid; place-items: center; padding: 18px; z-index: 9999; }
.preview-frame { position: relative; max-width: 94vw; max-height: 84vh; display: grid; place-items: center; }
.preview-img { max-width: 94vw; max-height: 84vh; object-fit: contain; border-radius: 14px; background: #fff; display: block; }
.preview-close {
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
  cursor: pointer;
  font-size: 24px;
  line-height: 1;
  z-index: 10001;
}
.preview-nav {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: 0;
  background: rgba(255, 255, 255, 0.92);
  color: #0f172a;
  font-size: 28px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10000;
}
.preview-nav.prev { left: 12px; }
.preview-nav.next { right: 12px; }
.preview-dots {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  max-width: calc(100vw - 40px);
  display: flex;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.45);
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.preview-dots::-webkit-scrollbar {
  display: none;
}
.preview-dot {
  width: 8px;
  height: 8px;
  border: 0;
  border-radius: 999px;
  padding: 0;
  background: rgba(255, 255, 255, 0.55);
  cursor: pointer;
  flex: 0 0 auto;
}
.preview-dot.active {
  width: 18px;
  background: #fff;
}
</style>
