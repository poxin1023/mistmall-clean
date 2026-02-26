<template>
    <div class="card" @click="goDetail">
      <div class="card-img">
        <span v-if="!product.image">商品圖片（待補）</span>
        <img
          v-else
          :src="product.image"
          alt=""
          :style="{ width: '100%', height: '100%', objectFit: product.imageFit ?? 'cover' }"
        />
      </div>
  
      <div class="card-body">
        <div class="card-title">{{ product.name }}</div>
  
        <div class="card-meta">
          <!-- 價格：在原 50% 基礎上放大 30% → 65% -->
          <div class="price-wrap">
            <div class="sold">已售出 {{ displaySoldCount }}</div>
            <div class="price">
              <span v-if="product.price !== null">NT$ {{ product.price }}</span>
              <span v-else>NT$（待補）</span>
            </div>
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

  const displaySoldCount = computed(() => {
    const current = props.product.sold_count
    return typeof current === 'number' && current > 0 ? current : 1
  })
  
  function goDetail() {
    router.push(`/product/${props.product.id}`)
  }
  </script>
  
  <style scoped>
  .card-body {
    font-size: 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .card-title {
    font-size: 1.03em;
    line-height: 1.32;
    font-weight: 700;
    margin: 0;
    min-height: calc(1.32em * 2);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .card-meta {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: nowrap;
  }

  .price-wrap {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    min-width: 0;
  }

  .sold {
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 2px;
    line-height: 1;
    font-weight: 600;
    display: block;
  }
  
  .price {
    flex: 1;
    min-width: 0;
    font-size: 1.18em;
    line-height: 1;
    font-weight: 800;
    color: #2563eb;
    letter-spacing: 0.2px;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  .pill {
    font-size: 0.74em;
    line-height: 1;
    font-weight: 600;
    padding: 0.45em 0.82em;
    border: 1px solid;
    border-radius: 999px;
    background: #fff;
    white-space: nowrap;
    flex-shrink: 0;
  }

  @media (max-width: 520px) {
    .card-body {
      font-size: 13.5px;
      gap: 7px;
    }

    .card-title {
      font-size: 1.02em;
      line-height: 1.3;
      min-height: calc(1.3em * 2);
    }

    .price {
      font-size: 1.16em;
      line-height: 1;
      font-weight: 800;
    }

    .pill {
      font-size: 0.72em;
      line-height: 1;
      padding: 0.42em 0.78em;
      border-width: 1px;
    }
  }
  </style>
  