import type { AddressItem } from './address'
import type { Sku, DiscountDetail } from './product'

/**
 * 配送频率的单位
 * 根据业务需求可以扩展，例如 'DAY', 'MONTH'
 */
export type FrequencyUnit = 'WEEK' | 'MONTH'

/**
 * Autoship设置的来源页面或模块
 * 根据业务需求可以扩展，例如 'PDP' (商品详情页), 'CART' (购物车)
 */
export type SubscriptionSource = 'CHECKOUT' | 'default' | 'recommend'

/**
 * 描述Autoship的配送频率
 */
export interface SubscriptionFrequency {
  /**
   * 频率的数值
   * @example 4
   */
  frequency: number

  /**
   * 频率的单位
   * @example 'WEEK'
   */
  unit: FrequencyUnit
}

export interface SubscriptionFrequencyBasis {
  quantity: number
  skuId: number | string
  productId: number | string
}
/**
 * 描述应用于某个商品条目的Autoship（订阅自动发货）设置
 */
export interface Autoship {
  /**
   * 具体的配送频率设置
   */
  subscriptionFrequency: SubscriptionFrequency

  subscriptionAdjustments: SubscriptionFrequencyBasis[]
  /**
   * 用户设置此Autoship时的来源页面或模块
   */
  source: SubscriptionSource
}

export interface SubscriptionDiscount {
  subscriptionDiscountRate: string
  subscriptionDiscount: string
  firstSubscription: boolean
}

export interface OrderPreview {
  // 订单预览ID
  id: string
  // 如果订阅优惠信息
  subscriptionDiscount: SubscriptionDiscount
  // 指购物车中所有商品的总数量
  totalItemQuantity: number
  // 指所有商品在应用订单级折扣前的总价
  subtotal: string
  // 表示这是用户最终需要支付的"总计"金额
  grandTotal: string
  shippingFee: string
  // 免运费的金额
  freeShippingThreshold: string
  // 参与免运费的金额
  freeShippingEligibleAmount: string
  totalDiscount: string // 所有商品总优
  discountDetails: DiscountDetail[]
  shippingAddress?: AddressItem
  recommendedAutoships: Autoship[]
  items: Item[]
}

/** 购物车/提单页商品项 */
export interface Item {
  itemId: string
  quantity: number
  finalPrice: string // 到手价，购物车、提单页等商品卡片展示的价格
  originalPrice: string // 原始价=sku.originalPrice，商品详情页展示
  totalItemPrice: string // 商品总价 = originalPrice * quantity
  totalItemDiscount: string // 商品总优惠
  availableQuantity: number
  sku: Sku
  discountDetails: DiscountDetail[]
  purchaseType: 0 | 1
  Autoship: Autoship
}

export interface CheckoutResult {
  previewId: string
}

export type UpdateField = 'ADDRESS' | 'ITEM' | 'GLOBALSUBSCRIPTION'

export interface UpdatePreviewParams {
  updateField: UpdateField
  addressId?: number | string
  itemLevelSelection?: {
    itemId: string
    quantity: number
    purchaseType: 0 | 1
  }
  globalSubscription?: {
    subscribe: boolean
    fulfillmentSchedule: SubscriptionFrequency
  }
}

export interface PlaceOrderResult {
  orderId: string
}
