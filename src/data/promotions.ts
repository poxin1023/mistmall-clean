// src/data/promotions.ts
export const BUY10_GET1_PRODUCT_ID = 'sp2s_pod_bundle'

export type BuyXGetYRule = {
  buy: number
  free: number
}

export type TierPricingRule = {
  step: number
  firstPrice: number
  deltaPerStep: number
  minPrice?: number
}

export type ProductPromotion = {
  productId: string
  title: string
  buyXGetY?: BuyXGetYRule
  tierPricing?: TierPricingRule
  // 預設 false：避免同時套用「買X送Y + 階梯價」造成重複優惠
  stackTierWithBuyXGetY?: boolean
}

/**
 * 純活動資料：只描述「哪個商品有什麼活動」
 * 計算邏輯請集中在 src/promotions/engine.ts
 */
export const PROMOTIONS: ProductPromotion[] = [
  {
    productId: BUY10_GET1_PRODUCT_ID,
    title: '買10件可再選1件免費（同商品不同規格累計）',
    buyXGetY: { buy: 10, free: 1 }
  }
]

export function getPromotionByProductId(productId: string) {
  return PROMOTIONS.find((p) => p.productId === productId)
}
