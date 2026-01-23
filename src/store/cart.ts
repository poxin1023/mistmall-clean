// src/store/cart.ts
import { defineStore } from 'pinia'

export type CartVariantLine = {
  key: string
  name: string
  qty: number
  unitPrice: number
}

export type CartItem = {
  itemId: string
  productId: string
  productName: string
  lines: CartVariantLine[]
  displayQty: number
}

// ✅ 促銷商品 id
export const PROMO_PRODUCT_ID = 'sp2s_pod_bundle'

function newItemId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`
}

/**
 * ✅ SP2S 促銷折抵規則：11 件算 10 件（買10送1、買20送2…）
 * - q < 10 => 0
 * - q % 10 === 0 => 0（剛好整10件，不折抵）
 * - 其他 => floor(q/10)
 */
function calcFreeDeductQty_SP2S(selectedQty: number) {
  if (selectedQty < 10) return 0
  if (selectedQty % 10 === 0) return 0
  return Math.floor(selectedQty / 10)
}

// ✅ badge/抽屜標題顯示用件數（含贈品）
export function calcDisplayQty(productId: string, selectedQty: number) {
  if (selectedQty <= 0) return 0
  if (productId === PROMO_PRODUCT_ID) {
    const gift = Math.floor(selectedQty / 10)
    return selectedQty + gift
  }
  return selectedQty
}

function sumSubtotal(lines: CartVariantLine[]) {
  return lines.reduce((acc, l) => acc + l.qty * l.unitPrice, 0)
}

/**
 * ✅ 促銷折抵分配：單價高的先折抵（對客戶最有利）
 */
function calcPayableLinesWithPromo(productId: string, lines: CartVariantLine[]) {
  const cleaned = lines.filter(l => l.qty > 0)

  if (productId !== PROMO_PRODUCT_ID) {
    return cleaned.map(l => ({ ...l, payableQty: l.qty }))
  }

  const selectedQty = cleaned.reduce((acc, l) => acc + l.qty, 0)
  const freeDeductQty = calcFreeDeductQty_SP2S(selectedQty)

  if (freeDeductQty <= 0) {
    return cleaned.map(l => ({ ...l, payableQty: l.qty }))
  }

  const sorted = [...cleaned].sort((a, b) => b.unitPrice - a.unitPrice)

  let remain = freeDeductQty
  const mapped: Array<CartVariantLine & { payableQty: number }> = []

  for (const l of sorted) {
    const canFree = Math.min(l.qty, remain)
    const payableQty = l.qty - canFree
    remain -= canFree
    mapped.push({ ...l, payableQty })
  }

  // 還原原本順序，避免畫面跳動
  const byKey = new Map(mapped.map(x => [x.key, x]))
  return cleaned.map(l => byKey.get(l.key) ?? ({ ...l, payableQty: l.qty }))
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as CartItem[]
  }),

  getters: {
    totalDisplayQty(state) {
      return state.items.reduce((acc, it) => acc + (it.displayQty || 0), 0)
    },

    // ✅ 總金額：每張卡片各自套用促銷折抵後再加總
    totalAmount(state) {
      return state.items.reduce((acc, it) => {
        if (it.productId === PROMO_PRODUCT_ID) {
          const payable = calcPayableLinesWithPromo(it.productId, it.lines)
          const amount = payable.reduce((a, l) => a + l.payableQty * l.unitPrice, 0)
          return acc + amount
        }
        return acc + sumSubtotal(it.lines)
      }, 0)
    }
  },

  actions: {
    clear() {
      this.items = []
    },

    // 兼容保留：移除「該商品所有卡片」
    removeItem(productId: string) {
      this.items = this.items.filter(i => i.productId !== productId)
    },

    // 移除「單一卡片」
    removeItemById(itemId: string) {
      const idx = this.items.findIndex(i => i.itemId === itemId)
      if (idx >= 0) this.items.splice(idx, 1)
    },

    // 新增一張卡片
    addItem(payload: {
      productId: string
      productName: string
      lines: CartVariantLine[]
    }) {
      const cleanedLines = payload.lines.filter(l => l.qty > 0)
      const selectedQty = cleanedLines.reduce((acc, l) => acc + l.qty, 0)
      const displayQty = calcDisplayQty(payload.productId, selectedQty)

      if (cleanedLines.length === 0 || displayQty <= 0) return

      const item: CartItem = {
        itemId: newItemId(),
        productId: payload.productId,
        productName: payload.productName,
        lines: cleanedLines,
        displayQty
      }

      this.items.push(item)
    },

    // ✅ 更新單一卡片的 lines（重點修正：避免 this.items[idx] 被推成 undefined 造成欄位變 optional）
    updateItemLines(payload: {
      itemId: string
      lines: CartVariantLine[]
    }) {
      const idx = this.items.findIndex(i => i.itemId === payload.itemId)
      if (idx < 0) return

      const current = this.items[idx]
      if (!current) return // ✅ TS 保底（解 TS2532）

      const cleanedLines = payload.lines.filter(l => l.qty > 0)
      const selectedQty = cleanedLines.reduce((acc, l) => acc + l.qty, 0)
      const displayQty = calcDisplayQty(current.productId, selectedQty)

      if (cleanedLines.length === 0 || displayQty <= 0) {
        this.items.splice(idx, 1)
        return
      }

      // ✅ 明確回寫必要欄位，避免 itemId/productId/productName 被推成可選（解 TS2322）
      const next: CartItem = {
        itemId: current.itemId,
        productId: current.productId,
        productName: current.productName,
        lines: cleanedLines,
        displayQty
      }

      this.items[idx] = next
    },

    // 給 CartDrawer 用：回傳「促銷後各規格應計價數量」
    getPayableLines(productId: string, lines: CartVariantLine[]) {
      return calcPayableLinesWithPromo(productId, lines)
    }
  }
})
