import type { AddressItem } from './address'

/**
 * 响应数据的主体
 */
export interface AutoshipData {
  /**
   * Autoship 订阅详情
   */
  subscription: Subscription
  /**
   * 当前用户信息
   */
  currentUser: CurrentUser
  /**
   * 根级别的支付方式列表 (在此抓包中仅包含账户余额)
   */
  paymentMethods: PaymentMethod[]
}

/**
 * 订阅 (Subscription) 详情
 * 这是核心的数据对象
 */
export interface Subscription {
  id: string
  state: string // "ACTIVE"
  fulfillmentRequestId: string
  name: string // "Autoship #1"
  authorizationDate: string
  startDate: string
  /**
   * 配送信息
   */
  fulfillment: Fulfillment
  /**
   * 配送地址
   */
  address: AddressItem
  /**
   * 应付金额
   */
  amountDue: Amount
  blocked: boolean
  blocks: Block[] // 在抓包1中为空数组
  currency: string // "USD"
  /**
   * 订阅中的所有商品列表
   */
  items: Item[]
  /**
   * 相关的历史订单
   */
  orders: Order[]
  /**
   * 订单总额 (最重要)
   * 计算方式: 所有未跳过 (skipNext: false) 的 items.totalProduct 的总和
   * 示例: 35.20 = 19.02 + 16.18
   */
  totalOrder: string
  /**
   * 商品基础总价 (所有未跳过商品 price 的总和)
   * 示例: 27.98 = 14.99 + 12.99
   */
  totalProduct: string
  /**
   * 总运费 (所有未跳过商品的 ShippingAmount 总和)
   * 示例: 4.95 = 2.48 + 2.47
   */
  totalShipping: string
  /**
   * 总销售税 (所有未跳过商品的 SalesTax 总和)
   * 示例: 2.48 = (0.6 + 0.68 + 0.05) + (0.52 + 0.58 + 0.05)
   */
  totalTax: string
  /**
   * 总运费税 (所有未跳过商品的 ShippingTax 总和)
   * 示例: 0.44 = (0.08 + 0.07 + 0.07) + (0.08 + 0.07 + 0.07)
   */
  totalTaxShipping: string
  totalLoyaltyHealthcareAdjustment: Amount
  totalLoyaltyRewardsAdjustment: Amount
  totalLoyaltyEarnedRewards: Amount
  orderedWithinLastSevenDays: boolean
  placed: string
  paymentFailureCount: number
  /**
   * 此订阅绑定的支付方式
   */
  payments: Payment[]
  promos: Promo[] // 在抓包1中为空数组
  /**
   * 订阅概要信息 (嵌套)
   */
  subscriptions: SubscriptionSummary[]
}

/**
 * 金额对象
 */
export interface Amount {
  amount: number
  currency: string
}

/**
 * 配送信息
 */
export interface Fulfillment {
  nextShipment: string
  followingShipment: string
  frequency: Frequency
  frequencyPairings: FrequencyPairing[]
}

/**
 * 频率
 */
export interface Frequency {
  unit: string // "Week"
  interval: number // 5
}

/**
 * 可选频率配对
 */
export interface FrequencyPairing {
  frequency: Frequency
  date: string
}

/**
 * 订阅中的单个商品项
 */
export interface Item {
  /**
   * 价格调整项 (运费、税费、折扣)
   */
  adjustments: Adjustment[]
  siteId: string
  /**
   * 折扣总额 (所有 "Promotion" 类型的 amount 总和)
   * 示例: "-0.65"
   */
  totalAdjustments: string
  /**
   * 折扣总额 (同 totalAdjustments)
   * 示例: "-0.65"
   */
  totalDiscountAdjustment: string
  /**
   * 此行项目总价 (包含单价、数量、所有调整项)
   * 等式: (price * quantity) + (所有 adjustments 的 amount 总和)
   * 示例: 16.18 = (12.99 * 1) + (2.47 - 0.65 + 0.08 + ... + 0.05)
   */
  totalProduct: string
  /**
   * 商品单价 (基础价格)
   * 示例: "12.99"
   */
  price: string
  quantity: number
  /**
   * 是否跳过下次发货
   */
  skipNext: boolean
  /**
   * 商品的静态目录信息
   */
  item: ItemDetails
  bundleComponentItems: any[] // 在抓包1中为空数组
  fulfillmentItemId: string
  isVirtualBundle: boolean
  autoAdd: boolean
  contactVet: boolean
  clinic: object // 在抓包1中为空对象
  pet: object // 在抓包1中为空对象
  oosReplacement: OosReplacement
  oneTime: boolean
  subscriptionId: string
}

