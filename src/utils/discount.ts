/**
 * 促销规则：订单 ≥2 件时，最低价那件保持原价（价格并列时取遍历到的第一个），其余按 8 折。
 * 确认订单页与订单详情页的「优惠明细」共用这套计算，改动请只改这里。
 */
export const DISCOUNT_RATE = 0.8;

export interface DiscountedPrice {
  /** 原价 */
  originalPrice: number;
  /** 折后价（未参与打折的商品与原价相同） */
  price: number;
  /** 该件优惠了多少 */
  discountAmount: number;
  /** 是否参与打折（最低价那件为 false） */
  discounted: boolean;
}

/**
 * 按「最低价原价、其余 8 折」计算每件商品的价格。
 * @param originalPrices 每件商品的原价，顺序即展示顺序
 */
export function calcDiscountedPrices(originalPrices: number[]): DiscountedPrice[] {
  if (originalPrices.length === 0) return [];

  // 最低价下标（单件时即 0，等于不参与折扣）
  const cheapestIndex = originalPrices.reduce(
    (minIdx, price, i) => (price < originalPrices[minIdx] ? i : minIdx),
    0,
  );

  return originalPrices.map((originalPrice, i) => {
    const discounted = i !== cheapestIndex;
    const price = discounted ? Number((originalPrice * DISCOUNT_RATE).toFixed(2)) : originalPrice;
    return {
      originalPrice,
      price,
      discountAmount: Number((originalPrice - price).toFixed(2)),
      discounted,
    };
  });
}
