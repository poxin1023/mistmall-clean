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
        <!-- ✅ 價格：NT$ + 數字 永遠同一行 -->
        <div class="price">
          <template v-if="product.price !== null">
            <span class="nt">NT$</span>
            <span class="price-num">{{ product.price }}</span>
          </template>
          <span v-else class="price-num">NT$（待補）</span>
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
  line-height: 1.25;
  font-weight: 600;
}

/* ✅ 價格容器：不換行 + baseline 對齊 */
.price {
  display: flex;
  align-items: baseline;
  gap: 4px;

  font-size: calc(0.65em * 1.3); /* 原本設定保留 */
  line-height: 1.2;
  font-weight: 600;

  white-space: nowrap; /* ✅ 關鍵：永遠不換行 */
}

/* NT$ 比數字小一點，符合商業 UI */
.nt {
  font-size: 0.85em;
}

/* 數字本體 */
.price-num {
  font-size: 1em;
}

/* 卡片下方排版 */
.card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

/* pill：與價格同步放大 */
.pill {
  font-size: calc(0.65em * 1.3);
  line-height: 1.2;
  font-weight: 600;

  padding: 0.4em 0.9em;
  border: 1px solid;
  border-radius: 999px;
  background: transparent;
  white-space: nowrap;
}
</style>
