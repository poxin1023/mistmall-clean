<!-- src/components/HeaderBar.vue -->
<template>
  <div class="topbar">
    <div class="topbar-inner">
      <div class="left">
        <button
          v-if="showBack"
          class="back-btn"
          type="button"
          aria-label="返回"
          @click="goBackToProducts"
        >
          ←
        </button>

        <div class="brand" @click="goProducts">MEME</div>
      </div>

      <div class="actions">
        <button class="btn" type="button" @click="goNotice">公告</button>
        <button class="btn" type="button" @click="goOrders">查詢訂單</button>

        <button class="btn" type="button" @click.stop="openCart">
          購物車
          <span v-if="cartCount > 0" class="badge">{{ cartCount }}</span>
        </button>
      </div>
    </div>

    <Teleport to="body">
      <CartDrawer :open="cartOpen" @close="cartOpen = false" />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../store/cart'
import CartDrawer from './CartDrawer.vue'

defineProps<{
  showBack?: boolean
}>()

const router = useRouter()
const cart = useCartStore()
const cartOpen = ref(false)

// ✅ 保底同步：直接用 state 計算「實際選購件數」（不含贈品）
// 同時支援：如果你 store 內有 totalSelectedQty / totalDisplayQty 也能 fallback
const cartCount = computed(() => {
  // 1) 優先用你新增的 getter（若存在）
  const anyCart = cart as any
  if (typeof anyCart.totalSelectedQty === 'number') return anyCart.totalSelectedQty

  // 2) 保底：由 items.lines.qty 加總（不含贈品，與抽屜明細一致）
  const items = anyCart.items as Array<{ lines?: Array<{ qty?: number }> }> | undefined
  const selected = (items ?? []).reduce((acc, it) => {
    const lines = it.lines ?? []
    const q = lines.reduce((s, l) => s + (Number(l.qty) || 0), 0)
    return acc + q
  }, 0)
  if (selected > 0) return selected

  // 3) 最後才用 displayQty（含贈品）
  if (typeof anyCart.totalDisplayQty === 'number') return anyCart.totalDisplayQty

  return 0
})

function goProducts() {
  router.push('/products')
}
function goNotice() {
  router.push('/notice')
}
function goOrders() {
  router.push('/orders')
}
function openCart() {
  cartOpen.value = true
}
function goBackToProducts() {
  router.push('/products')
}
</script>

<style scoped>
.left {
  display: flex;
  align-items: center;
  gap: 4px;
}

.back-btn {
  border: 0;
  background: transparent;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  padding: 4px 6px;
  border-radius: 6px;
}

.brand {
  cursor: pointer;
  line-height: 1;
}
</style>
