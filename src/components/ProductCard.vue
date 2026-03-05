<template>
  <div class="card" @click="goDetail">
    <div class="card-img">
      <span v-if="!product.image">商品圖片（待補）</span>
      <img
        v-else
        :src="product.image"
        alt=""
        style="width: 100%; height: 100%; object-fit: cover;"
      />
    </div>

    <div class="card-body">
      <div class="card-title">{{ product.name }}</div>

      <div class="card-meta">
        <div class="meta-left">
          <div class="sold">已售出 {{ soldCountText }} 件</div>
          <!-- ✅ 價格：NT$ + 數字 永遠同一行 -->
          <div class="price">
            <template v-if="product.price !== null">
              <span class="nt">NT$</span>
              <span class="price-num">{{ product.price }}</span>
            </template>
            <span v-else class="price-num">NT$（待補）</span>
          </div>
        </div>

        <!-- 標籤 pill -->
        <div class="pill" :style="pillStyle">
          {{ tagLabel }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { TAGS } from '../data/tags'
import type { Product } from '../data/products'

const props = defineProps<{ product: Product }>()

const router = useRouter()

const tagLabel = computed(() => {
  return TAGS.find(t => t.key === props.product.tag)?.label ?? props.product.tag
})

/* pill 顏色與 TagFilterBar 的 dot 完全同步 */
const pillStyle = computed(() => {
  const color = TAGS.find(t => t.key === props.product.tag)?.color ?? '#64748b'
  return {
    borderColor: color,
    color: color
  }
})

const soldCountText = computed(() => {
  const n = Number(props.product.sold_count ?? 0)
  if (!Number.isFinite(n) || n <= 0) return 0
  return Math.floor(n)
})

function goDetail() {
  router.push(`/product/${props.product.id}`)
}
</script>

<style scoped>
/* 基準字級（桌機 / 手機同步） */
.card-body {
  font-size: 14px;
}

/* 商品名稱 */
.card-title {
  font-size: 1em;
  line-height: 1.35;
  font-weight: 600;
  min-height: 2.7em;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ✅ 價格容器：不換行 + baseline 對齊 */
.price {
  display: flex;
  align-items: baseline;
  gap: 4px;

  font-size: 1rem;
  line-height: 1.2;
  font-weight: 800;
  color: #2563eb;

  white-space: nowrap; /* ✅ 關鍵：永遠不換行 */
}

/* NT$ 比數字小一點，符合商業 UI */
.nt {
  font-size: 0.78em;
  font-weight: 700;
}

/* 數字本體 */
.price-num {
  font-size: 1.1em;
  letter-spacing: 0.2px;
}

/* 卡片下方排版 */
.card-meta {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 6px;
  margin-top: 8px;
  min-width: 0;
}

.meta-left {
  min-width: 0;
  padding-right: 6px;
}

.sold {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.2;
  margin-bottom: 3px;
  white-space: nowrap;
}

/* pill：與價格同步放大 */
.pill {
  font-size: 0.8rem;
  line-height: 1;
  font-weight: 600;

  padding: 0.36em 0.76em;
  border: 1px solid;
  border-radius: 999px;
  background: transparent;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  max-width: 56%;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-left: auto;
  margin-right: 0;
  flex: 0 0 auto;
  transform: translateX(8px);
}
</style>