/**
 * 商品价格调整项 (运费、税费、折扣)
 */
export interface Adjustment {
  type: string // "ShippingAmount", "Promotion", "ShippingTax", "SalesTax"
  amount: string // "2.48", "-0.65"
  code: string | null
  id: string | null // "132"
  description: string | null
  shortDescription: string | null
  displayLevel: string | null // "ORDERITEM"
}

/**
 * 商品的目录详情
 */
export interface ItemDetails {
  id: string
  name: string
  partNumber: string
  brand: string
  description: string
  isGiftCard: boolean
  isPharma: boolean
  isVetDiet: boolean
  isFrozen: boolean
  thumbnail: string // URL
  isSingleTablet: boolean
  isAutoshipAllowed: boolean
  petTypes: any[] // 在抓包1中为空数组
  rxFrequency: object // 在抓包1中为空对象
  foodFlavor: any[] // 在抓包1中为空数组
  size: ItemSize[] // 商品2 含有此数据
}

/**
 * 商品尺寸信息
 */
export interface ItemSize {
  id: number
  identifier: string
  values: ItemSizeValue[]
}

export interface ItemSizeValue {
  id: number
  value: string // "Large/X-Large"
}

/**
 * 缺货替换信息
 */
export interface OosReplacement {
  isOos: boolean
  alternatives: any[] // 在抓包1中为空数组
}

/**
 * 历史订单
 */
export interface Order {
  id: string
  status: string // "DEPOSITED"
  placed: string
  shipped: string
}

/**
 * 订阅绑定的支付方式
 */
export interface Payment {
  paymentMethodType: string // "APPLEPAY"
  instructionId: string
  walletId: string
  paymentMethod: {
    id: string
    detail: {
      __typename: string // "ApplePay"
    }
  }
}

/**
 * 促销信息 (在抓包1中为空)
 */
export interface Promo {
  id: string
  code: string
  shortDescription: string
}

/**
 * 订阅概要 (嵌套)
 */
export interface SubscriptionSummary {
  lastChildOrderStatus: string // "S"
  properties: {
    planType: null
  }
  paymentFailureCount: number
}

/**
 * 订阅阻断信息 (在抓包1中为空)
 */
export interface Block {
  reason: string
  resolved: boolean
}

// --- CurrentUser (当前用户) 定义 ---

export interface CurrentUser {
  lifetimeSavings: LifetimeSavings
  isPullForwardOptOut: boolean
}

/**
 * 累计节省金额
 */
export interface LifetimeSavings {
  amountSaved: Amount
  savingsSinceMonths: number
  savingsSinceYear: number
}

// --- PaymentMethods (根级别支付方式) 定义 ---

/**
 * 根级别的支付方式
 */
export interface PaymentMethod {
  id: string
  paymentMethodType: string // "ACCOUNTBALANCE"
  detail: AccountBalanceDetail
}

/**
 * 账户余额详情
 */
export interface AccountBalanceDetail {
  id: string
  balance: Amount
}

export type UpdateType =
  | 'CHANGE_NEXTORDER_DATE'
  | 'SKIP_NEXTORDER'
  | 'ORDER_NOW'
  | 'CHANGE_FREQUENCY'
  | 'SKIP_ONCE_ITEM'
  | 'ADD_BACK_ITEM'
  | 'CANCEL_SUBSCRIPTION'

export interface UpdateSubscriptionParams {
  subscriptionId: string
  type: UpdateType
  nextOrderDate?: string
  frequency?: SubscriptionFrequency
  itemId?: string
}

export interface SimpleAutoshipData {
  subscription: {
    id: string
    state: string
    name: string
    address: AddressItem
    fulfillment: {
      frequency: Frequency
      nextShipment: string
    }
    items: {
      id: string
      item: {
        id: string
        name: string
        quantity: number
        partNumber: string
        thumbnail: string
      }
    }[]
  }
  currentUser: CurrentUser
}
