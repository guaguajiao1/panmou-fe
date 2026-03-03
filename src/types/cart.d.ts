import type { DiscountDetail } from './checkout'
import type { Sku } from './product'
/** 购物车类型 */
export type CartItem = {
  itemId: string
  quantity: number
  finalPrice: string // 到手价，购物车、提单页等商品卡片展示的价格
  originalPrice: string // 原始价=sku.originalPrice，商品详情页展示
  totalItemPrice: string // 商品总价 = originalPrice * quantity
  totalItemDiscount: string // 商品总优惠
  availableQuantity: number
  sku: Sku
  selected: boolean
  /** 加入时价格（格式化字符串，仅展示） */
  addedPrice: string
  /** 是否为有效商品 */
  isEffective: boolean
  /** 购买方式，0-一次性购买，1-订阅购买 */
  purchaseType: 0 | 1
  discountDetails: DiscountDetail[]
}

export interface Cart {
  uid: string
  cartId: string
  // 指购物车中所有商品的总数量
  totalItemQuantity: number
  // 指所有商品在应用订单级折扣前的总价
  subtotal: string
  // 表示这是用户最终需要支付的"总计"金额
  grandTotal: string
  // 运费
  shippingFee: string
  // 满免运费门槛
  freeShippingThreshold: string
  // 免运费活动的金额
  freeShippingEligibleAmount: string
  totalDiscount: string // 所有商品总优惠
  // 优惠、折扣
  discountDetails: DiscountDetail[]

  items: CartItem[]
}

/** 通用加入购物车请求参数（支持批量商品 + 鲜食 Plan） */
export interface AddToCartParams {
  /** 批量商品 */
  items?: { productId: string; skuId: string; quantity: number; purchaseType: 0 | 1 }[]
  /** 鲜食 planId */
  planId?: string
  /** 鲜食用户选择 */
  planSelections?: {
    ratioId: string
    frequencyId: string
    recipes: { skuId: string; quantity: number }[]
  }
}
