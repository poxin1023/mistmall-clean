import { getPromotionByProductId, type BuyXGetYRule, type TierPricingRule } from '../data/promotions'

type PricedLine = {
  key: string
  qty: number
  unitPrice: number
}

export type PayableLine<T extends PricedLine> = T & {
  payableQty: number
  freeQty: number
}

function toInt(v: number) {
  return Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0
}

export function getBuyXGetYRule(productId: string): BuyXGetYRule | undefined {
  return getPromotionByProductId(productId)?.buyXGetY
}

export function getTierPricingRule(productId: string): TierPricingRule | undefined {
  const promo = getPromotionByProductId(productId)
  if (!promo?.tierPricing) return undefined

  // 防呆：同商品若同時有買X送Y，預設不再疊加階梯價
  // 若未來確定要疊加，請在 promotions.ts 對該商品設 stackTierWithBuyXGetY: true
  if (promo.buyXGetY && !promo.stackTierWithBuyXGetY) return undefined

  return promo.tierPricing
}

export function calcGiftQtyFromSelectedQty(selectedQty: number, buy: number, free: number) {
  const q = toInt(selectedQty)
  const b = toInt(buy)
  const f = toInt(free)
  if (q <= 0 || b <= 0 || f <= 0) return 0
  const cycle = b + f
  if (cycle <= 0) return 0
  return Math.floor(q / cycle) * f
}

export function calcNextGiftNeed(selectedQty: number, buy: number, free: number) {
  const q = toInt(selectedQty)
  const b = toInt(buy)
  const f = toInt(free)
  if (b <= 0 || f <= 0) return 0
  const cycle = b + f
  if (q <= 0) return cycle
  const mod = q % cycle
  return mod === 0 ? cycle : cycle - mod
}

export function calcTierUnitPrice(productId: string, selectedQty: number, fallback: number) {
  const tier = getTierPricingRule(productId)
  if (!tier) return fallback

  const q = toInt(selectedQty)
  const step = toInt(tier.step)
  const firstPrice = Number.isFinite(tier.firstPrice) ? tier.firstPrice : fallback
  const delta = Number.isFinite(tier.deltaPerStep) ? tier.deltaPerStep : 0
  const minPrice = tier.minPrice !== undefined && Number.isFinite(tier.minPrice) ? tier.minPrice : undefined

  if (step <= 0 || q <= 0) return firstPrice

  const level = Math.floor(Math.max(0, q - 1) / step)
  let price = firstPrice - level * delta
  if (minPrice !== undefined) price = Math.max(minPrice, price)
  return Math.max(0, Math.floor(price))
}

export function calcPayableLines<T extends PricedLine>(productId: string, lines: T[]): Array<PayableLine<T>> {
  const cleaned = lines.filter((l) => l.qty > 0).map((l) => ({ ...l }))
  const rule = getBuyXGetYRule(productId)

  if (!rule) {
    return cleaned.map((l) => ({ ...l, payableQty: l.qty, freeQty: 0 }))
  }

  const selectedQty = cleaned.reduce((acc, l) => acc + toInt(l.qty), 0)
  const totalGiftQty = calcGiftQtyFromSelectedQty(selectedQty, rule.buy, rule.free)
  if (totalGiftQty <= 0) {
    return cleaned.map((l) => ({ ...l, payableQty: l.qty, freeQty: 0 }))
  }

  // 贈品優先扣在單價高的規格，對客戶最有利
  const sorted = [...cleaned].sort((a, b) => b.unitPrice - a.unitPrice)
  const byKey = new Map<string, { payableQty: number; freeQty: number }>()

  let remain = totalGiftQty
  for (const l of sorted) {
    const freeQty = Math.min(l.qty, remain)
    const payableQty = l.qty - freeQty
    remain -= freeQty
    byKey.set(l.key, { payableQty, freeQty })
  }

  return cleaned.map((l) => {
    const mapped = byKey.get(l.key)
    return {
      ...l,
      payableQty: mapped?.payableQty ?? l.qty,
      freeQty: mapped?.freeQty ?? 0
    }
  })
}
