/** 商品详情页数据（最外层） */
export interface ProductData {
  product?: ProductInfo
  skuBase?: SkuBase
  skuCore?: SkuCore
}

export interface ProductInfo {
  productId?: string
  type: number // 1=单品, 3=SPU入口, 7=组合商品
  title: string
  images?: string[]
  desc?: string
  price?: number // 价格（分）
  priceText?: string
  customizationMode: number
  tags?: ProductTag[]
  vagueSellCount?: string
  industryParamVO?: IndustryParamVO
  detailImages?: string[]
}

/** 商品标签 */
export interface ProductTag {}

/** 行业参数 */
export interface IndustryParamVO {
  basicParamList?: BasicParam[]
  enhanceParamList?: BasicParam[]
}

/** 基础参数项 */
export interface BasicParam {
  propertyName?: string
  valueName?: string
}

/* ================== skuBase ================== */

/** 规格维度*/
export interface SkuBase {
  props?: SkuProp[]
  skus?: SkuMapping[]
}

export interface SkuProp {
  pid: string
  name?: string
  values?: SkuPropValue[]
}

export interface SkuPropValue {
  name?: string
  sortOrder?: string
  vid?: string
  spread?: string // 加价文案
}

export interface SkuMapping {
  propPath: string // 规格路径
  skuId: string
}

/* ================== skuCore ================== */

export interface SkuCore {
  sku2info: { [skuId: string]: Sku }
}

/** SKU信息（products[] 数组转 Map） */
export interface Sku {
  skuId: string
  productId: string
  strikeThroughPrice: string // 划线价，商品详情页展示
  advertisedPrice: string // 广告价
  originalPrice: string // advertisedPrice，无advertisedPrice时为strikeThroughPrice，原始价格
  subscriptionPrice: string // 订阅价
  name: string
  image: string[]
  desc: string
  specs: string // 规格文字
  type: number // 1=单品, 7=组合SKU， 8=鲜食sku，9=随机sku（比如宠物玩具）
  comboItems?: ComboItem[] // 仅套餐SKU有
  comboDiscount?: string // 组合优惠金额
  /** 是否支持订阅 */
  supportsSubscription: boolean
  /** 订阅优惠率，0-100,字符串类型只用来展示，不参与计算 */
  subscriptionDiscountRate: string
  /** 订阅优惠文字（格式化字符串，仅展示） */
  subscriptionDiscount: string
  maxQuantity: number
  customization?: Customization
  tags?: ProductTag[]
}

/* ================== 组合商品 ================== */

/** 套餐选择组（comboItems[]） */
export interface ComboItem {
  comboItemId: string
  skuId: string
  productId: string
  idx: number
  round: number
  name: string
  isChoices: number
  quantity: number
  maxQuantity: number
  minQuantity: number
  className: string
  classDefaultImg?: string
  comboProducts: ComboProduct[]
}

/** 套餐内可选商品 */
export interface ComboProduct {
  comboItemId: string
  skuId: string // 子商品skuId
  productId: string // 子商品productId
  name: string
  image: string
  price: string // 套餐内价格
  priceText: string
  originalPrice?: string
  isDefault: number
  quantity: number
  comboMaxQuantity?: number
  hasCustomization?: number
  customization?: Customization
  tags?: ProductTag[]
}

/* ================== 自定义选项 ================== */

export interface Customization {
  items?: CustomItem[]
}

/** 定制项（如冰量，displayMode=1） */
export interface CustomItem {
  code: string
  name: string
  image?: string
  mode: number
  displayMode: number
  values: CustomValue[]
}

export interface CustomValue {
  code: string
  name: string
  image?: string
  checked: number // 1=默认选中
}

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

export interface SubscriptionAdjustment {
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

  subscriptionAdjustments: SubscriptionAdjustment[]
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
   * 优惠的金额（格式化字符串，通常为负值，仅展示）。
   */
  amount: string

  /**
   * 优惠的展示级别
   */
  displayLevel: DiscountDisplayLevel

  /**
   * 优惠作用的目标
   */
  discountTarget?: DiscountTarget
}

/**
 * 商品卡片 Props — 展示所需的最小数据
 * 不嵌套 Sku 等业务模型；操作相关字段由父组件通过 slot 管理
 */
export interface ProductCardProps {
  /** 唯一标识 */
  itemId: string
  /** 商品图片 URL */
  image: string
  /** 商品名称 */
  name: string
  /** 规格文字 */
  specs?: string
  /** 到手价 / 最终价格 (格式化字符串) */
  finalPrice: string
  /** 原价 / 划线价 (格式化字符串，为空时不展示) */
  originalPrice?: string
  /** 已选数量 */
  quantity?: number
  /** 商品总价 (单价 × 数量，格式化字符串) */
  totalPrice?: string
  /** 总优惠文案 (如 "-¥5.00")，点击展开优惠明细弹窗 */
  totalDiscount?: string
  /** 优惠明细列表 */
  discountDetails?: DiscountDetail[]
}
