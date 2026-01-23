<template>
  <div class="panel panel-pad">
    <div class="search-row">
      <input
        class="search"
        type="text"
        placeholder="搜尋商品名稱..."
        :value="keyword"
        @input="onKeywordInput"
      />
      <button class="btn" @click="clearAll" v-if="selectedKeys.length || keyword">
        清除篩選
      </button>
    </div>

    <!-- 新增：搜尋框下方文字 -->
    <div class="filter-hint">商品標籤篩選</div>

    <!-- 新增：標籤列上方「品牌」 -->
    <div class="brand-label">品牌</div>

    <div class="tags-row">
      <div
        v-for="t in tags"
        :key="t.key"
        class="tag"
        :class="{ active: isActive(t.key) }"
        :style="isActive(t.key) ? activeStyle(t.color) : undefined"
        @click="toggle(t.key)"
      >
        <span class="dot" :style="{ background: t.color }"></span>
        <span>{{ t.label }}</span>
        <span v-if="isActive(t.key)" class="x">×</span>
      </div>
    </div>

    <div class="sub" style="margin-top: 10px;">
      顯示 {{ shownCount }} / {{ totalCount }} 件商品
      <span v-if="selectedKeys.length">・已選標籤：{{ selectedKeys.length }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { TAGS, type TagKey } from '../data/tags'

const props = defineProps<{
  keyword: string
  selectedKeys: TagKey[]
  shownCount: number
  totalCount: number
}>()

const emit = defineEmits<{
  (e: 'update:keyword', value: string): void
  (e: 'update:selectedKeys', value: TagKey[]): void
  (e: 'clear'): void
}>()

const tags = TAGS

function isActive(key: TagKey) {
  return props.selectedKeys.includes(key)
}

function toggle(key: TagKey) {
  const next = isActive(key)
    ? props.selectedKeys.filter(k => k !== key)
    : [...props.selectedKeys, key]

  emit('update:selectedKeys', next)
}

function onKeywordInput(e: Event) {
  emit('update:keyword', (e.target as HTMLInputElement).value)
}

function clearAll() {
  emit('clear')
}

function activeStyle(color: string) {
  // 背景填色（接近圖示風格），文字變白
  return { background: color, color: '#fff' }
}
</script>

<style scoped>
/* 只做「兩行文字」的排版，不改你原本篩選功能 */
.filter-hint {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.2;
  font-weight: 600;
  opacity: 0.85;
}

.brand-label {
  margin-top: 8px;
  margin-bottom: 6px;
  font-size: 13px;
  line-height: 1.2;
  font-weight: 600;
  opacity: 0.85;
}
</style>
