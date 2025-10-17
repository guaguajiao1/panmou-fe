import type { AddressItem } from './address'

/**
 * 配送频率的单位
 * 根据业务需求可以扩展，例如 'DAY', 'MONTH'
 */
export type FrequencyUnit = 'WEEK' | 'MONTH'

/**
 * Autoship设置的来源页面或模块
 * 根据业务需求可以扩展，例如 'PDP' (商品详情页), 'CART' (购物车)
 */
export type SubscriptionSource = 'CHECKOUT'

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

export interface SubscriptionAjudgement {
  quantity: number
  skuId: number | string
  productId: number | string
  partNumber: string
}
/**
 * 描述应用于某个商品条目的Subscription（订阅）设置
 */
export interface Subscription {
  /**
   * 具体的配送频率设置
   */
  subscriptionFrequency: SubscriptionFrequency

  subscriptionAjudgements: SubscriptionAjudgement[]
  /**
   * 用户设置此Subscriptio时的来源页面或模块
   */
  source: SubscriptionSource
}

/**
 * 优惠应用的展示级别
 */
export type DiscountDisplayLevel = 'ORDER' | 'ITEM'

/**
 * 优惠作用的目标
 */
export type DiscountTarget = 'PRODUCT' | 'SHIPPING' | string

/**
 * 描述一个折扣的详细信息
 */
export interface DiscountDetail {
  /**
   * 优惠的描述性标签，用于UI展示
   */
  label: string

  /**
   * 标记此优惠是否为周期性优惠（即是否会随每次自动配送重复生效）
   * false 表示这是一个一次性优惠
   */
  isRecurring: boolean

  /**
   * 优惠活动的系统ID
   */
  promotionId: string

  /**
   * 用户输入的或系统自动应用的优惠码
   */
  promotionCode: string

  /**
   * 优惠的金额。通常为负值字符串。
   */
  amount: number

  /**
   * 优惠的展示级别
   */
  displayLevel: DiscountDisplayLevel

  /**
   * 优惠作用的目标
   */
  discountTarget?: DiscountTarget
}

export interface Sku {
  productId: number | string
  skuId: number | string
  name: string
  specs: string
  image: string
  strikeThroughPrice: number
  adjustedPrice: number
  supportSubscription: boolean
  subscriptionDiscountRate: number
  subscriptionDiscount: number
  onceDiscountRate: number
  onceDiscount: number
}

export interface Item {
  id: number | string
  quantity: number
  totalPrice: number
  totalDiscount: number
  availableQuantity: number
  sku: Sku
  discountDetails: DiscountDetail[]
  purchaseType: 0 | 1 // 0-一次性购买，1-订阅购买
  subscription: Subscription
}

export interface SubscriptionDiscount {
  subscriptionDiscountRate: number
  subscriptionDiscount: number
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
  subtotal: number
  // 表示这是用户最终需要支付的“总计”金额
  grandTotal: number
  shippingFee: number
  freeShippingThreshold: number
  eligibleSubtotalForFreeShipping: number
  discountDetails: DiscountDetail[]
  shippingAddress?: AddressItem
  recommendSubscriptions: Subscription[]
  items: Item[]
}

export interface CheckoutResult {
  previewId: string
}

export type UpdateField = 'ADDRESS' | 'ITEM' | 'GLOBALSUBSCRIPTION'

export interface UpdatePreviewParams {
  updateField: UpdateField
  addressId?: number | string
  itemLevelSelection: {
    itemId: number
    partNumber: string
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
