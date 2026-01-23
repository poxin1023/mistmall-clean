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
 * 你 products.ts 圖中「買10送1」商品 id = sp2s_pod_bundle
 * 名稱：SP2S 買10送1 20送2
 */
export const PROMOTIONS: ProductPromotion[] = [
  {
    productId: 'sp2s_pod_bundle',
    title: '買10送1（20送2）+ 階梯單價',
    rules: [
      // 買10送1
      { type: 'BUY_X_GET_Y', buy: 10, free: 1 },

      // 階梯單價：
      // 1~9 => 300
      // 10~19 => 272（300 - 28）
      // 20~29 => 244（272 - 28）
      // 以此類推
      { type: 'TIER_PRICING', step: 10, firstPrice: 300, deltaPerStep: 28, minPrice: 0 }
    ]
  }
]

export function getPromotionByProductId(productId: string): ProductPromotion | undefined {
  return PROMOTIONS.find(p => p.productId === productId)
}
