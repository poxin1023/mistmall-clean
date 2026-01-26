<!-- src/pages/ProductsPage.vue -->
<template>
  <HeaderBar />

  <div class="container">
    <!-- ✅ 只在這裡把「精選商品」改成打字機顯示（結構不變：仍然是 .h1 這一塊） -->
    <div class="h1 type-title" aria-label="精選商品">
      <span class="type-text">{{ typedTitle }}</span><span class="type-caret" aria-hidden="true"></span>
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
import { computed, ref, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
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

const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  const keys = selectedKeys.value

  return all.filter(p => {
    const matchTag = keys.length ? keys.includes(p.tag) : true
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

/* =========================
   ✅ 打字機效果（只影響標題）
   - 首次進入 products：播放
   - 每次跳回 products：重播
   - 離開頁面：清 timer
========================= */
const route = useRoute()
const fullTitle = '精選商品'
const typedTitle = ref('')

let typingTimer: number | null = null

function startTyping() {
  if (typingTimer !== null) {
    window.clearInterval(typingTimer)
    typingTimer = null
  }

  typedTitle.value = ''
  let i = 0

  typingTimer = window.setInterval(() => {
    typedTitle.value = fullTitle.slice(0, i + 1)
    i++
    if (i >= fullTitle.length) {
      if (typingTimer !== null) window.clearInterval(typingTimer)
      typingTimer = null
    }
  }, 120) // ✅ 速度：80 更快、150 更慢
}

onMounted(() => {
  // 你原本的 toast 邏輯
  const msg = sessionStorage.getItem('toast_once')
  if (msg) {
    sessionStorage.removeItem('toast_once')
    showToast(msg)
  }

  // ✅ 首次進入本頁播放
  startTyping()
})

// ✅ 每次路由切回 /products 都重播
watch(
  () => route.fullPath,
  (to) => {
    if (to.startsWith('/products')) startTyping()
  }
)

onBeforeUnmount(() => {
  if (typingTimer !== null) window.clearInterval(typingTimer)
})
</script>

<style scoped>
/* ✅ 打字機：只加新 class，不動你原本 h1 的樣式結構 */
.type-title{
  display: inline-flex;
  align-items: baseline;
}
.type-text{
  white-space: nowrap;
}
.type-caret{
  width: 0.55em;
  margin-left: 2px;
  border-bottom: 2px solid currentColor;
  transform: translateY(-1px);
  animation: caretBlink 0.9s step-end infinite;
}
@keyframes caretBlink{
  50% { opacity: 0; }
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
