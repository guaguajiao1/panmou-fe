/**
 * 鲜食定制相关类型定义
 */

import type { PetType } from './pet'
import type { Sku } from './product'

export interface RecipeQuantity {
  skuId: string
  quantity: number
}

/** 配送频率选项 */
export interface DeliveryFrequency {
  /** 频率ID */
  id: string
  /** 间隔数值 */
  interval: number
  /** 间隔单位 */
  unit: 'week' | 'month'
  /** 显示文本 */
  label: string
  /** 最大食谱数量 */
  maxRecipeCount: number
  /** 该占比+频率下的总袋数 n */
  totalPacks: number
  /** 对应食谱的数量数组 */
  recipeQuantityArray: RecipeQuantity[]
  /** 配送周期天数（用于计算每日花费） */
  deliveryDays: number
  /** 固定运费（分） */
  shippingFee: number
  /** 标签，如"最划算"、"冰箱友好" */
  tag?: string
  /** 是否推荐 */
  recommended?: boolean
  /** 是否选中 */
  selected?: boolean
}

/** 鲜食食谱SKU（包装Sku，附带用户选择数量） */
export interface FreshFoodRecipeSku {
  /** 食谱SKU（type=8 鲜食SKU） */
  sku: Sku
  /** deprecated 用户选择的数量（步进器控制） */
  quantity: number
  /** 是否推荐 */
  recommended?: boolean
}

/** 鲜食占比选项 */
export interface FreshFoodRatio {
  /** 占比ID */
  id: string
  /** 名称，如"100%鲜食" */
  name: string
  /** 描述 */
  description: string
  /** 占比百分比 */
  percentage: number
  /** 是否推荐 */
  recommended?: boolean
  /** 说明图片 */
  image?: string
  /** 该占比下的可选配送频率 */
  frequencies: DeliveryFrequency[]
  /** 该占比下的可选食谱SKU列表 */
  recipes: FreshFoodRecipeSku[]
  /** 是否选中 */
  selected?: boolean
}

/** 加入购物车/结算的请求参数 */
export interface FreshFoodOrderParams {
  /** 宠物ID */
  petId: string
  /** 选择的占比ID */
  ratioId: string
  /** 选择的配送频率ID */
  frequencyId: string
  /** 选择的食谱列表及数量 */
  recipes: { skuId: string; quantity: number }[]
}

// ========== 零食相关 ==========

export interface FreshFoodRecommendProduct {
  sku: Sku
  quantity: number
}

/** 零食配置 */
export interface FreshFoodSnacksConfig {
  /** 页面标题 */
  title: string
  /** 页面描述 */
  description: string
  /** 价格提示，如"首单免费，后续10元" */
  priceNote: string
  /** 零食列表 */
  list: FreshFoodRecommendProduct[]
}

// ========== 玩具 & 磨牙棒相关 ==========

/** 玩具 & 磨牙棒配置 */
export interface FreshFoodToysConfig {
  /** 玩具列表 */
  toyCategories: FreshFoodRecommendProduct[]
  /** 磨牙棒列表 */
  chews: FreshFoodRecommendProduct[]
  /** 玩具价格提示 */
  toyPriceNote: string
  /** 磨牙棒价格提示 */
  chewPriceNote: string
}

/** 服务端存储的完整 Plan 详情（仅用于后端定义） */
// FreshFoodPlan 移到了 mock/server.ts 中

/** 统一页面数据结构 */
export interface FreshPlanPageData {
  planId: string
  uid: string
  petId: string

  /** 宠物信息 */
  pet: PetProfile
  /** 占比配置 */
  ratios: {
    /** 可选占比列表（每个占比含各自的频率和食谱） */
    list: FreshFoodRatio[]

    /** 选择100%占比后的提示，放到配送频率正下方， 文字是"为了您有时间替换为鲜食，第二个订单我们延迟一周配送， 你随时可以修改（请润色）" */
    wholeRatioShipNote: string
  }
  /** 首单折扣百分比 */
  firstOrderDiscount: number
  /** 首单折扣提示， 放在配送频率正上方、底部结算价格正下方*/
  firstOrderNote: string

  /** 零食配置（为空或 list 为空则跳过零食步骤） */
  snacks?: FreshFoodSnacksConfig | null
  /** 玩具 & 磨牙棒配置（为空或列表都为空则跳过玩具步骤） */
  toys?: FreshFoodToysConfig | null
  createdAt: string
  updatedAt: string
}
