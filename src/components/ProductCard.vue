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
          <!-- 價格：在原 50% 基礎上放大 30% → 65% -->
          <div class="price">
            <span v-if="product.price !== null">NT$ {{ product.price }}</span>
            <span v-else>NT$（待補）</span>
          </div>
  
          <!-- 標籤：與上方標籤同色，字體同步放大 30% -->
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
  
  .card-title {
    font-size: 1em;
    line-height: 1.25;
    font-weight: 600;
  }
  
  /* 價格：0.5em × 1.3 = 0.65em */
  .price {
    font-size: 0.65em;
    line-height: 1.2;
    font-weight: 600;
  }
  
  /* 卡片下方排版穩定 */
  .card-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  
  /* pill：字體同步放大 30% */
  .pill {
    font-size: 0.65em;
    line-height: 1.2;
    font-weight: 600;
  
    padding: 0.4em 0.9em;
    border: 1px solid;
    border-radius: 999px;
    background: transparent;
  
    white-space: nowrap;
  }
  </style>
  