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
  return {
    '--tag-color': color,
    '--tag-bg': hexToRgba(color, 0.2),
    '--tag-border': hexToRgba(color, 0.45),
    '--tag-shadow': hexToRgba(color, 0.24)
  }
}

function hexToRgba(color: string, alpha: number) {
  const hex = color.replace('#', '').trim()
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return `rgba(148, 163, 184, ${alpha})`
  const r = Number.parseInt(hex.slice(0, 2), 16)
  const g = Number.parseInt(hex.slice(2, 4), 16)
  const b = Number.parseInt(hex.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
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

.tags-row {
  row-gap: 10px;
}

.tag {
  min-height: 32px;
  padding: 6px 10px;
  font-size: 13px;
  line-height: 1;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
}

.tag.active {
  padding: 5px 9px;
  color: var(--tag-color, #334155);
  border-color: var(--tag-border, rgba(148, 163, 184, 0.45));
  background:
    linear-gradient(140deg, rgba(255, 255, 255, 0.62), rgba(255, 255, 255, 0.18)),
    var(--tag-bg, rgba(148, 163, 184, 0.2));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.55),
    0 2px 8px var(--tag-shadow, rgba(148, 163, 184, 0.24));
  backdrop-filter: blur(7px) saturate(130%);
  -webkit-backdrop-filter: blur(7px) saturate(130%);
}

.tag .dot {
  width: 9px;
  height: 9px;
}

.tag.active .dot {
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.72);
}

.tag .x {
  font-size: 14px;
  line-height: 1;
  margin-left: 2px;
}
</style>
