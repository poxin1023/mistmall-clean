// src/data/promotions.ts

export type PromotionRule =
  | {
      type: 'BUY_X_GET_Y' // 買X送Y
      buy: number
      free: number
    }
  | {
      type: 'TIER_PRICING' // 階梯單價（每 step 件一階）
      step: number
      firstPrice: number
      deltaPerStep: number
      minPrice?: number
    }

export type ProductPromotion = {
  productId: string
  title: string
  rules: PromotionRule[]
}

/**
 * 只把「特定商品」放在這裡，其他商品不寫，就完全不套用活動。
 *
 * 你 products.ts 促銷商品 id = sp2s_pod_bundle
 * 規則：每滿 11 件折 1 件（11 件收 10 件）
 */
export const PROMOTIONS: ProductPromotion[] = [
  {
    productId: 'sp2s_pod_bundle',
    title: '每滿11件折1件（11件收10件）',
    rules: [
      // 促銷顯示用途：每滿 11 件，折抵 1 件金額（11 件收 10 件）
      { type: 'BUY_X_GET_Y', buy: 10, free: 1 }
    ]
  }
]

export function getPromotionByProductId(productId: string): ProductPromotion | undefined {
  return PROMOTIONS.find(p => p.productId === productId)
}
