<!-- src/pages/ProductsPage.vue -->
<template>
  <HeaderBar />

  <div class="container">
    <div class="h1 animated-title">
      <span>{{ typedTitle }}</span>
      <span class="cursor-underscore" :class="{ blinking: titleTypingDone }">_</span>
    </div>
    <div class="sub">請選擇您喜歡的商品，然後選擇口味</div>

    <TagFilterBar
      :keyword="keyword"
      :selected-keys="selectedKeys"
      :shown-count="filtered.length"
      :total-count="all.length"
      @update:keyword="keyword = $event"
      @update:selectedKeys="selectedKeys = $event"
      @clear="clearFilters"
    />

    <!-- 商品卡片列表 -->
    <div class="grid">
      <ProductCard v-for="p in filtered" :key="p.id" :product="p" />
    </div>

    <!-- ✅ 改位置：購物須知（放在商品卡片最下方） -->
    <div class="notice-box">
      <div class="notice-title">
        <span class="notice-warn">⚠️</span>
        <span>購物須知</span>
        <span class="notice-sub">（取貨缺少品項請拆封錄影， 請客服）</span>
      </div>

      <div class="notice-list">
        <div class="notice-item">
          <div class="notice-icon">📦</div>
          <div class="notice-text">
            <div class="notice-h">取件付款機制</div>
            <div class="notice-p">下單取件機制採超商先取件後付款， 配送時效 1-3 日</div>
          </div>
        </div>

        <div class="notice-item">
          <div class="notice-icon">⏰</div>
          <div class="notice-text">
            <div class="notice-h">訂單修改規則</div>
            <div class="notice-p">訂購成功逾 30 分鐘後即無法修改及取消訂單， 請勿棄單或惡作劇下單（避免浪費彼此時間）</div>
          </div>
        </div>

        <div class="notice-item">
          <div class="notice-icon">🔎</div>
          <div class="notice-text">
            <div class="notice-h">配送查詢</div>
            <div class="notice-p">配送狀態可至網站自行查詢， 如有購買相關問題請加飛機詢問人工客服</div>
          </div>
        </div>

        <div class="notice-item">
          <div class="notice-icon">🔄</div>
          <div class="notice-text">
            <div class="notice-h">口味缺貨處理</div>
            <div class="notice-p">使用多盒下單優惠時如發生口味缺貨， 則以已選擇的口味混補</div>
          </div>
        </div>

        <div class="notice-item">
          <div class="notice-icon">📞</div>
          <div class="notice-text">
            <div class="notice-h">售後服務</div>
            <div class="notice-p">售後相關問題請於取件後 24 小時內反應， 為售後認定標準。 如有其他相關問題請加飛機詢問人工客服！</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <FloatingLineButton />

  <!-- ✅ Toast：必須放在 template 裡，不能放在 </style> 後 -->
  <ToastBar :show="toastShow" :message="toastMsg" />
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import HeaderBar from '../components/HeaderBar.vue'
import TagFilterBar from '../components/TagFilterBar.vue'
import ProductCard from '../components/ProductCard.vue'
import FloatingLineButton from '../components/FloatingLineButton.vue'
import ToastBar from '../components/ToastBar.vue'
import { PRODUCTS } from '../data/products'
import type { TagKey } from '../data/tags'

const all = PRODUCTS

const keyword = ref('')
const selectedKeys = ref<TagKey[]>([])
const typedTitle = ref('')
const titleTypingDone = ref(false)

let titleTimer: number | null = null
const replayTitleHandler = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
  startTitleTypewriter()
}

const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  const keys = selectedKeys.value

  return all.filter(p => {
    const productTags = p.tags ?? [p.tag]
    const matchTag = keys.length ? keys.some(k => productTags.includes(k)) : true
    const matchKw = kw ? p.name.toLowerCase().includes(kw) : true
    return matchTag && matchKw
  })
})

function clearFilters() {
  keyword.value = ''
  selectedKeys.value = []
}

/** ✅ Toast（由商品詳情頁用 sessionStorage 傳回來） */
const toastShow = ref(false)
const toastMsg = ref('')

function showToast(msg: string) {
  toastMsg.value = msg
  toastShow.value = true
  window.setTimeout(() => {
    toastShow.value = false
  }, 2000)
}

onMounted(() => {
  startTitleTypewriter()
  window.addEventListener('products:title-replay', replayTitleHandler)

  const msg = sessionStorage.getItem('toast_once')
  if (msg) {
    sessionStorage.removeItem('toast_once')
    showToast(msg)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('products:title-replay', replayTitleHandler)
  if (titleTimer !== null) {
    window.clearInterval(titleTimer)
    titleTimer = null
  }
})

function startTitleTypewriter() {
  const text = '精選商品'
  typedTitle.value = ''
  titleTypingDone.value = false

  let index = 0
  if (titleTimer !== null) {
    window.clearInterval(titleTimer)
  }

  titleTimer = window.setInterval(() => {
    index += 1
    typedTitle.value = text.slice(0, index)

    if (index >= text.length) {
      if (titleTimer !== null) {
        window.clearInterval(titleTimer)
        titleTimer = null
      }
      titleTypingDone.value = true
    }
  }, 140)
}
</script>

<style scoped>
.animated-title{
  display: inline-flex;
  align-items: baseline;
  min-height: 1.2em;
}

.animated-title > span:first-child{
  font-size: 105%;
  font-weight: 900;
  background: linear-gradient(90deg, #2563eb, #7c3aed, #db2777, #2563eb);
  background-size: 220% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: title-flow 4s linear infinite;
}

.cursor-underscore{
  margin-left: 1px;
  color: #7c3aed;
  opacity: 1;
}

.cursor-underscore.blinking{
  animation: cursor-blink .9s steps(1, end) infinite;
}

@keyframes cursor-blink{
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}

@keyframes title-flow{
  0% { background-position: 0% 50%; }
  100% { background-position: 220% 50%; }
}

.notice-box{
  margin-top: 14px;
  margin-bottom: 90px; /* ✅ 底部留空避免被 FloatingLineButton 遮住 */
  padding: 14px 14px;
  border-radius: 14px;
  background: #fff7db;
  border: 1px solid #f2d48a;
  box-shadow: 0 10px 22px rgba(0,0,0,.06);
}

.notice-title{
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-weight: 900;
  color: #111827;
  margin-bottom: 12px;
}

.notice-warn{
  font-size: 16px;
  line-height: 1;
}

.notice-sub{
  font-weight: 700;
  color: #d97706;
  font-size: 12.5px;
}

.notice-list{
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notice-item{
  display: grid;
  grid-template-columns: 28px 1fr;
  gap: 10px;
  align-items: start;
}

.notice-icon{
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  font-size: 18px;
  line-height: 1;
}

.notice-h{
  font-weight: 900;
  color: #111827;
  margin-bottom: 4px;
}

.notice-p{
  color: #374151;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
}
</style>
